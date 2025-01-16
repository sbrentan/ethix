const { 
    log,
    increaseTime
} = require("../../../common/utils.js");
const { getCampaign } = require("./common-helper.js");
const { generateToken } = require("./token-helper.js");
const { 
    DEFAULT_VALUE,
    DEFAULT_GENERATED_TOKENS,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT
} = require('../../../common/constants.js');

const prepareStartParams = async (params = {}) => {

    const _seed = params?.seed || web3.utils.randomHex(32);
    const _rwallet = web3.eth.accounts.create();
    const _from = params?.from?.address || web3.eth.accounts.create().address;
    const _value = params?.value || DEFAULT_VALUE;

    const _generateTokens = params?.generateTokens || false;
    const _amount = params?.amount || DEFAULT_GENERATED_TOKENS;
    const _decode = params?.decode || false;

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    log(`From: ${_from}`);
    log(`Generate tokens: ${_generateTokens}`);
    log(`Amount of valid tokens: ${_amount}`);
    log(`Decode: ${_decode}`);
    log(`Value: ${_value} ETH`);

    return {
        seed: _seed,
        wallet: _rwallet,
        from: _from,
        generateTokens: _generateTokens,
        amount: _amount,
        decode: _decode,
        value: _value,
    }
}

const startCampaign = async (signers, params) => {

    const owner_contract = signers.owner.contract;

    const campaignStart = () => 
        owner_contract.start(
            params.seed,
            params.wallet.address,
            params.from,
            {
                value: web3.utils.toWei(`${params.value}`, 'ether')
            }
        )

    try {
        log(`[Pre-start] Block number: ${await web3.eth.getBlockNumber()}`);

        const start_tx = await campaignStart();

        log();
        log(`Start process:`, tabs = 3, sep = '');
        log(`[Post-start] Block number: ${await web3.eth.getBlockNumber()}`);

        log();
        log(`Getting campaign details...`, tabs = 3, sep = '');

        const details = await getCampaign(owner_contract);

        let return_params = {}
        return_params.tokens = null;

        if (params.generateTokens) {
            log();
            log(`Generating tokens...`, tabs = 3, sep = '');

            params.campaignId = details.campaignId;
            
            // By default, repeat params.amount times
            const validTokens = await Promise.all(Array.from({ length: params.amount }, (_, i) => generateToken(owner_contract, params, index = i, valid = true)));
            
            // By default, repeat only once
            const invalidToken = await generateToken(owner_contract, params, index = 0, valid = false);

            return_params.tokens = {
                valid: validTokens,
                invalid: invalidToken
            }
        }

        await increaseTime(Math.floor((DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT) / 2));

        log();
        log(`Campaign has started...`, tabs = 3, sep = '');

        return_params.tx = start_tx;
        return_params.details = details;

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