const { validateToken } = require("../helpers/charity/token-helper.js");
const { prepareCreationParams } = require("../helpers/charity/creation-helper.js");
const { prepareStartParams } = require("../helpers/charity/start-helper.js");
const {
    claimRefund,
    claimDonation
} = require("../helpers/charity/end-helper.js");
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
const { assertTokenValidity } = require("./token-validation.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

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

    delete _signers.donor;
    delete _signers.beneficiary;

    const refund_tx_outcome = await claimRefund(_signers, _campaignId);
    await expect(refund_tx_outcome.method).to.be.reverted;
    expect(refund_tx_outcome.tx).to.be.null;
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
    
    const _jwts = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(contract, { jwts: _jwts.valid, valid: true });

    delete _signers.beneficiary;
    delete _signers.other;

    const refund_tx_outcome = await claimRefund(_signers, _campaignId);
    await expect(refund_tx_outcome.tx).to.emit(refund_tx_outcome.campaign_contract, 'RefundClaimed');
    expect(refund_tx_outcome.refund_amount).to.be.a("number").that.is.at.least(0);
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

    delete _signers.donor;
    delete _signers.beneficiary;

    const donation_tx_outcome = await claimDonation(_signers, _campaignId);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
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
    
    const _jwts = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(contract, { jwts: _jwts.valid, valid: true });

    delete _signers.donor;
    delete _signers.other;

    const donation_tx_outcome = await claimDonation(_signers, _campaignId);
    await expect(donation_tx_outcome.tx).to.emit(donation_tx_outcome.campaign_contract, 'DonationClaimed');
    expect(donation_tx_outcome.donation_amount).to.be.a("number").that.is.at.least(0);
}

module.exports = {
    tests: {
        test_refund_claim_fails_if_not_from_donor,
        test_refund_is_claimed,
        test_donation_claim_fails_if_not_from_beneficiary,
        test_donation_is_claimed
    }
}