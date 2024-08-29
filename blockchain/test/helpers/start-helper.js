const { 
    log,
    getPrivateKey,
    encodePacked 
} = require("../common/utils.js");
const { 
    DEFAULT_SLICE,
    DEFAULT_VALUE 
} = require('../common/constants.js');
const crypto = require('crypto');

const prepareStartParams = async (params = {}) => {
    const _rwallet = web3.eth.accounts.create();
    
    const _randomString = crypto.randomBytes(20).toString('hex');
    const _campaignId = params.campaignId || web3.utils.keccak256(_randomString);
    const _seed = params.seed || web3.utils.randomHex(32);
    const _combinedHash = encodePacked(_rwallet.address, _campaignId);
    const private_key = params.private_key || getPrivateKey();
    const _sigdata = await web3.eth.accounts.sign(_combinedHash, private_key);

    log(`Seed: ${_seed}`);
    log(`Random wallet address: ${_rwallet.address}`);
    log(`Random wallet private key: ${_rwallet.privateKey}`);
    log(`Signature: ${_sigdata.signature.slice(0, DEFAULT_SLICE) + "........." + _sigdata.signature.slice(-DEFAULT_SLICE)}`);

    return {
        campaignId: _campaignId,
        seed: _seed,
        wallet: _rwallet,
        signature: {
            r: _sigdata.r,
            s: _sigdata.s,
            v: _sigdata.v
        }
    }
}

const startCampaign = async (contract, params) => {
    try {
        const start_tx = await contract.startCampaign(
            params.campaignId,
            params.seed,
            params.wallet.address,
            params.signature,
            {
				value: web3.utils.toWei(`${params.value || DEFAULT_VALUE}`, 'ether')
			}
        );

        const start_receipt = await start_tx.wait();
        const start_data = start_receipt?.logs[0]?.data; // campaign id

        return { 
            start_tx: start_tx,
            campaignId: start_data 
        };

    } catch (e) {
        return null;
    }
}

module.exports = {
    prepareStartParams,
    startCampaign
}