const { 
    HOUR,
    DEFAULT_SLICE, 
    DEFAULT_TITLE,
    DEFAULT_TOKEN_GOAL,
    DEFAULT_MAX_TOKENS,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT 
} = require('../../../common/constants.js');
const { 
    log,
    formatDate,
    getPrivateKey
} = require('../../../common/utils.js');

const prepareCreationParams = async (params = {}) => {
    const _title = params?.title || DEFAULT_TITLE;

    const _block = await web3.eth.getBlock("latest");
    const _startingDate = params?.startingDate || Math.floor(_block.timestamp + (DEFAULT_STARTDATE_SHIFT * HOUR));
    const _deadline = params?.deadline || Math.floor(_startingDate + (DEFAULT_DEADLINE_SHIFT * HOUR));

    const _tokenGoal = params?.tokenGoal || DEFAULT_TOKEN_GOAL;
    const _maxTokens = params?.maxTokens || DEFAULT_MAX_TOKENS;
    const _beneficiary = params?.beneficiary?.address || web3.eth.accounts.create().address;

    const _seed = web3.utils.randomHex(32);
    const _seedHash = web3.utils.keccak256(_seed);
    const private_key = params?.private_key || getPrivateKey();
    const _sigdata = await web3.eth.accounts.sign(_seedHash, private_key);

    log();
    log(`Creation params:`, tabs = 3, sep = '');
    log(`Title: ${_title}`);
    log(`Starting date: ${formatDate(_startingDate)}`);
    log(`Deadline: ${formatDate(_deadline)}`);
    log(`Token goal: ${_tokenGoal}`);
    log(`Max tokens: ${_maxTokens}`);
    log(`Beneficiary: ${_beneficiary}`);
    log(`Seed: ${_seed}`);
    log(`Seed hash: ${_seedHash}`);
    log(`Signature: ${_sigdata.signature.slice(0, DEFAULT_SLICE) + "........." + _sigdata.signature.slice(-DEFAULT_SLICE)}`);

    return {
        title: _title,
        startingDate: _startingDate,
        deadline: _deadline,
        tokenGoal: _tokenGoal,
        maxTokens: _maxTokens,
        beneficiary: _beneficiary,
        seed: _seed,
        seedHash: _seedHash,
        signature: {
            r: _sigdata.r,
            s: _sigdata.s,
            v: _sigdata.v
        }
    }
}

const createCampaign = async (signers, params) => {

    const donor_contract = signers.donor.contract;

    const campaignCreate = () => donor_contract.createCampaign(
        params.title,
        params.startingDate,
        params.deadline,
        params.tokenGoal,
        params.maxTokens,
        params.beneficiary,
        params.seedHash,
        params.signature
    );

    try {
        
        log(`[Pre-creation] Block number: ${await web3.eth.getBlockNumber()}`);

        const create_tx = await campaignCreate();
        const create_receipt = await create_tx.wait();
        const campaignId = create_receipt?.logs[0]?.data;

        log();
        log(`Creation process:`, tabs = 3, sep = '');
        log(`[Post-creation] Block number: ${await web3.eth.getBlockNumber()}`);
        log(`Campaign ID: ${campaignId}`);

        return { 
            tx: create_tx, 
            contract: donor_contract, 
            campaignId: campaignId 
        }

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (campaignCreate)() }
        }
    }
}

module.exports = {
    prepareCreationParams,
    createCampaign
}