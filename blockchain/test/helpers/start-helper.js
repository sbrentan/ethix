const { generateTokens } = require("./token-helper.js");
const { 
    log,
    getTestName,
    getPrivateKey,
    encodePacked,
    increaseTime 
} = require("../../common/utils.js");
const { 
    DEFAULT_SLICE,
    DEFAULT_VALUE,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT,
} = require('../../common/constants.js');

const prepareStartParams = async (params = {}) => {

    const is_charity_test = getTestName() === "Charity";

    const _rwallet = web3.eth.accounts.create();
    
    const _randomString = is_charity_test && web3.utils.randomHex(32);
    const _campaignId = is_charity_test && (params.campaignId || web3.utils.keccak256(_randomString));
    const _seed = params.seed || web3.utils.randomHex(32);
    const _combinedHash = is_charity_test && encodePacked(_rwallet.address, _campaignId);
    const private_key = is_charity_test && params.private_key || getPrivateKey();
    const _sigdata = is_charity_test && await web3.eth.accounts.sign(_combinedHash, private_key);
    const _generateTokens = params.generateTokens || false;
    const _value = params.value || DEFAULT_VALUE;
    const _from = !is_charity_test && params.from.address || (await ethers.Wallet.createRandom()).address;

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    is_charity_test && log(`Signature: ${_sigdata.signature.slice(0, DEFAULT_SLICE) + "........." + _sigdata.signature.slice(-DEFAULT_SLICE)}`);
    !is_charity_test && log(`From: ${_from}`);
    log(`Generate tokens: ${_generateTokens}`);
    log(`Value: ${_value} ETH`);

    let return_params = {};
    
    return_params.seed = _seed;
    return_params.wallet = _rwallet;
    return_params.generateTokens = _generateTokens;
    return_params.value = _value;

    is_charity_test && (return_params.campaignId = _campaignId);
    is_charity_test && (return_params.signature = {
        r: _sigdata.r,
        s: _sigdata.s,
        v: _sigdata.v
    });

    !is_charity_test && (return_params.from = _from);

    return return_params;
}

const startCampaign = async (signers, params) => {

    const is_charity_test = getTestName() === "Charity";

    const owner_contract = signers.owner.contract;
    const donor_contract = signers.donor.contract;

    const campaignStart = () => 
        is_charity_test 
            ? donor_contract.startCampaign(
                params.campaignId,
                params.seed,
                params.wallet.address,
                params.signature,
                {
                    value: web3.utils.toWei(`${params.value}`, 'ether')
                })
            : donor_contract.start(
                params.seed,
                params.wallet.address,
                params.from,
                {
                    value: web3.utils.toWei(`${params.value}`, 'ether')
                }
            )

    try {
        const start_tx = await campaignStart();
        const start_receipt = await start_tx.wait();
        const campaignId = start_receipt?.logs[0]?.data; // campaign id

        params.campaignId = campaignId;
        
        const campaign_address = is_charity_test && await owner_contract.getCampaignAddress(campaignId);
        const campaign = is_charity_test && await ethers.getContractAt("Campaign", campaign_address);

        params.valid = true;
        const validJWTTokens = params.generateTokens ? await generateTokens(owner_contract, params) : null;
        
        params.valid = false;
        const invalidJWTTokens = params.generateTokens ? await generateTokens(owner_contract, params) : null;

        await increaseTime(Math.floor((DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT) / 2));

        log();
        log(`Campaign has started...`, tabs = 3, sep = '');

        let return_params = {};

        return_params.tx = start_tx;
        return_params.campaignId = campaignId;
        return_params.jwts = { 
            valid: {
                tokens: validJWTTokens ? validJWTTokens.jwt_tokens.map((jwt, _) => { return jwt.token; }) : [],
                salts: validJWTTokens ? validJWTTokens.token_salts : [],
                seed: validJWTTokens ? validJWTTokens.token_seed : null
            },
            invalid: {
                tokens: invalidJWTTokens ? invalidJWTTokens.jwt_tokens.map((jwt, _) => { return jwt.token; }) : [],
                salts: invalidJWTTokens ? invalidJWTTokens.token_salts : [],
                seed: invalidJWTTokens ? invalidJWTTokens.token_seed : null
            }
        }

        is_charity_test && (return_params.campaign_contract = campaign);
        !is_charity_test && (return_params.contract = donor_contract);

        return return_params;

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