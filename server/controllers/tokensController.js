const asyncHandler = require("express-async-handler");
const { WEB3_MANAGER_ACCOUNT, WEB3_CONTRACT_ADDRESS } = require("../config/web3");

// @desc Redeem token
// @route POST /tokens/redeem
// @access Public
const redeemToken = asyncHandler(async (req, res) => {
    // Get the token from the request body
    const tokenId = req.body.tokenId;
    const campaignId = req.body.campaignId;
    
    const data = contract.methods.redeemToken(campaignId, tokenId).encodeABI();

    const tx = {
        from: WEB3_MANAGER_ACCOUNT.address,
        to: WEB3_CONTRACT_ADDRESS,
        data: data
    };

    try {
        const signedTx = await account.signTransaction(tx);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Transaction receipt:', receipt);
    } catch (error) {
        console.error('Error sending transaction:', error);
        res.status(500);
    }
    
    res.json({ message: "Token redeemed" });
});

module.exports = {
    redeemToken,
};