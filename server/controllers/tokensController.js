const asyncHandler = require("express-async-handler");
const { WEB3_MANAGER_ACCOUNT, WEB3_CONTRACT_ADDRESS, WEB3_CONTRACT, web3 } = require("../config/web3");
const TokenSalt = require("../models/TokenSalt");
const Campaign = require("../models/Campaign");
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');

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

        // Generate the tokens T1
        const t1_tokens = Array.from({ length: campaign.tokensCount }, (_, i) => {
            return crypto.createHash('sha256').update(tokenSeed + i).digest('hex');
        });
        
        // generate randomlyh token indexes
        const salts = Array.from({ length: campaign.tokensCount }, (_, i) => crypto.createHash('sha256').update(i + new Date().getTime()).digest('hex'));

        // Create the TokenSalt objects to save on db
        const tokenSalts = t1_tokens.map((token, i) => {
            return {
                campaignId: campaign._id,
                hash: crypto.createHash('sha256').update(token).digest('hex'),
                salt: tokenIndexes[i]
            };
        });
        await TokenSalt.insertMany(tokenSalts);
        
        // Generate the tokens T1.5
        const t15_tokens = t1_tokens.map((token, i) => {
            return crypto.createHash('sha256').update(token + salts[i]).digest('hex');
        });

        // Generate the tokens T2
        // TODO: batch this call
        const t2_tokens = await WEB3_CONTRACT.methods.generateTokenHashes(campaignAddress, t15_tokens).call({ from: WEB3_MANAGER_ACCOUNT.address });

        // Create the signature for the tokens
        const tokenSignatures = t2_tokens.map(token => {
            return web3.eth.accounts.sign(web3.utils.keccak256(token + campaignAddress), wallet.privateKey);
        });

        res.json({ signed_tokens: t1_tokens.map((token, i) => {
            return {
                token: token,
                signature: tokenSignatures[i].signature,
            };
        }) });
        
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

    // check if the token salt is present in db
    try{
        tokenSalt, t15_token = await recoverT15Token(campaignId, tokenId);
    } catch (error) {
        // console.log('Error redeeming token:', error);
        res.json({ message: "Error redeeming token: " + error.message });
        res.status(400);
        return;
    }

    // signature is 65 bytes long, convert it to r, s, v
    const { v, r, s } = ethUtil.fromRpcSig(signature);

    try {
        // TODO: batch these calls
        // Check if the token is valid on blockchain
        const isTokenValid = await WEB3_CONTRACT.methods.isTokenValid(campaignAddress, t15_token, {r: r, s: s, v: v}).send({ from: WEB3_MANAGER_ACCOUNT.address });
        if (!isTokenValid) {
            res.json({ message: "Token not valid" });
            res.status(400);
            return;
        }
        
        // Redeem the token
        const receipt = await WEB3_CONTRACT.methods.redeemToken(campaignAddress, t15_token, {r: r, s: s, v: v}).send({ from: WEB3_MANAGER_ACCOUNT.address });
        if (tokenSalt) {
            tokenSalt.redeemed = true;
            await tokenSalt.save();
        }

        console.log('Transaction receipt:', receipt);
        res.json({ message: "Token redeemed" });
    } catch (error) {
        console.log('Error redeeming token:', error);
        errorMessage = retrieveBlockchainError(error);
        res.json({ message: "Error redeeming token: " + errorMessage });
        res.status(400);
    }
});

const recoverT15Token = async (campaignId, t1_token) => {
    hashed_token = crypto.createHash('sha256').update(t1_token).digest('hex');
    tokenSalt = await TokenSalt.findOne({ campaignId: campaignId, hash: hashed_token }).exec();
    if(!tokenSalt)
        throw new Error("Token not valid");
    if(tokenSalt.redeemed)
        throw new Error("Token already redeemed");

    t15_token = crypto.createHash('sha256').update(t1_token + tokenSalt.salt).digest('hex');

    return tokenSalt, t15_token;
}

const checkTokenHash = async (campaignId, tokenId, campaignAddress) => {
    campaign = await Campaign.findOne({ _id: campaignId, campaignId: campaignAddress }).exec();
    if (!campaign)
        throw new Error("Campaign not found");

    token_hash = crypto.createHash('sha256').update(campaignId + tokenId + campaignAddress).digest('hex')
    const token = await Token.findOne({ campaignId: campaign._id, hash: token_hash }).exec();

    if (!token)
        throw new Error("Token not valid");
    else if (token.redeemed)
        throw new Error("Token already redeemed");

    return token;
}


module.exports = {
    redeemToken,
    generateTokens
};