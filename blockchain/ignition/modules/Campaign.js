const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const {
    HOUR,
    DEFAULT_TITLE,
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT,
    DEFAULT_TOKEN_GOAL,
    DEFAULT_MAX_TOKENS
} = require("../../common/constants.js");
const { log } = require("../../common/utils.js");

const buildCampaign = async (accounts) => {
    
    const _block = await web3.eth.getBlock("latest");

    const CAMPAIGN_ID = web3.utils.keccak256(web3.utils.randomHex(32));
    const DONOR = accounts.donor.address;
    const BENEFICIARY = accounts.beneficiary.address;
    const START_DATE = Math.floor(_block.timestamp + (DEFAULT_STARTDATE_SHIFT * HOUR));
    const END_DATE = Math.floor(_block.timestamp + (DEFAULT_DEADLINE_SHIFT * HOUR));

    const campaign_module = buildModule("CampaignModule", (m) => {

        const campaign = m.contract("Campaign", [
            CAMPAIGN_ID,
            DEFAULT_TITLE,
            START_DATE,
            END_DATE,
            DONOR,
            BENEFICIARY,
            DEFAULT_TOKEN_GOAL,
            DEFAULT_MAX_TOKENS
        ]);

        log();
        log(`Constructor:`, tabs = 2, sep = '');
        log(`Campaign ID: ${CAMPAIGN_ID}`);
        log(`Title: ${DEFAULT_TITLE}`);
        log(`Start date: ${START_DATE}`);
        log(`End date: ${END_DATE}`);
        log(`Donor: ${DONOR}`);
        log(`Beneficiary: ${BENEFICIARY}`);
        log(`Token goal: ${DEFAULT_TOKEN_GOAL}`);
        log(`Max tokens: ${DEFAULT_MAX_TOKENS}`);

        return { campaign };

    }); 

    return campaign_module;
}

module.exports = buildCampaign;
