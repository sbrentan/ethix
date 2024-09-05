const { prepareStartParams } = require("../helpers/start-helper.js");
const { alterToken } = require("../helpers/token-helper.js");
const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const { 
    assertCampaignStart,
    assertStartParamsValidity 
} = require("../assertions/start-assertions.js");
const {
    assertTokenValidity,
    assertTokenValidityFailure
} = require("../assertions/token-assertions.js");
const { log } = require("../../common/utils.js");
const { DEFAULT_TOKEN_GOAL } = require("../../common/constants.js");

const test_token_redeem_fails_without_signature = async (contract, accounts) => {
    log();
    log(`[Test token redeem fails without signature]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true,
        decode: true 
    }).then(assertStartParamsValidity);

    const { tokens } = await assertCampaignStart(_signers, _params);
    const _altered = alterToken(tokens.valid[0], { remove_signature: true });

    await assertTokenValidityFailure(_signers.owner.contract, _altered);
}

const test_token_redeem_fails_if_goal_already_reached = async (contract, accounts) => {
    log();
    log(`[Test token redeem fails if goal already reached]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true,
        amount: DEFAULT_TOKEN_GOAL + 1
    }).then(assertStartParamsValidity);

    const { tokens } = await assertCampaignStart(_signers, _params);

    for (let i = 0; i < tokens.valid.length - 1; i++)
        await assertTokenValidity(_signers.owner.contract, tokens.valid[i]);

    await assertTokenValidityFailure(_signers.owner.contract, tokens.valid[tokens.valid.length - 1]);
}

const test_redeeming_fails_with_invalid_token = async (contract, accounts) => {
    log();
    log(`[Test redeeming fails with invalid token]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true
    }).then(assertStartParamsValidity);

    const { tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidityFailure(_signers.owner.contract, tokens.invalid);
}

const test_valid_token_is_redeemed = async (contract, accounts) => {
    log();
    log(`[Test valid token is redeemed]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true
    }).then(assertStartParamsValidity);

    const { tokens } = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(_signers.owner.contract, tokens.valid[0]);
}

module.exports = {
    test_token_redeem_fails_without_signature,
    test_token_redeem_fails_if_goal_already_reached,
    test_redeeming_fails_with_invalid_token,
    test_valid_token_is_redeemed
}