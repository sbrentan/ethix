const { prepareCreationParams } = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const {
    prepareEndParams,
    claimRefund,
    claimDonation
} = require("../helpers/end-helper.js");
const { assertAccountsValidity } = require("./charity-deployment.test.js").assertions;
const { assertOrganizationVerification } = require("./charity-verification.test.js").assertions;
const { 
    assertCampaignCreation, 
    assertCreationParamsValidity
} = require("./charity-creation.test.js").assertions;
const { 
    assertCampaignStart, 
    assertStartParamsValidity
} = require("./charity-start.test.js").assertions;
const { assertTokenValidity } = require("./charity-redeeming.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertRefundClaim = async (signers, params) => {
    const refund_tx_outcome = await claimRefund(signers, params);
    await expect(refund_tx_outcome.tx).to.emit(refund_tx_outcome.campaign_contract, "RefundClaimed");
    expect(refund_tx_outcome.refund_amount).to.be.a("number").that.is.at.least(0);
}

const assertRefudClaimFailure = async (signers, params) => {
    const refund_tx_outcome = await claimRefund(signers, params);
    await expect(refund_tx_outcome.method).to.be.reverted;
    expect(refund_tx_outcome.tx).to.be.null;
}

const assertDonationClaim = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.tx).to.emit(donation_tx_outcome.campaign_contract, "DonationClaimed");
    expect(donation_tx_outcome.donation_amount).to.be.a("number").that.is.at.least(0);
}

const assertDonationClaimFailure = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
}

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
    });

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
    });

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
    });

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
    });

    await assertDonationClaim(_signers, _params);
}

module.exports = {
    assertions: {
        assertRefundClaim,
        assertRefudClaimFailure,
        assertDonationClaim,
        assertDonationClaimFailure
    },
    tests: {
        test_refund_claim_fails_if_not_from_donor,
        test_refund_is_claimed,
        test_donation_claim_fails_if_not_from_beneficiary,
        test_donation_is_claimed
    }
}