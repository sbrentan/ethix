const { prepareStartParams } = require("../helpers/start-helper.js");
const { 
    alterToken,
    validateToken 
} = require("../helpers/token-helper.js");
const { assertAccountsValidity } = require("./contract-deployment.test.js").assertions;
const { assertCampaignStart } = require("./campaign-start.test.js").assertions;
const { log } = require("../../common/utils.js");
const { DEFAULT_TOKEN_GOAL } = require("../../common/constants.js");
const { expect } = require("chai");

const assertTokenValidity = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    await expect(validate_tx_outcome.tx).to.emit(contract, "TokensRedeemed");
    expect(validate_tx_outcome.is_redeemable).to.be.true;
    expect(validate_tx_outcome.redemeed_tokens).to.be.a("number").that.is.greaterThan(0);
}

const assertTokenValidityFailure = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    await expect(validate_tx_outcome.method).to.be.reverted;
    expect(validate_tx_outcome.is_redeemable).to.be.false;
    expect(validate_tx_outcome.tx).to.be.null;
}

const test_token_redeem_fails_without_signature = async (contract, accounts) => {
    log();
    log(`[Test token redeem fails without signature]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true,
        decode: true 
    });

    const _tokens = await assertCampaignStart(_signers, _params);
    const _altered = alterToken(_tokens.valid[0], { remove_signature: true });

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
    });

    const _tokens = await assertCampaignStart(_signers, _params);

    for (let i = 0; i < _tokens.valid.length - 1; i++)
        await assertTokenValidity(_signers.owner.contract, _tokens.valid[i]);

    await assertTokenValidityFailure(_signers.owner.contract, _tokens.valid[_tokens.valid.length - 1]);
}

const test_redeeming_fails_with_invalid_token = async (contract, accounts) => {
    log();
    log(`[Test redeeming fails with invalid token]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true
    });

    const _tokens = await assertCampaignStart(_signers, _params);

    await assertTokenValidityFailure(_signers.owner.contract, _tokens.invalid);
}

const test_valid_token_is_redeemed = async (contract, accounts) => {
    log();
    log(`[Test valid token is redeemed]`, tabs = 2, sep = '');

    const _signers = assertAccountsValidity(contract, accounts);

    const _params = await prepareStartParams({ 
        from: _signers.donor,
        generateTokens: true
    });

    const _tokens = await assertCampaignStart(_signers, _params);

    await assertTokenValidity(_signers.owner.contract, _tokens.valid[0]);
}

module.exports = {
    assertions: {
        assertTokenValidity,
        assertTokenValidityFailure
    },
    tests: {
        test_token_redeem_fails_without_signature,
        test_token_redeem_fails_if_goal_already_reached,
        test_redeeming_fails_with_invalid_token,
        test_valid_token_is_redeemed
    }
}