const { validateToken } = require("../helpers/charity/token-helper.js");
const {
    prepareCreationParams,
    getCampaign
} = require("../helpers/charity/creation-helper.js");
const { prepareStartParams } = require("../helpers/charity/start-helper.js");
const { assertAccountsValidity } = require("./contract-deployment.test.js").assertions;
const { assertOrganizationVerification } = require("./organization-verification.test.js").assertions;
const { 
    assertCampaignCreation, 
    assertCreationParamsValidity
} = require("./campaign-creation.test.js").assertions;
const { 
    assertCampaignStart, 
    assertStartParamsValidity
} = require("./campaign-start.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertTokenValidity = async (contract, params) => {
    const validate_tx_outcome = await validateToken(contract, params.jwts, params.valid);
    await expect(validate_tx_outcome.tx).to.emit(validate_tx_outcome.campaign_contract, "TokensRedeemed");
    expect(validate_tx_outcome.is_valid).to.be.true;
    expect(validate_tx_outcome.batch_size).to.be.a("number").that.is.greaterThan(0);
}

const assertTokenValidityFailure = async (contract, params) => {
    const validate_tx_outcome = await validateToken(contract, params.jwts, params.valid);
    await expect(validate_tx_outcome.method).to.be.reverted;
    expect(validate_tx_outcome.is_valid).to.be.false;
    expect(validate_tx_outcome.tx).to.be.null;
}

const test_redeeming_fails_with_invalid_token = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        invalidAmount: 1
    }).then(assertStartParamsValidity);

    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    _params = {
        jwts: _jwts.invalid, 
        valid: false
    }

    await assertTokenValidityFailure(contract, _params);

    await getCampaign(contract, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(0);
    });
}

const test_valid_token_is_redeemed = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(assertCreationParamsValidity);
    
    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 1
    }).then(assertStartParamsValidity);
    
    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    _params = {
        jwts: _jwts.valid, 
        valid: true
    }

    await assertTokenValidity(contract, _params);

    await getCampaign(contract, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(1);
    });
}

module.exports = {
    assertions: {
        assertTokenValidity,
        assertTokenValidityFailure
    },
    tests: {
        test_redeeming_fails_with_invalid_token,
        test_valid_token_is_redeemed
    }
}