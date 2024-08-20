const asyncHandler = require("express-async-handler");
const { WEB3_MANAGER_ACCOUNT, encodePacked, WEB3_CONTRACT, web3 } = require("../config/web3");
const TokenSalt = require("../models/TokenSalt");
const Campaign = require("../models/Campaign");
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');
const RedeemableToken = require("../models/RedeemableToken");
const generateQRCodes = require("./utils/qrcode_generator");

const retrieveBlockchainError = (error) => {
    try{
        errorMessage = error.cause.message
        // Find the position of 'revert'
        let revertPosition = errorMessage.indexOf('revert');

        // Extract the part after 'revert'
        if (revertPosition !== -1) {
            let relevantMessage = errorMessage.slice(revertPosition + 'revert'.length).trim();
            return relevantMessage;
        } else {
            return error;
        }
    } catch (error) {
        return error;
    }
}


// @desc Generate all tokens for a campaign
// @route POST /campaign/:id/tokens
// @access Donor
const generateTokens = asyncHandler(async (req, res) => {
    const campaignId = req.params.id;
    const campaign = await Campaign.findById(campaignId).exec();
    if (!campaign) {
        res.status(404);
        throw new Error("Campaign not found");
    }
    campaignAddress = campaign.campaignId;
    if(!campaignAddress){
        res.status(400);
        throw new Error("Campaign not associated with a blockchain campaign");
    }

    const wallet = req.session.wallet;
    if (!wallet) {
        res.status(400);
        throw new Error("Wallet not found");
    }

    try{
        // Generate the seed(St) that is used to generate the tokens T1
        const tokenSeed = crypto.createHash('sha256').update(campaign.seed + new Date().getTime()).digest('hex');

        if(process.env.DEBUG) console.log(campaign);
        // Generate the tokens T1
        const t1_tokens = Array.from({ length: campaign.maxTokensCount }, (_, i) => {
            return web3.utils.toHex(crypto.createHash('sha256').update(tokenSeed + i).digest('hex'));
        });
        if(process.env.DEBUG) console.log('t1_tokens', t1_tokens);
        
        // generate randomlyh token indexes
        const salts = Array.from({ length: campaign.maxTokensCount }, (_, i) => crypto.createHash('sha256').update(String(i + new Date().getTime())).digest('hex'));
        if(process.env.DEBUG) console.log('salts', salts);

        // Create the TokenSalt objects to save on db
        const tokenSalts = t1_tokens.map((token, i) => {
            return {
                campaignId: campaign._id,
                hash: crypto.createHash('sha256').update(token).digest('hex'),
                salt: salts[i]
            };
        });
        await TokenSalt.insertMany(tokenSalts);
        if(process.env.DEBUG) console.log('tokenSalts', tokenSalts);
        
        // Generate the tokens T1.5
        const t15_tokens = t1_tokens.map((token, i) => {
            return web3.utils.toHex(crypto.createHash('sha256').update(token + salts[i]).digest('hex'));
        });
        if(process.env.DEBUG) console.log('t15_tokens', t15_tokens);

        // Generate the tokens T2
        // batch this call by dividing the tokens into chunks of 100
        divided_tokens = Array.from({ length: Math.ceil(t15_tokens.length / 100) }, (_, i) => {
            return t15_tokens.slice(i * 100, (i + 1) * 100);
        });
        if(process.env.DEBUG) console.log('divided_tokens', divided_tokens);
        const t2_tokens = [];
        for (const chunk of divided_tokens){
            const chunk_t2_tokens = await WEB3_CONTRACT.methods.generateTokenHashes(campaignAddress, chunk).call({ from: WEB3_MANAGER_ACCOUNT.address });
            if(process.env.DEBUG) console.log('chunk ', chunk, ': t2_tokens', chunk_t2_tokens);
            t2_tokens.push(...chunk_t2_tokens);
        }

        // Create the signature for the tokens
        const tokenSignatures = t2_tokens.map(token => {
            return web3.eth.accounts.sign(encodePacked(web3.utils.toHex(token), campaignAddress), wallet.privateKey);
        });
        if(process.env.DEBUG) console.log('tokenSignatures', tokenSignatures);

        signed_tokens = t1_tokens.map((token, i) => {
            return {
                token: token,
                signature: tokenSignatures[i].signature,
            };
        });
        if(process.env.DEBUG) console.log('signed_tokens', signed_tokens);

        const expirationTime = Math.floor(campaign.deadline.getTime() / 1000);
        const secretKey = process.env.REFRESH_TOKEN_SECRET + "";
        const jwt_tokens = signed_tokens.map((token) => {
            return {
                token: jwt.sign({
                        campaignId: campaignId,
                        campaignAddress: campaignAddress,
                        tokenId: token.token,
                        signature: token.signature,
                    },
                    secretKey,
                    { expiresIn: expirationTime
                })
            }
        })
        if(process.env.DEBUG) console.log(jwt_tokens)

        if(process.env.QR_CODE_GENERATION_ON_SERVER === 'true') {
            if(process.env.DEBUG) console.log("Starting qr code generation to pdf in worker thread");
            // Generate QR codes in a worker thread
            generateQRCodes(campaignId, jwt_tokens).then(async (fileName) => {
                campaign.qrCodes = fileName;
                await campaign.save();
                console.log("QR codes generated in worker thread:", fileName);
            }).catch((error) => {
                console.log("Error generating QR codes in worker thread:", error);
            });
        }

        res.json({ signedTokens: jwt_tokens });
        
    } catch (error) {
        if(process.env.DEBUG) console.log('Error generating tokens:', error);
        res.status(400).json({ message: "Error generating tokens: " + error.message });
    }
});


// @desc Redeem token
// @route POST /tokens/redeem
// @access Public
const redeemToken = asyncHandler(async (req, res) => {
    // Get the token from the request body
    const token = req.body.token;
    const campaignId = req.body.campaignId;
    const signature = req.body.signature;

    if (!token || !campaignId || !signature) {
        res.status(400);
        throw new Error("Redeem token request is missing parameters");
    }

    // check if campaign exists
    const campaign = await Campaign.findById(campaignId).exec();
    if (!campaign) {
        res.status(404);
        throw new Error("Campaign not found");
    }
    if (!campaign.campaignId) {
        res.status(400);
        throw new Error("Campaign not associated with a blockchain campaign");
    }
    const campaignAddress = campaign.campaignId;

    // check if the token salt is present in db
    if(process.env.DEBUG) console.log('campaignId', campaignId);
    if(process.env.DEBUG) console.log('token', token);
    try{
        [tokenSalt, t15_token] = await recoverT15Token(campaignId, token);
    } catch (error) {
        if(process.env.DEBUG) console.log('Error redeeming token:', error);
        return res.status(400).json({ message: "Error redeeming token: " + error.message });
    }
    if(process.env.DEBUG) console.log("tokenSalt", tokenSalt);

    // signature is 65 bytes long, convert it to r, s, v
    const { v, r, s } = ethUtil.fromRpcSig(signature);

    try {
        if(tokenSalt && tokenSalt.redeemed){
            return res.status(400).json({ message: "Token already redeemed" });
        }
        // Check if the token is valid on blockchain
        const isTokenValid = await WEB3_CONTRACT.methods.isTokenValid(campaignAddress, t15_token, {r: r, s: s, v: v}).call({ from: WEB3_MANAGER_ACCOUNT.address });
        if(process.env.DEBUG) console.log("isTokenValid", isTokenValid);
        if (!isTokenValid) {
            return res.status(400).json({ message: "Token not valid" });
        }

        // get total redeemed token salt for the campaign
        const totalRedeemedTokenSalt = await TokenSalt.countDocuments({ campaignId: campaignId, redeemed: true }).exec();
        
        if (tokenSalt){
            tokenSalt.redeemed = true;
            await tokenSalt.save();
        }

        if (totalRedeemedTokenSalt < campaign.tokensCount) {

            // Check if the batch of tokens is complete
            campaign.redeemableTokens += 1;
            newtoken = new RedeemableToken({
                campaignId: campaignId,
                token: t15_token,
                signature: signature
            });

            await newtoken.save();
            await campaign.save();
            if(process.env.DEBUG) console.log(campaign.redeemableTokens, campaign.batchRedeem);
            if (campaign.redeemableTokens >= campaign.batchRedeem || totalRedeemedTokenSalt + 1 == campaign.tokensCount) {
                // redeem the batch of tokens
                const redeemableTokens = await RedeemableToken.find({ campaignId: campaignId }).limit(campaign.batchRedeem).exec();
                if(process.env.DEBUG) console.log('Redeeming batch of tokens: ', redeemableTokens);
                const tokens = redeemableTokens.map(token => token.token);
                const RSVSignatures = redeemableTokens.map(token => {
                    const { v, r, s } = ethUtil.fromRpcSig(token.signature);
                    return {r: r, s: s, v: v}
                });
                const receipt = await WEB3_CONTRACT.methods.redeemTokensBatch(campaignAddress, tokens, RSVSignatures).send({
                    gasPrice: web3.utils.toWei('2', 'gwei'),
                    from: WEB3_MANAGER_ACCOUNT.address
                });
                if(process.env.DEBUG) console.log('Transaction receipt:', receipt);
                
                for (const token of redeemableTokens) {
                    // delete token
                    await token.deleteOne();
                }

                // reset redeemable tokens
                campaign.redeemableTokens = await RedeemableToken.countDocuments({ campaignId: campaignId }).exec();

                // update campaign
                await campaign.save();
                if(process.env.DEBUG) console.log('Campaign updated:', campaign);
            } else {
                // save token and signature
                if(process.env.DEBUG) console.log('Added redeemable token:', newtoken);
                if(process.env.DEBUG) console.log('Skipping single token redeem, batch count = ', campaign.batchRedeem, ', redeemable tokens = ', campaign.redeemableTokens);
            }

            res.json({ message: "Token redeemed" });
        } else {
            console.log("Target has been reached, no more tokens can be redeemed");
            res.json("Token redeemed, but target has already been reached");
        }
    } catch (error) {
        if(process.env.DEBUG) console.log('Error redeeming token:', error);
        errorMessage = retrieveBlockchainError(error);
        return res.status(400).json({ message: "Error redeeming token: " + errorMessage });
    }
});

const recoverT15Token = async (campaignId, t1_token) => {
    hashed_token = crypto.createHash('sha256').update(t1_token).digest('hex');
    tokenSalt = await TokenSalt.findOne({ campaignId: campaignId, hash: hashed_token }).exec();
    
    if(process.env.DEBUG) console.log("t1_token", t1_token);
    if(process.env.DEBUG) console.log("tokenSalt", tokenSalt);
    if(!tokenSalt)
        throw new Error("Token not valid");
    if(tokenSalt.redeemed)
        throw new Error("Token already redeemed");

    t15_token = web3.utils.toHex(crypto.createHash('sha256').update(t1_token + tokenSalt.salt).digest('hex'));
    if(process.env.DEBUG) console.log('t15_token', t15_token);

    return [tokenSalt, t15_token];
}


module.exports = {
    redeemToken,
    generateTokens
};
