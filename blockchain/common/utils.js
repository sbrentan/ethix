const log = (message, tabs) => { console.log(`${"\t".repeat(tabs)}${message}`); };

const getPrivateKey = (index = 0) => {
	const _accounts = config.networks.hardhat.accounts;
	const _wallet = ethers.Wallet.fromPhrase(_accounts.mnemonic, _accounts.path + `/${index}`);
	return _wallet.privateKey;
}

// this is needed if you want to sign a message combined from two hex variables
const encodePacked = function(walletAddress, campaignAddress) {
    // Remove '0x' prefix and concatenate
    const concatenated = walletAddress.substring(2) + campaignAddress.substring(2);
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}


module.exports = {
    log,
    getPrivateKey,
    encodePacked
};