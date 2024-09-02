const { generateTokens } = require("./token-helper.js");
const { 
    log,
    getPrivateKey,
    encodePacked,
    increaseTime 
} = require("../../../common/utils.js");
const { 
    DEFAULT_SLICE,
    DEFAULT_VALUE,
    DEFAULT_MAX_TOKENS,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT,
    DEFAULT_INVALID_TOKENS, 
} = require('../../../common/constants.js');

const prepareStartParams = async (params = {}) => {
    const _rwallet = web3.eth.accounts.create();
    
    const _randomString = web3.utils.randomHex(32);
    const _campaignId = params.campaignId || web3.utils.keccak256(_randomString);
    const _seed = params.seed || web3.utils.randomHex(32);
    const _combinedHash = encodePacked(_rwallet.address, _campaignId);
    const private_key = params.private_key || getPrivateKey();
    const _sigdata = await web3.eth.accounts.sign(_combinedHash, private_key);
    const _generateTokens = params.generateTokens || false;
    const _invalidAmount = params.invalidAmount == 0 ? 0 : params.invalidAmount || DEFAULT_INVALID_TOKENS;
    const _value = params.value || DEFAULT_VALUE;

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    log(`Signature: ${_sigdata.signature.slice(0, DEFAULT_SLICE) + "........." + _sigdata.signature.slice(-DEFAULT_SLICE)}`);
    log(`Generate tokens: ${_generateTokens}`);
    log(`Invalid tokens: ${_invalidAmount}`);
    log(`Value: ${_value} ETH`);

    return {
        campaignId: _campaignId,
        seed: _seed,
        wallet: _rwallet,
        signature: {
            r: _sigdata.r,
            s: _sigdata.s,
            v: _sigdata.v
        },
        generateTokens: _generateTokens,
        tokenAmount: DEFAULT_MAX_TOKENS,
        invalidTokenAmount: _invalidAmount,
        contract: params.contract,
        value: _value
    }
}

const startCampaign = async (contract, params, owner_contract = null) => {
    const campaignStart = () => contract.startCampaign(
        params.campaignId,
        params.seed,
        params.wallet.address,
        params.signature,
        {
            value: web3.utils.toWei(`${params.value}`, 'ether')
        }
    );

    try {
        const start_tx = await campaignStart();
        const start_receipt = await start_tx.wait();
        const campaignId = start_receipt?.logs[0]?.data; // campaign id
        
        const campaign_address = start_receipt?.logs[1]?.args[0];
        const campaign = await ethers.getContractAt("Campaign", campaign_address);

        let validJWTTokens, invalidJWTTokens;

        if (owner_contract) {
            validJWTTokens = params.generateTokens ? await generateTokens(owner_contract, params.seed, params.campaignId, params.wallet, params.tokenAmount) : null;
            invalidJWTTokens = params.generateTokens ? await generateTokens(owner_contract, params.seed, params.campaignId, params.wallet, params.invalidTokenAmount, false) : null;
        }

        const validTokens = validJWTTokens ? validJWTTokens.jwt_tokens.map((jwt, _) => { return jwt.token; }) : [];
        const invalidTokens = invalidJWTTokens ? invalidJWTTokens.jwt_tokens.map((jwt, _) => { return jwt.token; }) : [];

        await increaseTime(Math.floor((DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT) / 2));

        log();
        log(`Campaign has started...`, tabs = 3, sep = '');

        return { 
            tx: start_tx,
            campaign_contract: campaign,
            campaignId: campaignId,
            jwts: {
                valid: {
                    tokens: validTokens,
                    salts: validJWTTokens ? validJWTTokens.token_salts : [],
                    seed: validJWTTokens ? validJWTTokens.token_seed : null
                },
                invalid: {
                    tokens: invalidTokens,
                    salts: invalidJWTTokens ? invalidJWTTokens.token_salts : [],
                    seed: invalidJWTTokens ? invalidJWTTokens.token_seed : null
                }
            }
        };

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (campaignStart)() }
        }
    }
}

module.exports = {
    prepareStartParams,
    startCampaign
}