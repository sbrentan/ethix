const { validateToken } = require("../helpers/token-helper.js");
const {
    prepareCreationParams,
    getCampaign
} = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const { assertOrganizationVerification } = require("./organization-verification.test.js");
const { 
    verifyCreationParams,
    assertCampaignCreation 
} = require("./campaign-creation.test.js");
const { 
    verifyStartParams,
    assertCampaignStart 
} = require("./campaign-start.test.js");
const { log } = require("../common/utils.js");
const { expect } = require("chai");


module.exports.test_redeeming_fails_with_invalid_token = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T016]: Token is not valid => revert`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        invalidAmount: 1
    }).then(verifyStartParams);

    const _jwts = await assertCampaignStart(donor_charity, _params, owner_contract = charity);

    _retVal = await validateToken(charity, _campaignId, _jwts.invalid, false);
    expect(_retVal).to.be.false;

    await getCampaign(charity, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(0);
    });
}

module.exports.test_valid_token_is_redeemed = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T017]: Token is not valid => revert`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);
    
    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 1
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor_charity, _params, owner_contract = charity);

    _retVal = await validateToken(charity, _campaignId, _jwts.valid);
    expect(_retVal).to.be.true;

    await getCampaign(charity, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(1);
    });
}

Object.assign(global, module.exports);