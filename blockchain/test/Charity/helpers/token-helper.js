require('dotenv').config();
const {
    log,
    logJson,
    encodePacked
} = require('../../../common/utils.js');
const { DEFAULT_SLICE } = require('../../../common/constants.js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const generateToken = async (contract, params, index = 0, valid = true) => {

    const campaignId = params?.campaignId;
    const seed = params?.seed;
    let wallet = params?.wallet;
    const include_decoded = params?.decode;

    try {

        log();
        log(`Token generation [${valid ? 'VALID' : 'INVALID'}]`, tabs = 3, sep = '');

        const tokenSeed = crypto.createHash('sha256').update(seed + new Date().getTime()).digest('hex');
        log(`tokenSeed: ${tokenSeed}`);

        const t1_token = '0x' + crypto.createHash('sha256').update(tokenSeed + index).digest('hex');
        log(`T1_token: ${t1_token}`);

        const tokenSalt = crypto.createHash('sha256').update(String(index + new Date().getTime())).digest('hex');
        log(`Token_salt: ${tokenSalt}`);

        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + tokenSalt).digest('hex');
        log(`T15_token: ${t15_token}`);

        const t2_token = (await contract.generateTokenHashes(campaignId, [t15_token]))[0];

        log(`T2_token: ${t2_token}`);

        log(`Campaign Id: ${campaignId}`);
        log(`Wallet private key: ${wallet.privateKey}`);

        if (!valid) {
            log(`Changing wallet to generate invalid signature...`);
            wallet = web3.eth.accounts.create();
            log(`Invalid wallet private key: ${wallet.privateKey}`);
        }

        const _combinedHash = encodePacked(t2_token, campaignId);
        const t2_signature = web3.eth.accounts.sign(_combinedHash, wallet.privateKey);

        log(`Signature: ${t2_signature.signature.slice(0, DEFAULT_SLICE) + "........." + t2_signature.signature.slice(-DEFAULT_SLICE)}`);

        const token = jwt.sign({
            campaignId: campaignId,
            tokenId: t1_token,
            signature: {
                r: t2_signature.r,
                s: t2_signature.s,
                v: t2_signature.v
            }
        },
            process.env.REFRESH_TOKEN_SECRET || ""
        );

        log(`JWT token: ${token.slice(0, DEFAULT_SLICE) + "........." + token.slice(-DEFAULT_SLICE)}`);

        let return_params = {};

        return_params.jwt = token;
        return_params.seed = tokenSeed;
        return_params.salt = tokenSalt;

        if (include_decoded) 
            return_params.decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || "");

        return return_params;

    } catch (error) {
        console.error(error);
        return null;
    }
}

const alterToken = (token, params) => {
    if (!token) return null;

    if (params?.remove_signature) delete token.decoded.signature;
    if (params?.remove_campaignId) delete token.decoded.campaignId;
    if (params?.remove_tokenId) delete token.decoded.tokenId;

    if(token?.decoded){

        log();
        log(`Altered token:`);
        logJson(token.decoded);

        const altered = {
            jwt: jwt.sign(token.decoded, process.env.REFRESH_TOKEN_SECRET || ""),
            seed: token.seed,
            salt: token.salt
        }

        return altered;
    }

    return null;
}

const decodeToken = (jwtToken) => {
    if (!jwtToken) return null;

    return jwt.verify(jwtToken, process.env.REFRESH_TOKEN_SECRET || "");
}

const validateToken = async (contract, token) => {

    let campaignId, t15_token, signature;

    try{
        log();
        log(`Token validation:`, tabs = 3, sep = '');

        log(`JWT token: ${token.jwt.slice(0, DEFAULT_SLICE) + "........." + token.jwt.slice(-DEFAULT_SLICE)}`);

        const decoded = jwt.verify(token.jwt, process.env.REFRESH_TOKEN_SECRET || "");

        log(`Decoded JWT:`);
        logJson(decoded);

        campaignId = decoded?.campaignId;
        const t1_token = decoded?.tokenId;
        signature = decoded?.signature;
        const salt = token?.salt;
        const seed = token?.seed;

        log(`T1 token: ${t1_token}`);
        log(`Token_seed: ${seed}`);
        log(`Token_salt: ${salt}`);

        t15_token = '0x' + crypto.createHash('sha256').update(t1_token + salt).digest('hex');

        log(`T15_token: ${t15_token}`);

        log(`Signature:`);
        if (signature) {
            log(`r: ${signature.r}`, tabs = 4, sep = '*');
            log(`s: ${signature.s}`, tabs = 4, sep = '*');
            log(`v: ${signature.v}`, tabs = 4, sep = '*');
        } else log(`Signature not found!`);
    } catch (e) {
        log(`Token decoding failed!`);
    }

    let is_token_valid = false;

    const tokenValid = () => contract.isTokenValid(campaignId, t15_token, signature);

    const tokenRedeem = () => contract.redeemTokensBatch(campaignId, [t15_token], signature ? [signature] : []);

    try {
        is_token_valid = await tokenValid();
        log(`isTokenValid: ${is_token_valid}`);
    } catch (e) {
        log(`isTokenValid failed!`);
    }

    try {
        const redeem_tx = await tokenRedeem();
        const redeem_receipt = await redeem_tx.wait();
        const count_data = Number(redeem_receipt?.logs[0]?.data);

        log(`Total redeemed tokens: ${count_data}`);

        return {
            tx: redeem_tx,
            contract: contract,
            is_redeemable: true,
            redemeed_tokens: count_data
        }

    } catch (e) {
        return {
            tx: null,
            is_redeemable: false,
            get method() { return (tokenRedeem)() }
        }
    }
}

module.exports = {
    generateToken,
    alterToken,
    decodeToken,
    validateToken
}