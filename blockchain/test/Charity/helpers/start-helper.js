const { generateToken } = require("./token-helper.js");
const {
    log,
    getPrivateKey,
    encodePacked,
    increaseTime
} = require("../../../common/utils.js");
const {
    DEFAULT_SLICE,
    DEFAULT_VALUE,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT,
    DEFAULT_GENERATED_TOKENS
} = require('../../../common/constants.js');

const prepareStartParams = async (params = {}) => {

    
    const _randomString = web3.utils.randomHex(32);
    const _campaignId = (params?.campaignId || web3.utils.keccak256(_randomString));
    const _seed = params?.seed || web3.utils.randomHex(32);
    const _rwallet = web3.eth.accounts.create();
    const _combinedHash = encodePacked(_rwallet.address, _campaignId);
    const private_key = params?.private_key || getPrivateKey();
    const _sigdata = await web3.eth.accounts.sign(_combinedHash, private_key);
    const _emulate = params?.emulate || false; // For block number testing, to avoid block number increase

    const _generateTokens = params?.generateTokens || false;
    const _amount = params?.amount || DEFAULT_GENERATED_TOKENS;
    const _decode = params?.decode || false;
    const _value = params?.value || DEFAULT_VALUE;

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Campaign ID: ${_campaignId}`);
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    log(`Signature: ${_sigdata.signature.slice(0, DEFAULT_SLICE) + "........." + _sigdata.signature.slice(-DEFAULT_SLICE)}`);
    log(`Emulate start: ${_emulate}`);
    log(`Generate tokens: ${_generateTokens}`);
    log(`Amount of valid tokens: ${_amount}`);
    log(`Decode: ${_decode}`);
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
        emulate: _emulate,
        generateTokens: _generateTokens,
        amount: _amount,
        decode: _decode,
        value: _value
    }
}

const startCampaign = async (signers, params) => {

    const owner_contract = signers.owner.contract;
    const donor_contract = signers.donor.contract;

    const campaignStart = () =>
        params.emulate
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

    try {
        log(`[Pre-start] Block number: ${await web3.eth.getBlockNumber()}`);

        const start_tx = await campaignStart();
        const start_receipt = await start_tx.wait();
        const campaignId = start_receipt?.logs[0]?.data; // campaign id

        log();
        log(`Start process:`, tabs = 3, sep = '');
        log(`[Post-start] Block number: ${await web3.eth.getBlockNumber()}`);

        if (campaignId !== params.campaignId) throw new Error(`Campaign ID mismatch!`);

        log(`Campaign ID match for creation and start: ${campaignId}`);

        let return_params = {};
        return_params.tokens = null;

        if (params.generateTokens) {
            log(`Generating tokens...`, tabs = 3, sep = '');
            
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
        return_params.contract = donor_contract;
        return_params.campaignId = campaignId;

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