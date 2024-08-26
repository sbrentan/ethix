require('dotenv').config();
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
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

    console.log("concatenated: ", concatenated); 
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}

const generateToken = async (owner_contract, seed, campaignAddress, rwallet, valid = true) => {
    try {

        const tokenSeed = crypto.createHash('sha256').update(seed + new Date().getTime()).digest('hex');
        console.log("tokenSeed: ", tokenSeed);

        const index = 0;
        const t1_token = '0x' + crypto.createHash('sha256').update(tokenSeed + index).digest('hex');
        console.log("t1_token: ", t1_token);

        const tokenSalt = crypto.createHash('sha256').update(String(index + new Date().getTime())).digest('hex');
        console.log("tokenSalt: ", tokenSalt);
        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + tokenSalt).digest('hex');
        console.log("t15_token: ", t15_token);

        let t2_token = (await owner_contract.generateTokenHashes(campaignAddress, [t15_token]))[0];
        console.log("t2_token: ", t2_token);

        if (!valid) t2_token = '0x' + crypto.createHash('sha256').update("notvalid").digest('hex');

        console.log("Campaign address: ", campaignAddress);
        console.log("Rwallet private key: ", rwallet.privateKey);
        console.log("t2_token: ", t2_token);
        console.log("Signature hash: ", encodePacked(t2_token, campaignAddress));
        const t2_signature = web3.eth.accounts.sign(encodePacked(t2_token, campaignAddress), rwallet.privateKey);

        const signed_token = {
            token: t1_token,
            signature: t2_signature
        }

        const jwt_token = { 
            token: jwt.sign({
                campaignId: undefined,
                campaignAddress: campaignAddress,
                tokenId: signed_token.token,
                signature: signed_token.signature.signature
            },
            process.env.REFRESH_TOKEN_SECRET || ""
        )}

        return {
            token: jwt_token,
            token_seed: tokenSeed,
            token_salt: tokenSalt
        }

    } catch (error) {
        //console.error(error);
    }

    return null;
}

const redeemToken = async (owner_charity, campaignAddress, token_structure) => {
    try {
        console.log("topken ", token_structure.token.token);
        const jwt_token = token_structure.token.token;

        const decoded = jwt.verify(jwt_token, process.env.REFRESH_TOKEN_SECRET || "");
        const t1_token = decoded.tokenId;
        const token_seed = token_structure.token_seed;
        const token_salt = token_structure.token_salt;

        console.log("decoded: ", decoded);
        console.log("token_seed: ", token_seed);
        console.log("token_salt: ", token_salt);

        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + token_salt).digest('hex');

        console.log("t15_token: ", t15_token);

        const { v, r, s } = ethUtil.fromRpcSig(decoded.signature);
 
        console.log("r: ", r);
        console.log("s: ", s);
        console.log("v: ", v);

        const isTokenValid = await owner_charity.isTokenValid(campaignAddress, t15_token, {r: r, s: s, v: v});

        console.log("isTokenValid: ", isTokenValid);

        await owner_charity.redeemTokensBatch(campaignAddress, [t15_token], [{r: r, s: s, v: v}]);
        
        return isTokenValid;

    } catch (error) {
        //console.error(error);
    }

    return false;
}


module.exports = {
    log,
    delay,
    getPrivateKey,
    encodePacked,
    generateToken,
    redeemToken
};