require('dotenv').config();
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');

const log = (message, tabs = 2) => {
    if(process.env.DEBUG){
        let sep = message != "" ? "- " : ""
        console.log(`${" ".repeat(tabs * 4)}${sep}${message}`);
    }
};

const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000).toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        hour12: false
    }).replace(',', '');

    return timestamp + " [" + date + "]";
}

const getPrivateKey = (index = 0) => {
    const _accounts = config.networks.hardhat.accounts;
    const _wallet = ethers.Wallet.fromPhrase(_accounts.mnemonic, _accounts.path + `/${index}`);
    return _wallet.privateKey;
}

// this is needed if you want to sign a message combined from two hex variables
const encodePacked = function (walletAddress, campaignAddress) {
    // Remove '0x' prefix and concatenate
    const concatenated = walletAddress.substring(2) + campaignAddress.substring(2);

    log("concatenated: ", concatenated);
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}

const generateToken = async (owner_contract, seed, campaignAddress, rwallet, valid = true) => {
    try {

        const tokenSeed = crypto.createHash('sha256').update(seed + new Date().getTime()).digest('hex');
        log("tokenSeed: ", tokenSeed);

        const index = 0;
        const t1_token = '0x' + crypto.createHash('sha256').update(tokenSeed + index).digest('hex');
        log("t1_token: ", t1_token);

        const tokenSalt = crypto.createHash('sha256').update(String(index + new Date().getTime())).digest('hex');
        log("tokenSalt: ", tokenSalt);
        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + tokenSalt).digest('hex');
        log("t15_token: ", t15_token);

        let t2_token = (await owner_contract.generateTokenHashes(campaignAddress, [t15_token]))[0];
        log("t2_token: ", t2_token);

        if (!valid) t2_token = '0x' + crypto.createHash('sha256').update("notvalid").digest('hex');

        log("Campaign address: ", campaignAddress);
        log("Rwallet private key: ", rwallet.privateKey);
        log("t2_token: ", t2_token);
        log("Signature hash: ", encodePacked(t2_token, campaignAddress));
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
            )
        }

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
        log("topken ", token_structure.token.token);
        const jwt_token = token_structure.token.token;

        const decoded = jwt.verify(jwt_token, process.env.REFRESH_TOKEN_SECRET || "");
        const t1_token = decoded.tokenId;
        const token_seed = token_structure.token_seed;
        const token_salt = token_structure.token_salt;

        log("decoded: ", decoded);
        log("token_seed: ", token_seed);
        log("token_salt: ", token_salt);

        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + token_salt).digest('hex');

        log("t15_token: ", t15_token);

        const { v, r, s } = ethUtil.fromRpcSig(decoded.signature);

        log("r: ", r);
        log("s: ", s);
        log("v: ", v);

        const isTokenValid = await owner_charity.isTokenValid(campaignAddress, t15_token, { r: r, s: s, v: v });

        log("isTokenValid: ", isTokenValid);

        await owner_charity.redeemTokensBatch(campaignAddress, [t15_token], [{ r: r, s: s, v: v }]);

        return isTokenValid;

    } catch (error) {
        //console.error(error);
    }

    return false;
}


module.exports = {
    log,
    formatDate,
    getPrivateKey,
    encodePacked,
    generateToken,
    redeemToken
};