require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

const generateToken = async (owner_contract, seed, campaignAddress) => {
    try {

        const tokenSeed = crypto.createHash('sha256').update(seed + new Date().getTime()).digest('hex');
        console.log("tokenSeed: ", tokenSeed);

        const index = 0;
        const t1_token = web3.utils.toHex(crypto.createHash('sha256').update(tokenSeed + index).digest('hex'));
        console.log("t1_token: ", t1_token);

        const tokenSalt = crypto.createHash('sha256').update(String(index + new Date().getTime())).digest('hex');
        console.log("tokenSalt: ", tokenSalt);
        const t15_token = web3.utils.toHex(crypto.createHash('sha256').update(t1_token + tokenSalt).digest('hex'));
        console.log("t15_token: ", t15_token);

        console.log("Pre t2")
        const t2_token = (await owner_contract.generateTokenHashes(campaignAddress, [t15_token]))[0];
        console.log("t2_token: ", t2_token);

        const owner_private_key = getPrivateKey();
        const t2_signature = web3.eth.accounts.sign(encodePacked(web3.utils.toHex(t2_token), campaignAddress), owner_private_key);

        const signed_token = {
            token: t1_token,
            signature: t2_signature
        }

        const jwt_token = { 
            token: jwt.sign({
                campaignId: undefined,
                campaignAddress: campaignAddress,
                tokenId: signed_token.token,
                signature: signed_token.signature
            },
            process.env.REFRESH_TOKEN_SECRET || ""
        )}

        return {
            token: jwt_token,
            token_seed: tokenSeed,
            token_salt: tokenSalt
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    log,
    getPrivateKey,
    encodePacked,
    generateToken
};