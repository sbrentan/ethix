const { log } = require("../../../common/utils.js");
const { getCampaign } = require("./common-helper.js");
const { DEFAULT_VALUE } = require('../../../common/constants.js');

const prepareStartParams = async (params = {}) => {

    const _seed = params?.seed || web3.utils.randomHex(32);
    const _rwallet = web3.eth.accounts.create();
    const _from = params?.from?.address || web3.eth.accounts.create().address;
    const _value = params?.value || DEFAULT_VALUE;

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    log(`From: ${_from}`);
    log(`Value: ${_value} ETH`);

    return {
        seed: _seed,
        wallet: _rwallet,
        from: _from,
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

        return {
            tx: start_tx,
            details: details
        }

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