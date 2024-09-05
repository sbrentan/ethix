const { prepareStartParams } = require("../helpers/start-helper.js");
const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const { 
    assertCampaignStart, 
    assertCampaignStartFailure,
    assertStartParamsValidity 
} = require("../assertions/start-assertions.js");
const { log } = require("../../common/utils.js");

const test_start_request_fails_if_is_not_from_owner = async (contract, accounts) => {
    log();
    log(`[Test start request fails if is not from owner]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ from: _signers.donor });

    _signers.owner = _signers.other;
    await assertCampaignStartFailure(_signers, _params);
}

const test_start_fails_if_is_not_from_donor = async (contract, accounts) => {
    log();
    log(`[Test campaign start fails if is not from donor]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.other 
    }).then(assertStartParamsValidity);

    await assertCampaignStartFailure(_signers, _params);
}

const test_campaign_start = async (contract, accounts) => {
    log();
    log(`[Test campaign start]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor 
    }).then(assertStartParamsValidity);

    await assertCampaignStart(_signers, _params);
}

const test_start_fails_if_is_already_started = async (contract, accounts) => {
    log();
    log(`[Test campaign start fails if is already started/funded]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    let _params = await prepareStartParams({ 
        from: _signers.donor
    }).then(assertStartParamsValidity);

    await assertCampaignStart(_signers, _params);
    await assertCampaignStartFailure(_signers, _params);
}   

module.exports = {
    test_start_request_fails_if_is_not_from_owner,
    test_start_fails_if_is_not_from_donor,
    test_campaign_start,
    test_start_fails_if_is_already_started
}