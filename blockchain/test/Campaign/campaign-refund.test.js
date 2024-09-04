const { prepareStartParams } = require("../helpers/start-helper.js");
const { 
    prepareEndParams,
    claimRefund 
} = require("../helpers/end-helper.js");
const { assertAccountsValidity } = require("./campaign-deployment.test.js").assertions;
const { assertCampaignStart } = require("./campaign-start.test.js").assertions;
const { assertTokenValidity } = require("./campaign-redeeming.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertRefundClaim = async (signers, params) => {
    const refund_tx_outcome = await claimRefund(signers, params);
    await expect(refund_tx_outcome.tx).to.emit(refund_tx_outcome.contract, "RefundClaimed");
    expect(refund_tx_outcome.refund_amount).to.be.a("number").that.is.at.least(0);
}

const assertRefudClaimFailure = async (signers, params) => {
    const refund_tx_outcome = await claimRefund(signers, params);
    await expect(refund_tx_outcome.method).to.be.reverted;
    expect(refund_tx_outcome.tx).to.be.null;
}

const test_refund_claim_request_fails_if_is_not_from_owner = async (contract, accounts) => {
    log();
    log("[Test refund claim request fails if is not from owner]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor
    });

    _signers.owner = _signers.other;
    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_is_not_from_donor = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if is not from donor]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.other
    });

    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_campaign_is_not_ended = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if campaign is not ended]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor,
        increaseTime: false
    });

    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_is_already_claimed = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if is already claimed]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ from: _signers.donor });

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor
    });
    
    await assertRefundClaim(_signers, _params);

    _params.increaseTime = false;
    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_campaign_is_not_funded = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if campaign is not funded]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _campaignId = (await contract.getDetails())[0];

    _params = await prepareEndParams({
        campaignId: _campaignId,
        from: _signers.donor
    });

    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_succeeds = async (contract, accounts) => {
    log();
    log("[Test refund claim succeeds]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true 
    });

    const { campaignId, tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(_signers.owner.contract, tokens.valid[0]);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor
    });
    
    await assertRefundClaim(_signers, _params);
}

module.exports = {
    assertions: {
        assertRefundClaim,
        assertRefudClaimFailure
    },
    tests: {
        test_refund_claim_request_fails_if_is_not_from_owner,
        test_refund_claim_fails_if_is_not_from_donor,
        test_refund_claim_fails_if_campaign_is_not_ended,
        test_refund_claim_fails_if_is_already_claimed,
        test_refund_claim_fails_if_campaign_is_not_funded,
        test_refund_claim_succeeds
    }
}