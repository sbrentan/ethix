const { validateToken } = require("../helpers/token-helper.js");
const {
    prepareCreationParams,
    getCampaign
} = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const { assertAccountsValidity } = require("./contract-deployment.test.js");
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


module.exports.test_redeeming_fails_with_invalid_token = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        invalidAmount: 1
    }).then(verifyStartParams);

    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    _retVal = await validateToken(contract, _campaignId, _jwts.invalid, false);
    expect(_retVal).to.be.false;

    await getCampaign(contract, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(0);
    });
}

module.exports.test_valid_token_is_redeemed = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);
    
    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 1
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    _retVal = await validateToken(contract, _campaignId, _jwts.valid);
    expect(_retVal).to.be.true;

    await getCampaign(contract, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(1);
    });
}

Object.assign(global, module.exports);