const {
    prepareCreationParams,
    getCampaign
} = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const { assertOrganizationVerification } = require("../assertions/verification-assertions.js");
const { 
    assertCampaignCreation, 
    assertCreationParamsValidity
} = require("../assertions/creation-assertions.js");
const { 
    assertCampaignStart, 
    assertStartParamsValidity
} = require("../assertions/start-assertions.js");
const {
    assertTokenValidity,
    assertTokenValidityFailure,
    assertTokenCountToBe
} = require("../assertions/token-assertions.js");
const { log } = require("../../common/utils.js");

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

    const { tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidityFailure(contract, tokens.invalid);

    await getCampaign(contract, _campaignId)
    .then(data => {
        assertTokenCountToBe(data.redeemedTokenCount, 0);
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
    
    const { tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(contract, tokens.valid[0]);

    await getCampaign(contract, _campaignId)
    .then(data => {
        assertTokenCountToBe(data.redeemedTokenCount, 1);
    });
}

module.exports = {
    test_redeeming_fails_with_invalid_token,
    test_valid_token_is_redeemed
}