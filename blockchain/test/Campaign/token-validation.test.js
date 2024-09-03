const { prepareStartParams } = require("../helpers/start-helper.js");
const { assertAccountsValidity } = require("./contract-deployment.test.js").assertions;
const { assertCampaignStart } = require("./campaign-start.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const test_token_redeem_fails_without_signature = async (contract, accounts) => {
    log();
    log(`[Test token redeem fails without signature]`, tabs = 2, sep = '');

    const { donor } = assertAccountsValidity(contract, accounts);

    const start_params = await prepareStartParams({ 
        from: donor,
        generateTokens: true 
    });

    await assertCampaignStart(contract, start_params);
}

const test_token_redeem_fails_if_goal_already_reached = async (contract, accounts) => {

}

const test_redeeming_fails_with_invalid_token = async (contract, accounts) => {

}

const test_valid_token_is_redeemed = async (contract, accounts) => {

}

module.exports = {
    assertions: {
    },
    tests: {
        test_token_redeem_fails_without_signature,
        test_token_redeem_fails_if_goal_already_reached,
        test_redeeming_fails_with_invalid_token,
        test_valid_token_is_redeemed
    }
}