const { validateToken } = require("../helpers/token-helper.js");
const {
    prepareCreationParams,
    getCampaign
} = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
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

const assertTokenValidity = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    await expect(validate_tx_outcome.tx).to.emit(validate_tx_outcome.campaign_contract, "TokensRedeemed");
    expect(validate_tx_outcome.is_redeemable).to.be.true;
    expect(validate_tx_outcome.redemeed_tokens).to.be.a("number").that.is.greaterThan(0);
}

const assertTokenValidityFailure = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    await expect(validate_tx_outcome.method).to.be.reverted;
    expect(validate_tx_outcome.is_redeemable).to.be.false;
    expect(validate_tx_outcome.tx).to.be.null;
}

const test_redeeming_fails_with_invalid_token = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true
    }).then(assertStartParamsValidity);

    const _tokens = await assertCampaignStart(_signers, _params);

    await assertTokenValidityFailure(contract, _tokens.invalid);

    await getCampaign(contract, _campaignId)
    .then(data => {
        expect(data.redeemedTokenCount).to.equal(0);
    });
}

const test_valid_token_is_redeemed = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);
    
    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true
    }).then(assertStartParamsValidity);
    
    const _tokens = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(contract, _tokens.valid[0]);

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