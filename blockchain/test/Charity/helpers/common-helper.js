const { 
    log,
    formatDate,
    logJson
} = require('../../../common/utils.js');

const getCampaign = async (contract, campaignId) => {
    const _campaign = await contract.getCampaign(campaignId);

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
    getCampaign
}