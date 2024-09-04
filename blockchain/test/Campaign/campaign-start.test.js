const { 
    prepareStartParams,
    startCampaign 
} = require("../helpers/start-helper.js");
const { assertAccountsValidity } = require("./campaign-deployment.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertCampaignStart = async (signers, params) => {
    signers.donor = signers.owner;
    const start_tx_outcome = await startCampaign(signers, params);
    await expect(start_tx_outcome.tx).to.emit(start_tx_outcome.contract, "CampaignStarted");
    expect(start_tx_outcome.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    return start_tx_outcome.tokens;
}

const assertCampaignStartFailure = async (signers, params) => {
    const start_tx_outcome = await startCampaign(signers, params);
    await expect(start_tx_outcome.method).to.be.reverted;
    expect(start_tx_outcome.tx).to.be.null;
}

const test_request_fails_if_is_not_from_owner = async (contract, accounts) => {
    log();
    log(`[Test request fails if is not from owner]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ from: _signers.donor });

    await assertCampaignStartFailure(_signers, _params);
}

const test_start_fails_if_is_not_from_donor = async (contract, accounts) => {
    log();
    log(`[Test campaign start fails if is not from donor]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ from: _signers.other });

    _signers.donor = _signers.owner;
    await assertCampaignStartFailure(_signers, _params);
}

const test_campaign_start = async (contract, accounts) => {
    log();
    log(`[Test campaign start]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ from: _signers.donor });

    await assertCampaignStart(_signers, _params);
}

const test_start_fails_if_is_already_started = async (contract, accounts) => {
    log();
    log(`[Test campaign start fails if is already started/funded]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ from: _signers.donor });

    await assertCampaignStart(_signers, _params);
    await assertCampaignStartFailure(_signers, _params);
}   

module.exports = {
    assertions: {
        assertCampaignStart,
        assertCampaignStartFailure
    },
    tests: {
        test_request_fails_if_is_not_from_owner,
        test_start_fails_if_is_not_from_donor,
        test_campaign_start,
        test_start_fails_if_is_already_started
    }
}