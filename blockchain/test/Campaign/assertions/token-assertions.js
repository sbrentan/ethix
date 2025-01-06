const { validateToken } = require("../helpers/token-helper.js");
const { expect } = require("chai");

const assertTokenValidity = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    expect(validate_tx_outcome.tx).to.not.be.reverted;
    expect(validate_tx_outcome.is_redeemable).to.be.a("boolean").that.is.true;

    expect(validate_tx_outcome.prev_tokens_count).to.be.a("number").that.is.greaterThanOrEqual(0);
    expect(validate_tx_outcome.post_tokens_count).to.be.an("number").that.is.greaterThan(validate_tx_outcome.prev_tokens_count);
}

const assertTokenValidityFailure = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    await expect(validate_tx_outcome.method).to.be.reverted;
    expect(validate_tx_outcome.is_redeemable).to.be.false;
    expect(validate_tx_outcome.tx).to.be.null;
}

const assertTokenCountToBe = (count, expected) => {
    expect(count).to.equal(expected);
}

module.exports = {
    assertTokenValidity,
    assertTokenValidityFailure,
    assertTokenCountToBe
}