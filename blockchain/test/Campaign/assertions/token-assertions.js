const { validateToken } = require("../helpers/token-helper.js");
const { expect } = require("chai");

const assertTokenValidity = async (contract, token) => {
    const validate_tx_outcome = await validateToken(contract, token);
    await expect(validate_tx_outcome.tx).to.emit(validate_tx_outcome.contract, "TokensRedeemed");
    expect(validate_tx_outcome.is_redeemable).to.be.true;
    expect(validate_tx_outcome.redemeed_tokens).to.be.a("number").that.is.greaterThan(0);
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