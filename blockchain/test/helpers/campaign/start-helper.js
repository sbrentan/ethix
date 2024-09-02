const { 
    log,
    increaseTime 
} = require("../../../common/utils.js");
const { 
    DEFAULT_VALUE,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT 
} = require('../../../common/constants.js');

const prepareStartParams = async (params = {}) => {
    const _rwallet = web3.eth.accounts.create();
    const _seed = web3.utils.randomHex(32);
    const _from = params.from.address || (await ethers.Wallet.createRandom()).address;
    const _value = params.value || DEFAULT_VALUE;

    log();
    log(`Start params:`, tabs = 3, sep = '');
    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    log(`Value: ${_value} ETH`);

    return {
        seed: _seed,
        wallet: _rwallet,
        from: _from,
        value: _value
    }
}

const startCampaign = async (contract, params, owner_contract = null) => {
    const campaignStart = () => contract.start(
        params.seed,
        params.wallet.address,
        params.from,
        {
            value: web3.utils.toWei(`${params.value}`, 'ether')
        }
    );

    try {
        const start_tx = await campaignStart();
        const start_receipt = await start_tx.wait();
        const campaignId = start_receipt?.logs[0]?.args[0];

        await increaseTime(Math.floor((DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT) / 2));

        log();
        log(`Campaign has started...`, tabs = 3, sep = '');

        return { 
            tx: start_tx,
            campaignId: campaignId
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