const { 
    prepareCreationParams,
    getCampaign
} = require("../helpers/creation-helper.js");
const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const { assertOrganizationVerification } = require("../assertions/verification-assertions.js");
const {
    assertCampaignCreation,
    assertCampaignCreationFailure,
    assertCreationParamsValidity,
    assertDifferentCampaignIds,
    assertCampaignToBeInArray
} = require("../assertions/creation-assertions.js");
const { log } = require("../../common/utils.js");
const { HOUR } = require('../../common/constants.js');

const test_beneficiary_is_not_verified = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test beneficiary is unverified => revert]`, tabs = 2, sep = '');

    const _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    await assertCampaignCreationFailure(_signers, _params);
}

const test_campaign_id_is_different = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test campaign id is different]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    const _params = await prepareCreationParams({
        beneficiary: _signers.beneficiary
    }).then(assertCreationParamsValidity);

    const _campaignId1 = await assertCampaignCreation(_signers, _params);
    const _campaignId2 = await assertCampaignCreation(_signers, _params);

    assertDifferentCampaignIds(_campaignId1, _campaignId2);
}
    
const test_dates_are_properly_defined = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    const _block = await web3.eth.getBlock('latest');
    let _startingDate = Math.floor(_block.timestamp + (12 * HOUR));
    let _deadline = Math.floor(_block.timestamp - (24 * HOUR));

    log();
    log(`[Test dates are properly defined]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    log();
    log(`* [Case 1]: Starting date > deadline => revert`, tabs = 3, sep = '');
    let _params = await prepareCreationParams({
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: _signers.beneficiary
    }).then(assertCreationParamsValidity)
    
    await assertCampaignCreationFailure(_signers, _params);

    _startingDate = Math.floor(_block.timestamp - (12 * HOUR));
    _deadline = Math.floor(_block.timestamp + (24 * HOUR));

    log();
    log(`* [Case 2]: Starting date is in the past => revert`, tabs = 3, sep = '');
    _params = await prepareCreationParams({
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: _signers.beneficiary
    }).then(assertCreationParamsValidity)

    await assertCampaignCreationFailure(_signers, _params);
}

const test_token_goal_is_less_than_max_tokens = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test tokenGoal > maxTokens => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    const _params = await prepareCreationParams({
        tokenGoal: 10,
        maxTokens: 5,
        beneficiary: _signers.beneficiary
    }).then(assertCreationParamsValidity);

    await assertCampaignCreationFailure(_signers, _params);
}

const test_creation_signature_is_correct = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);
    
    log();
    log(`[Test signature is incorrect => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);
    
    const _key = (await ethers.Wallet.createRandom()).privateKey;
    const _params = await prepareCreationParams({
        private_key: _key,
        beneficiary: _signers.beneficiary
    }).then(assertCreationParamsValidity);

    await assertCampaignCreationFailure(_signers, _params);
}

const test_campaign_creation = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test campaign creation]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);
    
    const _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);
    
    const _campaignId = await assertCampaignCreation(_signers, _params);

    const _campaigns = await contract.getCampaignsIds()
    assertCampaignToBeInArray(_campaignId, _campaigns);
}

const test_get_campaign = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test view campaigns details]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    const _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    await getCampaign(contract, _campaignId).then(assertCreationParamsValidity);
}

module.exports = {
    test_beneficiary_is_not_verified,
    test_campaign_id_is_different,
    test_dates_are_properly_defined,
    test_token_goal_is_less_than_max_tokens,
    test_creation_signature_is_correct,
    test_campaign_creation,
    test_get_campaign
}
