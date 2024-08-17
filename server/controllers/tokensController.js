const asyncHandler = require("express-async-handler");
const { WEB3_MANAGER_ACCOUNT, encodePacked, WEB3_CONTRACT, web3 } = require("../config/web3");
const TokenSalt = require("../models/TokenSalt");
const Campaign = require("../models/Campaign");
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');
const RedeemableToken = require("../models/RedeemableToken");

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

        console.log(campaign);
        // Generate the tokens T1
        const t1_tokens = Array.from({ length: campaign.tokensCount }, (_, i) => {
            return web3.utils.toHex(crypto.createHash('sha256').update(tokenSeed + i).digest('hex'));
        });
        console.log('t1_tokens', t1_tokens);
        
        // generate randomlyh token indexes
        const salts = Array.from({ length: campaign.tokensCount }, (_, i) => crypto.createHash('sha256').update(String(i + new Date().getTime())).digest('hex'));
        console.log('salts', salts);

        // Create the TokenSalt objects to save on db
        const tokenSalts = t1_tokens.map((token, i) => {
            return {
                campaignId: campaign._id,
                hash: crypto.createHash('sha256').update(token).digest('hex'),
                salt: salts[i]
            };
        });
        await TokenSalt.insertMany(tokenSalts);
        console.log('tokenSalts', tokenSalts);
        
        // Generate the tokens T1.5
        const t15_tokens = t1_tokens.map((token, i) => {
            return web3.utils.toHex(crypto.createHash('sha256').update(token + salts[i]).digest('hex'));
        });
        console.log('t15_tokens', t15_tokens);

        // Generate the tokens T2
        // TODO: batch this call
        const t2_tokens = await WEB3_CONTRACT.methods.generateTokenHashes(campaignAddress, t15_tokens).call({ from: WEB3_MANAGER_ACCOUNT.address });
        console.log('t2_tokens', t2_tokens);

        // Create the signature for the tokens
        const tokenSignatures = t2_tokens.map(token => {
            return web3.eth.accounts.sign(encodePacked(web3.utils.toHex(token), campaignAddress), wallet.privateKey);
        });
        console.log('tokenSignatures', tokenSignatures);

        signed_tokens = t1_tokens.map((token, i) => {
            return {
                token: token,
                signature: tokenSignatures[i].signature,
            };
        });
        console.log('signed_tokens', signed_tokens);

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
        console.log(jwt_tokens)

        res.json({ signedTokens: jwt_tokens });
        
    } catch (error) {
        console.log('Error generating tokens:', error);
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
    console.log('campaignId', campaignId);
    console.log('token', token);
    try{
        [tokenSalt, t15_token] = await recoverT15Token(campaignId, token);
    } catch (error) {
        console.log('salt not present on db');
        console.log('Error redeeming token:', error);
        return res.status(400).json({ message: "Error redeeming token: " + error.message });
    }
    console.log("tokenSalt", tokenSalt);

    // signature is 65 bytes long, convert it to r, s, v
    const { v, r, s } = ethUtil.fromRpcSig(signature);

    try {
        // TODO: batch these calls
        // Check if the token is valid on blockchain
        const isTokenValid = await WEB3_CONTRACT.methods.isTokenValid(campaignAddress, t15_token, {r: r, s: s, v: v}).call({ from: WEB3_MANAGER_ACCOUNT.address });
        console.log("isTokenValid", isTokenValid);
        if (!isTokenValid) {
            return res.status(400).json({ message: "Token not valid" });
        }

        if (tokenSalt)
            tokenSalt.redeemed = true;
        
        // Check if the batch of tokens is complete
        campaign.redeemableTokens += 1;
        newtoken = new RedeemableToken({
            campaignId: campaignId,
            token: token,
            signature: signature
        });
        await newtoken.save();
        if (campaign.redeemableTokens === campaign.batchRedeem) {
            // redeem the batch of tokens
            const redeemableTokens = await RedeemableToken.find({ campaignId: campaignId }).limit(campaign.batchRedeem).exec();
            console.log('Redeeming batch of tokens: ', redeemableTokens);
            const tokens = redeemableTokens.map(token => token.token);
            const RSVSignatures = redeemableTokens.map(token => {
                const { v, r, s } = ethUtil.fromRpcSig(token.signature);
                return {r: r, s: s, v: v}
            });
            const receipt = await WEB3_CONTRACT.methods.redeemTokensBatch(campaignAddress, tokens, RSVSignatures).send({
                gasPrice: web3.utils.toWei('2', 'gwei'),
                from: WEB3_MANAGER_ACCOUNT.address
            });
            console.log('Transaction receipt:', receipt);
            
            for (const token of redeemableTokens) {
                // delete token
                await token.delete();
            }

            // reset redeemable tokens
            campaign.redeemableTokens = await RedeemableToken.countDocuments({ campaignId: campaignId }).exec();

            // update campaign
            await campaign.save();
            console.log('Campaign updated:', campaign);
        }

        res.json({ message: "Token redeemed" });
    } catch (error) {
        console.log('Error redeeming token:', error);
        errorMessage = retrieveBlockchainError(error);
        return res.status(400).json({ message: "Error redeeming token: " + errorMessage });
    }
});

const recoverT15Token = async (campaignId, t1_token) => {
    hashed_token = crypto.createHash('sha256').update(t1_token).digest('hex');
    tokenSalt = await TokenSalt.findOne({ campaignId: campaignId, hash: hashed_token }).exec();
    
    console.log("t1_token", t1_token);
    console.log("tokenSalt", tokenSalt);
    if(!tokenSalt)
        throw new Error("Token not valid");
    if(tokenSalt.redeemed)
        throw new Error("Token already redeemed");

    t15_token = web3.utils.toHex(crypto.createHash('sha256').update(t1_token + tokenSalt.salt).digest('hex'));
    console.log('t15_token', t15_token);

    return [tokenSalt, t15_token];
}


module.exports = {
    redeemToken,
    generateTokens
};
