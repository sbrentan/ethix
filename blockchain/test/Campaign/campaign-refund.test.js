const { prepareStartParams } = require("../helpers/start-helper.js");
const { prepareEndParams } = require("../helpers/end-helper.js");
const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const { 
    assertCampaignStart,
    assertStartParamsValidity
} = require("../assertions/start-assertions.js");
const { assertTokenValidity } = require("../assertions/token-assertions.js");
const {
    assertRefundClaim,
    assertRefudClaimFailure,
    assertEndParamsValidity
} = require("../assertions/end-assertions.js");
const { log } = require("../../common/utils.js");

const test_refund_claim_request_fails_if_is_not_from_owner = async (contract, accounts) => {
    log();
    log("[Test refund claim request fails if is not from owner]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor 
    }).then(assertStartParamsValidity);

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor
    }).then(assertEndParamsValidity);

    _signers.owner = _signers.other;
    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_is_not_from_donor = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if is not from donor]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor 
    }).then(assertStartParamsValidity);

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.other
    }).then(assertEndParamsValidity);

    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_campaign_is_not_ended = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if campaign is not ended]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor 
    }).then(assertStartParamsValidity);

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor,
        increaseTime: false
    }).then(assertEndParamsValidity);

    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_fails_if_is_already_claimed = async (contract, accounts) => {
    log();
    log("[Test refund claim fails if is already claimed]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor 
    }).then(assertStartParamsValidity);

    const { campaignId } = await assertCampaignStart(_signers, _params);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor
    }).then(assertEndParamsValidity);
    
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
    }).then(assertEndParamsValidity);

    await assertRefudClaimFailure(_signers, _params);
}

const test_refund_claim_succeeds = async (contract, accounts) => {
    log();
    log("[Test refund claim succeeds]", 1);

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true 
    }).then(assertStartParamsValidity);

    const { campaignId, tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(_signers.owner.contract, tokens.valid[0]);

    _params = await prepareEndParams({
        campaignId: campaignId,
        from: _signers.donor
    }).then(assertEndParamsValidity);
    
    await assertRefundClaim(_signers, _params);
}

module.exports = {
    test_refund_claim_request_fails_if_is_not_from_owner,
    test_refund_claim_fails_if_is_not_from_donor,
    test_refund_claim_fails_if_campaign_is_not_ended,
    test_refund_claim_fails_if_is_already_claimed,
    test_refund_claim_fails_if_campaign_is_not_funded,
    test_refund_claim_succeeds
}