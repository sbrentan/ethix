const { validateToken } = require("../helpers/charity/token-helper.js");
const { prepareCreationParams } = require("../helpers/charity/creation-helper.js");
const { prepareStartParams } = require("../helpers/charity/start-helper.js");
const {
    claimRefund,
    claimDonation
} = require("../helpers/charity/end-helper.js");
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

module.exports.test_refund_claim_fails_if_not_from_donor = async (contract, accounts) => {
    
    const { donor, beneficiary, other } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test refund claim is not authorized => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    const refund_tx_outcome = await claimRefund(other.contract, _campaignId);
    await expect(refund_tx_outcome.method).to.be.reverted;
    expect(refund_tx_outcome.tx).to.be.null;
}

module.exports.test_refund_is_claimed = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test refund claim is performed]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 3
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    const isTokenValid = await validateToken(contract, _campaignId, _jwts.valid);
    expect(isTokenValid).to.be.true;

    const refund_tx_outcome = await claimRefund(donor.contract, _campaignId);
    await expect(refund_tx_outcome.tx).to.emit(donor.contract, 'RefundClaimed');
    expect(refund_tx_outcome.refund_amount).to.be.a("number").that.is.at.least(0);
}

module.exports.test_donation_claim_fials_if_not_from_beneficiary = async (contract, accounts) => {
    
    const { donor, beneficiary, other } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test donation claim is not authorized => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    const donation_tx_outcome = await claimDonation(other.contract, _campaignId);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
}

module.exports.test_donation_is_claimed = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test donation claim is performed]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 3
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor.contract, _params, contract);

    const isTokenValid = await validateToken(contract, _campaignId, _jwts.valid);
    expect(isTokenValid).to.be.true;

    const donation_tx_outcome = await claimDonation(beneficiary.contract, _campaignId);
    await expect(donation_tx_outcome.tx).to.emit(beneficiary.contract, 'DonationClaimed');
    expect(donation_tx_outcome.donation_amount).to.be.a("number").that.is.at.least(0);
}

Object.assign(global, module.exports);