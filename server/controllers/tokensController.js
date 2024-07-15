const asyncHandler = require("express-async-handler");
const { WEB3_MANAGER_ACCOUNT, WEB3_CONTRACT_ADDRESS, WEB3_CONTRACT } = require("../config/web3");
const Token = require("../models/Token");
const Campaign = require("../models/Campaign");
const crypto = require('crypto');

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


// @desc Redeem token
// @route POST /tokens/redeem
// @access Public
const redeemToken = asyncHandler(async (req, res) => {
    // Get the token from the request body
    const tokenId = req.body.tokenId;
    const campaignId = req.body.campaignId;

    // check if the token hash is present in db
    try{
        token = await checkTokenHash(campaignId, tokenId);
    } catch (error) {
        // console.log('Error redeeming token:', error);
        res.json({ message: "Error redeeming token: " + error.message });
        res.status(400);
        return;
    }
    
    console.log('Redeeming token:', tokenId);
    console.log('Campaign ID:', campaignId);
    const data = WEB3_CONTRACT.methods.redeemToken(campaignId, tokenId).encodeABI();

    try {
        const receipt = await WEB3_CONTRACT.methods.redeemToken(campaignId, tokenId).send({ from: WEB3_MANAGER_ACCOUNT.address });
        token.redeemed = true;

        console.log('Transaction receipt:', receipt);
        res.json({ message: "Token redeemed" });
    } catch (error) {
        console.log('Error redeeming token:', error);
        errorMessage = retrieveBlockchainError(error);
        res.json({ message: "Error redeeming token: " + errorMessage });
        res.status(400);
    }
});

const checkTokenHash = async (campaignId, tokenId) => {
    campaign = await Campaign.findOne({ campaignId: campaignId }).exec();
    if (!campaign)
        throw new Error("Campaign not found");

    token_hash = crypto.createHash('sha256').update(campaignId + tokenId).digest('hex')
    const token = await Token.findOne({ _id: campaign._id, hash: token_hash }).exec();

    if (!token)
        throw new Error("Token not valid");
    else if (token.redeemed)
        throw new Error("Token already redeemed");

    return token;
}


module.exports = {
    redeemToken,
};