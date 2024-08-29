require('dotenv').config();
const crypto = require('crypto');
const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');

const { expect } = require("chai");

const { SLICE, HOUR } = require('./constants.js');

const log = (message, tabs = 3, sep = "-") => {
    if (process.env.DEBUG) {
        if (!message) message = "";
        if (message === "") sep = "";
        console.log(`${" ".repeat(tabs * 4)}${sep} ${message}`);
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
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}

const logJson = data => {
    for (const key in data) {
        if (data[key].length > 64)
            log(`* ${key}: ${data[key].slice(0, SLICE) + "........." + data[key].slice(-SLICE)}`, 3);
        else log(`* ${key}: ${data[key]}`, 3);
    }
}

const prepareCreationParams = async (params = {}) => {
    const _title = params.title || "Test Campaign";
    
    let block = await ethers.provider.getBlock("latest");
    const _startingDate = params.startingDate || Math.floor(block.timestamp + (2 * HOUR));
    const _deadline = params.deadline || Math.floor(_startingDate + (6 * HOUR));

    const _tokenGoal = params.tokenGoal || 5;
    const _maxTokens = params.maxTokens || 10;
    const _beneficiary = params.beneficiary || (await ethers.Wallet.createRandom()).address;

    const _seed = web3.utils.randomHex(32);
    const _seedHash = web3.utils.keccak256(_seed);
    const private_key = params.private_key || getPrivateKey();
    const _sigdata = await web3.eth.accounts.sign(_seedHash, private_key);

    expect(_title).to.be.a("string");
    expect(_startingDate).to.be.a("number");
    expect(_deadline).to.be.a("number");
    expect(_tokenGoal).to.be.a("number");
    expect(_maxTokens).to.be.a("number");
    expect(_beneficiary).to.be.properAddress;
    expect(_seedHash).to.be.a("string");
    expect(_sigdata).to.be.an("object");

    log(`Title: ${_title}`);
    log(`Starting date: ${formatDate(_startingDate)}`);
    log(`Deadline: ${formatDate(_deadline)}`);
    log(`Token goal: ${_tokenGoal}`);
    log(`Max tokens: ${_maxTokens}`);
    log(`Beneficiary: ${_beneficiary}`);
    log(`Seed: ${_seed}`);
    log(`Seed hash: ${_seedHash}`);
    log(`Signature: ${_sigdata.signature.slice(0, SLICE) + "........." + _sigdata.signature.slice(-SLICE)}`);

    return {
        title: _title,
        startingDate: _startingDate,
        deadline: _deadline,
        tokenGoal: _tokenGoal,
        maxTokens: _maxTokens,
        beneficiary: _beneficiary,
        seedHash: _seedHash,
        signature: {
            r: _sigdata.r,
            s: _sigdata.s,
            v: _sigdata.v
        }
    }
}

const getCampaign = async (charity, campaignAddress) => {
    const _campaign = await charity.getCampaign(campaignAddress);

    if (_campaign.length == 0) return null;

    const data = {
        campaignId: _campaign[0],
        title: _campaign[1],
        startingDate: formatDate(Number(_campaign[2])),
        deadline: formatDate(Number(_campaign[3])),
        donor: _campaign[4],
        beneficiary: _campaign[5],
        tokenGoal: Number(_campaign[6]),
        maxTokens: Number(_campaign[7]),
        initialDeposit: Number(_campaign[8]),
        refunds: Number(_campaign[9]),
        donations: Number(_campaign[10]),
        refundClaimed: _campaign[11],
        donationClaimed: _campaign[12],
        funded: _campaign[13],
        redeemedTokenCount: Number(_campaign[14])
    }

    log(`Campaign:`);
    logJson(data);

    return data;
}

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

        log(`JWT Token: ${jwt_token.slice(0, SLICE) + "........." + jwt_token.slice(-SLICE)}`);

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

        log(`Token: ${token_structure.jwt_token.slice(0, SLICE) + "........." + token_structure.jwt_token.slice(-SLICE)}`);
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
    log,
    formatDate,
    getPrivateKey,
    encodePacked,
    prepareCreationParams,
    getCampaign,
    generateToken,
    redeemToken
};