const { prepareCreationParams } = require("../helpers/creation-helper.js");
const { 
    prepareStartParams, 
    startCampaign 
} = require("../helpers/start-helper.js");
const { assertOrganizationVerification } = require("./organization-verification.test.js");
const { 
    verifyCreationParams,
    assertCampaignCreation 
} = require("./campaign-creation.test.js");
const { log } = require("../common/utils.js");
const { expect } = require("chai");

const assertCampaignStartFailure = async (donor_charity, params) => {
    const start_tx_outcome = await startCampaign(donor_charity, params);
    await expect(start_tx_outcome.method).to.be.reverted;
    expect(start_tx_outcome.tx).to.be.null;
}

module.exports.assertCampaignStart = async (donor_charity, params, owner_charity = null) => {
    const start_tx_outcome = await startCampaign(donor_charity, params, owner_charity);
    await expect(start_tx_outcome.tx).to.emit(donor_charity, "CampaignStarted");
    expect(start_tx_outcome.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    return start_tx_outcome.jwts || {};
}

module.exports.verifyStartParams = (params) => {

    // Start params verification
    params?.campaignId && expect(params.campaignId).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.seed && expect(params.seed).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.wallet && expect(params.wallet).to.be.an("object").that.includes.keys('address', 'privateKey');
    expect(params.wallet.address).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    expect(params.wallet.privateKey).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.value && expect(params.value).to.be.a("number").that.is.greaterThan(0);

    // Verifying the signature object
    params?.signature && expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    params?.signature?.r && expect(params.signature.r).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.signature?.s && expect(params.signature.s).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.signature?.v && expect(params.signature.v).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{2}$/);

    // Verifying the optional parameters
    params?.generateTokens && expect(params.generateTokens).to.be.a("boolean");
    params?.validAmount && expect(params.validAmount).to.be.a("number").that.is.at.least(0);
    params?.invalidAmount && expect(params.invalidAmount).to.be.a("number").that.is.at.least(0);

    return params;
}

module.exports.test_not_existing_campaign = async (charity, donor) => {
    expect(donor.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T013]: Campaign is not created => revert`, tabs = 2, sep = '');

    const _params = await prepareStartParams().then(this.verifyStartParams);
    await assertCampaignStartFailure(donor_charity, _params);
}

module.exports.test_start_fails_if_signature_is_incorrect = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T014]: Token is not valid => revert`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    const _key = (await ethers.Wallet.createRandom()).privateKey;
    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        private_key: _key,
        beneficiary: beneficiary.address
    }).then(this.verifyStartParams);

    await assertCampaignStartFailure(donor_charity, _params);
}

module.exports.test_campaign_start = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T015]: Campaign start`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed
    }).then(this.verifyStartParams);
    
    await this.assertCampaignStart(donor_charity, _params);
}

Object.assign(global, {
    test_not_existing_campaign: module.exports.test_not_existing_campaign,
    test_start_fails_if_signature_is_incorrect: module.exports.test_start_fails_if_signature_is_incorrect,
    test_campaign_start: module.exports.test_campaign_start
});