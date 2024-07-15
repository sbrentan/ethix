const asyncHandler = require("express-async-handler");
const { WEB3_MANAGER_ACCOUNT, WEB3_CONTRACT_ADDRESS, WEB3_CONTRACT } = require("../config/web3");

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
    
    console.log('Redeeming token:', tokenId);
    console.log('Campaign ID:', campaignId);
    const data = WEB3_CONTRACT.methods.redeemToken(campaignId, tokenId).encodeABI();

    const tx = {
        from: WEB3_MANAGER_ACCOUNT.address,
        to: WEB3_CONTRACT_ADDRESS,
        data: data
    };

    try {
        const receipt = await WEB3_CONTRACT.methods.redeemToken(campaignId, tokenId).send({ from: WEB3_MANAGER_ACCOUNT.address });

        console.log('Transaction receipt:', receipt);
        res.json({ message: "Token redeemed" });
    } catch (error) {
        console.log('Error redeeming token:', error);
        errorMessage = retrieveBlockchainError(error);
        res.json({ message: "Error redeeming token: " + errorMessage });
        res.status(400);
    }
});

module.exports = {
    redeemToken,
};