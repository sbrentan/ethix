const { validateToken } = require("../helpers/token-helper.js");
const { prepareCreationParams } = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const {
    claimRefund,
    claimDonation
} = require("../helpers/end-helper.js");
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

module.exports.test_refund_claim_is_not_authorized = async (charity, donor, beneficiary, other) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;
    expect(other.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);
    const other_charity = charity.connect(other);

    log();
    log(`[Test T018]: Refund claim is not authorized => revert`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor_charity, _params, owner_contract = charity);

    const refund_tx_outcome = await claimRefund(other_charity, _campaignId);
    await expect(refund_tx_outcome.method).to.be.reverted;
    expect(refund_tx_outcome.tx).to.be.null;
}

module.exports.test_refund_is_claimed = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T019]: Refund claim is performed`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 3
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor_charity, _params, owner_contract = charity);

    _retVal = await validateToken(charity, _campaignId, _jwts.valid);
    expect(_retVal).to.be.true;

    const refund_tx_outcome = await claimRefund(donor_charity, _campaignId);
    await expect(refund_tx_outcome.tx).to.emit(donor_charity, 'RefundClaimed');
    expect(refund_tx_outcome.refund_amount).to.be.a("number").that.is.at.least(0);
}

module.exports.test_donation_claim_is_not_authorized = async (charity, donor, beneficiary, other) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;
    expect(other.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);
    const other_charity = charity.connect(other);

    log();
    log(`[Test T020]: Donation claim is not authorized => revert`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor_charity, _params, owner_contract = charity);

    const donation_tx_outcome = await claimDonation(other_charity, _campaignId);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
}

module.exports.test_donation_is_claimed = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);
    const beneficiary_charity = charity.connect(beneficiary);

    log();
    log(`[Test T021]: Donation claim is performed`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(charity, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(verifyCreationParams);

    const _campaignId = await assertCampaignCreation(donor_charity, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        generateTokens: true,
        validAmount: 3
    }).then(verifyStartParams);
    
    const _jwts = await assertCampaignStart(donor_charity, _params, owner_contract = charity);

    _retVal = await validateToken(charity, _campaignId, _jwts.valid);
    expect(_retVal).to.be.true;

    const donation_tx_outcome = await claimDonation(beneficiary_charity, _campaignId);
    await expect(donation_tx_outcome.tx).to.emit(beneficiary_charity, 'DonationClaimed');
    expect(donation_tx_outcome.donation_amount).to.be.a("number").that.is.at.least(0);
}

Object.assign(global, module.exports);