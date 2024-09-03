require('dotenv').config();
const {
    log,
    logJson,
    encodePacked
} = require('../../../common/utils.js');
const { DEFAULT_SLICE } = require('../../../common/constants.js');
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');

const generateTokens = async (contract, seed, campaignId, rwallet, amount = 1, valid = true) => {
    try {

        if (amount < 1) return null;

        log();
        log(`Token generation [${valid ? 'VALID' : 'INVALID'}]`, tabs = 3, sep = '');

        const tokenSeed = crypto.createHash('sha256').update(seed + new Date().getTime()).digest('hex');
        log(`tokenSeed: ${tokenSeed}`);

        const t1_tokens = [];
        const salts = [];
        const t15_tokens = [];
        for (let i = 0; i < amount; i++) {
            let t1_token = '0x' + crypto.createHash('sha256').update(tokenSeed + i).digest('hex');
            t1_tokens.push(t1_token);

            let tokenSalt = crypto.createHash('sha256').update(String(i + new Date().getTime())).digest('hex');
            salts.push(tokenSalt);

            let t15_token = '0x' + crypto.createHash('sha256').update(t1_token + tokenSalt).digest('hex');
            t15_tokens.push(t15_token);
        }

        log(`T1_tokens:`);
        t1_tokens.forEach((t1, i) => {
            log(`${t1}`, tabs = 4, sep = '*');
        });

        log(`Salts:`);
        salts.forEach((salt, i) => {
            log(`${salt}`, tabs = 4, sep = '*');
        });

        log(`T15_tokens:`);
        t15_tokens.forEach((t15, i) => {
            log(`${t15}`, tabs = 4, sep = '*');
        });

        let t2_tokens = await contract.generateTokenHashes(campaignId, t15_tokens);
        log(`T2_tokens:`);
        t2_tokens.forEach((t2, i) => {
            log(`${t2}`, tabs = 4, sep = '*');
        });

        if (!valid)
            t2_tokens = t2_tokens.map((t2, i) => '0x' + crypto.createHash('sha256').update(t2 + "notvalid" + i).digest('hex'));

        log(`Campaign address: ${campaignId}`);
        log(`Rwallet private key: ${rwallet.privateKey}`);

        log(`Signature hashes:`);
        const t2_signatures = t2_tokens.map(t2_token => {
            const _combinedHash = encodePacked(t2_token, campaignId);
            log(`${_combinedHash}`, tabs = 4, sep = '*');
            return web3.eth.accounts.sign(_combinedHash, rwallet.privateKey);
        });

        const signed_tokens = t1_tokens.map((token, i) => {
            return {
                token: token,
                signature: t2_signatures[i].signature,
            };
        });

        const jwt_tokens = signed_tokens.map((signed) => {
            return {
                token: jwt.sign({
                    campaignId: undefined,
                    campaignAddress: campaignId,
                    tokenId: signed.token,
                    signature: signed.signature,
                },
                    process.env.REFRESH_TOKEN_SECRET || ""
                )
            }
        });

        log(`JWT tokens:`);
        jwt_tokens.forEach((jwt, i) => {
            log(`${jwt.token.slice(0, DEFAULT_SLICE) + "........." + jwt.token.slice(-DEFAULT_SLICE)}`, tabs = 4, sep = '*');
        });

        return {
            jwt_tokens: jwt_tokens,
            token_seed: tokenSeed,
            token_salts: salts
        }

    } catch (error) {
        console.error(error);
        return null;
    }
}

const validateToken = async (contract, jwts, valid = true) => {
    
    let campaignId, t15_token, signature;

    try {
        log();
        log(`Token validation [${valid ? 'VALID' : 'INVALID'}]`, tabs = 3, sep = '');

        log(`JWT tokens:`);
        jwts.tokens.forEach((jwt, i) => {
            log(`${jwt.slice(0, DEFAULT_SLICE) + "........." + jwt.slice(-DEFAULT_SLICE)}`, tabs = 4, sep = '*');
        });

        log(`Pick a random JWT token...`);
        const index = Math.floor(Math.random() * jwts.tokens.length);
        log(`Index picked: ${index}`);

        const jwt_token = jwts.tokens[index];
        const decoded = jwt.verify(jwt_token, process.env.REFRESH_TOKEN_SECRET || "");

        log(`Decoded JWT:`);
        logJson(decoded);

        campaignId = decoded.campaignAddress;
        const t1_token = decoded.tokenId;
        const token_salt = jwts.salts[index];
        const token_seed = jwts.seed;

        log(`T1 token: ${t1_token}`);
        log(`Token_seed: ${token_seed}`);
        log(`Token_salt: ${token_salt}`);

        t15_token = '0x' + crypto.createHash('sha256').update(t1_token + token_salt).digest('hex');

        log(`T15_token: ${t15_token}`);

        const { v, r, s } = ethUtil.fromRpcSig(decoded.signature);

        log(`Signature: ${decoded.signature.slice(0, DEFAULT_SLICE) + "........." + decoded.signature.slice(-DEFAULT_SLICE)}`);
        log(`r: ${Buffer.from(r).toString('hex')}`, tabs = 4, sep = '*');
        log(`s: ${Buffer.from(s).toString('hex')}`, tabs = 4, sep = '*');
        log(`v: ${v}`, tabs = 4, sep = '*');

        signature = {
            r: r,
            s: s,
            v: v
        }

    } catch (error) {
        console.error(error);
    }

    let isTokenValid;
    const batchRedeem = () => contract.redeemTokensBatch(
        campaignId,
        [t15_token],
        [signature]
    );

    try {
        isTokenValid = await contract.isTokenValid(campaignId, t15_token, signature);
        log(`isTokenValid: ${isTokenValid}`);

        const redeem_tx = await batchRedeem();
        const redeem_receipt = await redeem_tx.wait();
        const count_data = Number(redeem_receipt?.logs[0]?.data);

        log(`Batch size: ${count_data}`);

        const campaign_address = await contract.getCampaignAddress(campaignId);
        const campaign = await ethers.getContractAt("Campaign", campaign_address);

        return {
            tx: redeem_tx,
            is_valid: isTokenValid,
            batch_size: count_data,
            campaign_contract: campaign
        };

    } catch (error) {
        return { 
            tx: null,
            is_valid: isTokenValid,
            get method() { return (batchRedeem)() }
        }
    }
}

module.exports = {
    generateTokens,
    validateToken
}