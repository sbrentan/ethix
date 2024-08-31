const { 
    prepareCreationParams,
    createCampaign,
    getCampaign
} = require("../helpers/creation-helper.js");
const { assertOrganizationVerification } = require("./organization-verification.test.js");
const { log } = require("../common/utils.js");
const { HOUR } = require('../common/constants.js');
const { expect } = require("chai");

const assertCampaignCreationFailure = async (donor_charity, params) => {
    const create_tx_outcome = await createCampaign(donor_charity, params);
    await expect(create_tx_outcome.method).to.be.reverted;
    expect(create_tx_outcome.tx).to.be.null;
}

module.exports.assertCampaignCreation = async (donor_charity, params) => {
    const create_tx_outcome = await createCampaign(donor_charity, params);
    await expect(create_tx_outcome.tx).to.emit(donor_charity, "CampaignCreated");
    expect(create_tx_outcome.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    return create_tx_outcome.campaignId;
}

module.exports.verifyCreationParams = (params) => {

    // General verification
    params?.campaignId && expect(params.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    params?.title && expect(params.title).to.be.a("string").that.is.not.empty;
    params?.startingDate && expect(params.startingDate).to.be.a("number").that.is.above(0);
    params?.deadline && expect(params.deadline).to.be.a("number").that.is.above(0);
    params?.tokenGoal && expect(params.tokenGoal).to.be.a("number").that.is.above(0);
    params?.maxTokens && expect(params.maxTokens).to.be.a("number").that.is.above(0);
    params?.donor && expect(params.donor).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    params?.beneficiary && expect(params.beneficiary).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    params?.initialDeposit && expect(params.initialDeposit).to.be.a("number").that.is.at.least(0);
    params?.refunds && expect(params.refunds).to.be.a("number").that.is.at.least(0);
    params?.donations && expect(params.donations).to.be.a("number").that.is.at.least(0);
    params?.refundClaimed && expect(params.refundClaimed).to.be.a("boolean");
    params?.donationClaimed && expect(params.donationClaimed).to.be.a("boolean");
    params?.funded && expect(params.funded).to.be.a("boolean");
    params?.donations && expect(params.donations).to.be.a("number").that.is.at.least(0);

    // Creation specific verification
    params?.seedHash && expect(params.seedHash).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    params?.signature && expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    params?.signature?.r && expect(params.signature.r).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    params?.signature?.s && expect(params.signature.s).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    params?.signature?.v && expect(params.signature.v).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{2}$/);

    return params;
}

module.exports.test_beneficiary_is_not_verified = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    const donor_charity = charity.connect(donor);

    log();
    log(`[Test beneficiary is unverified => revert]`, tabs = 2, sep = '');

    const _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(this.verifyCreationParams);

    await assertCampaignCreationFailure(donor_charity, _params);
}

module.exports.test_campaign_id_is_different = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test campaign id is different]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    const _params = await prepareCreationParams({
        beneficiary: beneficiary.address
    }).then(this.verifyCreationParams);

    const _campaignId1 = await this.assertCampaignCreation(donor_charity, _params);
    const _campaignId2 = await this.assertCampaignCreation(donor_charity, _params);

    expect(_campaignId1).to.not.equal(_campaignId2);
}
    

module.exports.test_dates_are_properly_defined = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    let _block = await ethers.provider.getBlock("latest");
    let _startingDate = Math.floor(_block.timestamp + (12 * HOUR));
    let _deadline = Math.floor(_block.timestamp - (24 * HOUR));

    log();
    log(`[Test dates are properly defined]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    log();
    log(`* [Case 1]: Starting date > deadline => revert`, tabs = 3, sep = '');
    let _params = await prepareCreationParams({
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: beneficiary.address
    }).then(this.verifyCreationParams)
    
    await assertCampaignCreationFailure(donor_charity, _params);

    _startingDate = Math.floor(_block.timestamp - (12 * HOUR));
    _deadline = Math.floor(_block.timestamp + (24 * HOUR));

    log();
    log(`* [Case 2]: Starting date is in the past => revert`, tabs = 3, sep = '');
    _params = await prepareCreationParams({
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: beneficiary.address
    }).then(this.verifyCreationParams)

    await assertCampaignCreationFailure(donor_charity, _params);
}

module.exports.test_token_goal_is_less_than_max_tokens = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test tokenGoal > maxTokens => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    const _params = await prepareCreationParams({
        tokenGoal: 10,
        maxTokens: 5,
        beneficiary: beneficiary.address
    }).then(this.verifyCreationParams);

    await assertCampaignCreationFailure(donor_charity, _params);
}

module.exports.test_creation_signature_is_correct = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);
    
    log();
    log(`[Test signature is incorrect => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);
    
    const _key = (await ethers.Wallet.createRandom()).privateKey;
    const _params = await prepareCreationParams({
        private_key: _key,
        beneficiary: beneficiary.address
    }).then(this.verifyCreationParams);

    await assertCampaignCreationFailure(donor_charity, _params);
}

module.exports.test_campaign_creation = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test campaign creation]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);
    
    const _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(this.verifyCreationParams);
    
    const _campaignId = await this.assertCampaignCreation(donor_charity, _params);

    const _campaigns = await charity.getCampaignsIds()
    expect(_campaigns).to.be.an("array").that.includes(_campaignId);
}

module.exports.test_get_campaign = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test view campaigns details]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    const _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(this.verifyCreationParams);

    const _campaignId = await this.assertCampaignCreation(donor_charity, _params);

    await getCampaign(charity, _campaignId).then(this.verifyCreationParams);
}

Object.assign(global, {
    test_beneficiary_is_not_verified: module.exports.test_beneficiary_is_not_verified,
    test_campaign_id_is_different: module.exports.test_campaign_id_is_different,
    test_dates_are_properly_defined: module.exports.test_dates_are_properly_defined,
    test_token_goal_is_less_than_max_tokens: module.exports.test_token_goal_is_less_than_max_tokens,
    test_creation_signature_is_correct: module.exports.test_creation_signature_is_correct,
    test_campaign_creation: module.exports.test_campaign_creation,
    test_get_campaign: module.exports.test_get_campaign
});