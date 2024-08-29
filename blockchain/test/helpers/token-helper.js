require('dotenv').config();
const { 
    log,
    encodePacked 
} = require('../common/utils.js');
const { DEFAULT_SLICE } = require('../common/constants.js');
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');

const generateToken = async (owner_contract, seed, campaignAddress, rwallet, valid = true) => {
    try {

        log("\n\t# ============================ Token generation ============================ #\n", sep = '');

        const tokenSeed = crypto.createHash('sha256').update(seed + new Date().getTime()).digest('hex');
        log(`tokenSeed: ${tokenSeed}`);

        const index = 0;
        const t1_token = '0x' + crypto.createHash('sha256').update(tokenSeed + index).digest('hex');
        log(`t1_token: ${t1_token}`);

        const tokenSalt = crypto.createHash('sha256').update(String(index + new Date().getTime())).digest('hex');
        log(`tokenSalt: ${tokenSalt}`);
        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + tokenSalt).digest('hex');
        log(`t15_token: ${t15_token}`);

        let t2_token = (await owner_contract.generateTokenHashes(campaignAddress, [t15_token]))[0];
        log(`t2_token: ${t2_token}`);

        if (!valid) t2_token = '0x' + crypto.createHash('sha256').update("notvalid").digest('hex');

        log(`Campaign address: ${campaignAddress}`);
        log(`Rwallet private key: ${rwallet.privateKey}`);

        const _combinedHash = encodePacked(t2_token, campaignAddress);
        log(`Signature hash: ${_combinedHash}`);
        const t2_signature = web3.eth.accounts.sign(_combinedHash, rwallet.privateKey);

        const signed_token = {
            token: t1_token,
            signature: t2_signature
        }

        const jwt_token = jwt.sign({
            campaignId: undefined,
            campaignAddress: campaignAddress,
            tokenId: signed_token.token,
            signature: signed_token.signature.signature
        },
            process.env.REFRESH_TOKEN_SECRET || ""
        );

        log(`JWT Token: ${jwt_token.slice(0, DEFAULT_SLICE) + "........." + jwt_token.slice(-DEFAULT_SLICE)}`);

        return {
            jwt_token: jwt_token,
            token_seed: tokenSeed,
            token_salt: tokenSalt
        }

    } catch (error) {
        return null;
    }
}

const redeemToken = async (owner_charity, campaignAddress, token_structure) => {
    try {

        log("\n\t# ============================ Token redemption ============================ #\n", sep = '');

        log(`Token: ${token_structure.jwt_token.slice(0, DEFAULT_SLICE) + "........." + token_structure.jwt_token.slice(-DEFAULT_SLICE)}`);
        const jwt_token = token_structure.jwt_token;

        const decoded = jwt.verify(jwt_token, process.env.REFRESH_TOKEN_SECRET || "");
        const t1_token = decoded.tokenId;
        const token_seed = token_structure.token_seed;
        const token_salt = token_structure.token_salt;

        log(`Decoded JWT:`);
        logJson(decoded);
        log(`Token_seed: ${token_seed}`);
        log(`Token_salt: ${token_salt}`);

        const t15_token = '0x' + crypto.createHash('sha256').update(t1_token + token_salt).digest('hex');

        log(`T15_token: ${t15_token}`);

        const { v, r, s } = ethUtil.fromRpcSig(decoded.signature);

        log(`Signature: ${decoded.signature.slice(0, SLICE) + "........." + decoded.signature.slice(-SLICE)}`);
        log(`* r: ${Buffer.from(r).toString('hex')}`, 3);
        log(`* s: ${Buffer.from(s).toString('hex')}`, 3);
        log(`* v: ${v}`, 3);

        const isTokenValid = await owner_charity.isTokenValid(campaignAddress, t15_token, { r: r, s: s, v: v });

        log(`isTokenValid: ${isTokenValid}`);

        await owner_charity.redeemTokensBatch(campaignAddress, [t15_token], [{ r: r, s: s, v: v }]);

        return isTokenValid;

    } catch (error) {
        return false;
    }
}

module.exports = {
    generateToken,
    redeemToken
}