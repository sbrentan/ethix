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
    getPrivateKey,
    logJson,
    getLogsFromTopic
} = require('../../../common/utils.js');

const prepareCreationParams = async (params = {}) => {
    const _title = params.title || DEFAULT_TITLE;

    const _block = await web3.eth.getBlock("latest");
    const _startingDate = params.startingDate || Math.floor(_block.timestamp + (DEFAULT_STARTDATE_SHIFT * HOUR));
    const _deadline = params.deadline || Math.floor(_startingDate + (DEFAULT_DEADLINE_SHIFT * HOUR));

    const _tokenGoal = params.tokenGoal || DEFAULT_TOKEN_GOAL;
    const _maxTokens = params.maxTokens || DEFAULT_MAX_TOKENS;
    const _beneficiary = params.beneficiary || (await ethers.Wallet.createRandom()).address;

    const _seed = web3.utils.randomHex(32);
    const _seedHash = web3.utils.keccak256(_seed);
    const private_key = params.private_key || getPrivateKey();
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

const createCampaign = async (contract, params) => {
    const campaignCreate = () => contract.createCampaign(
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
        const create_tx = await campaignCreate();
        const create_receipt = await create_tx.wait();
        const campaignId = create_receipt?.logs[0]?.data;
        const campaign_address = create_receipt?.logs[1]?.args[0];

        log(`Campaign ID: ${campaignId}`);
        log(`Campaign address: ${campaign_address}`);

        const campaign = await ethers.getContractAt("Campaign", campaign_address);

        return { tx: create_tx, campaign_contract: campaign, campaignId: campaignId }

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (campaignCreate)() }
        }
    }
}

const getCampaign = async (contract, campaignAddress) => {
    const _campaign = await contract.getCampaign(campaignAddress);

    if (_campaign.length == 0) return null;

    const start_timestamp = Number(_campaign[2]);
    const deadline_timestamp = Number(_campaign[3]);

    let data = {
        campaignId: _campaign[0],
        title: _campaign[1],
        startingDate: formatDate(start_timestamp),
        deadline: formatDate(deadline_timestamp),
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

    log();
    log(`Campaign details:`, tabs = 3, sep = '');
    logJson(data);

    data.startingDate = start_timestamp;
    data.deadline = deadline_timestamp;

    return data;
}

module.exports = {
    prepareCreationParams,
    createCampaign,
    getCampaign
}