const { prepareCreationParams } = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const { prepareEndParams } = require("../helpers/end-helper.js");
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
const { assertTokenValidity } = require("../assertions/token-assertions.js");
const {
    assertRefundClaim,
    assertRefudClaimFailure,
    assertDonationClaim,
    assertDonationClaimFailure,
    assertEndParamsValidity
} = require("../assertions/end-assertions.js");
const { log } = require("../../common/utils.js");

const test_refund_claim_fails_if_not_from_donor = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test refund claim is not authorized => revert]`, tabs = 2, sep = '');
    
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
    
    await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: _campaignId
    }).then(assertEndParamsValidity);

    _signers.donor = _signers.other;
    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_is_claimed = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test refund claim is performed]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 3
    }).then(assertStartParamsValidity);
    
    const { tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(contract, tokens.valid[0]);

    _params = await prepareEndParams({
        campaignId: _campaignId
    }).then(assertEndParamsValidity);

    await assertRefundClaim(_signers, _params);
}

const test_donation_claim_fails_if_not_from_beneficiary = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test donation claim is not authorized => revert]`, tabs = 2, sep = '');
    
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
    
    await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: _campaignId
    }).then(assertEndParamsValidity);

    _signers.beneficiary = _signers.other;
    await assertDonationClaimFailure(_signers, _params);
}

const test_donation_is_claimed = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test donation claim is performed]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 3
    }).then(assertStartParamsValidity);
    
    const { tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(contract, tokens.valid[0]);

    _params = await prepareEndParams({
        campaignId: _campaignId
    }).then(assertEndParamsValidity);

    await assertDonationClaim(_signers, _params);
}

module.exports = {
    test_refund_claim_fails_if_not_from_donor,
    test_refund_is_claimed,
    test_donation_claim_fails_if_not_from_beneficiary,
    test_donation_is_claimed
}