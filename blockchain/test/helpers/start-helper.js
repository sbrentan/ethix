const { generateToken } = require("./token-helper.js");
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
    DEFAULT_GENERATED_TOKENS
} = require('../../common/constants.js');

const prepareStartParams = async (params = {}) => {

    const is_charity_test = getTestName() === "Charity";

    const _rwallet = web3.eth.accounts.create();

    const _randomString = is_charity_test && web3.utils.randomHex(32);
    const _campaignId = is_charity_test && (params?.campaignId || web3.utils.keccak256(_randomString));
    const _seed = params?.seed || web3.utils.randomHex(32);
    const _combinedHash = is_charity_test && encodePacked(_rwallet.address, _campaignId);
    const private_key = is_charity_test && params?.private_key || getPrivateKey();
    const _sigdata = is_charity_test && await web3.eth.accounts.sign(_combinedHash, private_key);
    const _generateTokens = params?.generateTokens || false;
    const _amount = params?.amount || DEFAULT_GENERATED_TOKENS;
    const _decode = params?.decode || false;
    const _emulate = params?.emulate || false;
    const _value = params?.value || DEFAULT_VALUE;
    const _from = !is_charity_test && (params?.from?.address || web3.eth.accounts.create().address);

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    is_charity_test && log(`Signature: ${_sigdata.signature.slice(0, DEFAULT_SLICE) + "........." + _sigdata.signature.slice(-DEFAULT_SLICE)}`);
    !is_charity_test && log(`From: ${_from}`);
    log(`Generate tokens: ${_generateTokens}`);
    log(`Amount of valid tokens: ${_amount}`);
    log(`Decode: ${_decode}`);
    log(`Emulate start: ${_emulate}`);
    log(`Value: ${_value} ETH`);

    let return_params = {};

    return_params.seed = _seed;
    return_params.wallet = _rwallet;
    return_params.generateTokens = _generateTokens;
    return_params.amount = _amount;
    return_params.decode = _decode;
    return_params.emulate = _emulate;
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
            ? params.emulate
                ? ethers.provider.call({
                    to: donor_contract.target,
                    data: donor_contract.interface.encodeFunctionData("startCampaign", [
                        params.campaignId,
                        params.seed,
                        params.wallet.address,
                        params.signature
                    ]),
                    from: signers.donor.address,
                    value: web3.utils.toWei(`${params.value}`, 'ether')
                })
                : donor_contract.startCampaign(
                    params.campaignId,
                    params.seed,
                    params.wallet.address,
                    params.signature,
                    {
                        value: web3.utils.toWei(`${params.value}`, 'ether')
                    }
                )
            : owner_contract.start(
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
        const start_receipt = await start_tx.wait();
        const campaignId = start_receipt?.logs[0]?.data; // campaign id

        log();
        log(`Start process:`, tabs = 3, sep = '');
        log(`[Post-start] Block number: ${await web3.eth.getBlockNumber()}`);

        params.campaignId = campaignId;

        const campaign_address = is_charity_test && await owner_contract.getCampaignAddress(campaignId);
        const campaign = is_charity_test && await ethers.getContractAt("Campaign", campaign_address);

        // By default, repeat params.amount times
        const validTokens =
            params.generateTokens
                && await Promise.all(Array.from({ length: params.amount }, (_, i) => generateToken(owner_contract, params, index = i, valid = true)));

        // By default, repeat only once
        const invalidToken = params.generateTokens && await generateToken(owner_contract, params, index = 0, valid = false);

        await increaseTime(Math.floor((DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT) / 2));

        log();
        log(`Campaign has started...`, tabs = 3, sep = '');

        let return_params = {};

        return_params.tx = start_tx;
        return_params.campaignId = campaignId;
        return_params.tokens = params.generateTokens ? {
            valid: validTokens,
            invalid: invalidToken
        } : null;

        return_params.contract = is_charity_test ? campaign : owner_contract;

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