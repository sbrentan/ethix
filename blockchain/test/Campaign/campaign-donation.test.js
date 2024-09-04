const { prepareStartParams } = require("../helpers/start-helper.js");
const { 
    prepareEndParams,
    claimDonation 
} = require("../helpers/end-helper.js");
const { assertAccountsValidity } = require("./campaign-deployment.test.js").assertions;
const { assertCampaignStart } = require("./campaign-start.test.js").assertions;
const { assertTokenValidity } = require("./campaign-redeeming.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertDonationClaim = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.tx).to.emit(donation_tx_outcome.contract, "DonationClaimed");
    expect(donation_tx_outcome.donation_amount).to.be.a("number").that.is.at.least(0);
}

const assertDonationClaimFailure = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
}

const test_donation_claim_request_fails_if_is_not_from_owner = async (contract, accounts) => {
    log();
    log("[Test donation claim request fails if is not from owner]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.beneficiary
    });

    _signers.owner = _signers.other;
    await assertDonationClaimFailure(_signers, _params);
}

const test_donation_claim_fails_if_is_not_from_beneficiary = async (contract, accounts) => {
    log();
    log("[Test donation claim fails if is not from donor]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.other
    });

    await assertDonationClaimFailure(_signers, _params);
}

const test_donation_claim_fails_if_campaign_is_not_ended = async (contract, accounts) => {
    log();
    log("[Test donation claim fails if campaign is not ended]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.beneficiary,
        increaseTime: false
    });

    await assertDonationClaimFailure(_signers, _params);
}

const test_donation_claim_fails_if_is_already_claimed = async (contract, accounts) => {
    log();
    log("[Test donation claim fails if is already claimed]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.beneficiary
    });
    
    await assertDonationClaim(_signers, _params);

    _params.increaseTime = false;
    await assertDonationClaimFailure(_signers, _params);
}

const test_donation_claim_fails_if_campaign_is_not_funded = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if campaign is not funded]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _campaignId = (await contract.getDetails())[0];

    _params = await prepareEndParams({
        campaignId: _campaignId,
        from: _signers.beneficiary
    });

    await assertDonationClaimFailure(_signers, _params);
}

const test_donation_claim_succeeds = async (contract, accounts) => {
    log();
    log("[Test donation claim succeeds]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true 
    });

    const { campaignId, tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(_signers.owner.contract, tokens.valid[0]);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.beneficiary
    });
    
    await assertDonationClaim(_signers, _params);
}

module.exports = {
    assertions: {
        assertDonationClaim,
        assertDonationClaimFailure
    },
    tests: {
        test_donation_claim_request_fails_if_is_not_from_owner,
        test_donation_claim_fails_if_is_not_from_beneficiary,
        test_donation_claim_fails_if_campaign_is_not_ended,
        test_donation_claim_fails_if_is_already_claimed,
        test_donation_claim_fails_if_campaign_is_not_funded,
        test_donation_claim_succeeds
    }
}