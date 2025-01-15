const { 
    claimRefund,
    claimDonation 
} = require("../helpers/end-helper.js");
const { expect } = require("chai");

const assertRefundClaim = async (signers, params) => {
    const refund_tx_outcome = await claimRefund(signers, params);
    expect(refund_tx_outcome.tx).to.not.be.reverted;

    const details = refund_tx_outcome.details;
    expect(details).to.have.property("refunds").that.is.a("number").and.is.greaterThan(0);
    expect(details).to.have.property("refundClaimed").that.is.a("boolean").and.is.true;
}

const assertRefudClaimFailure = async (signers, params) => {
    const refund_tx_outcome = await claimRefund(signers, params);
    await expect(refund_tx_outcome.method).to.be.reverted;
    expect(refund_tx_outcome.tx).to.be.null;
}

const assertDonationClaim = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    expect(donation_tx_outcome.tx).to.not.be.reverted;

    const details = donation_tx_outcome.details;
    expect(details).to.have.property("donations").that.is.a("number").and.is.at.least(0);
    expect(details).to.have.property("donationClaimed").that.is.a("boolean").and.is.true;
}

const assertDonationClaimFailure = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
}

const assertEndParamsValidity = (params) => {
    params?.from && expect(params.from).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    params?.increaseTime !== undefined && expect(params.increaseTime).to.be.a("boolean");

    return params;
}

module.exports = {
    assertRefundClaim,
    assertRefudClaimFailure,
    assertDonationClaim,
    assertDonationClaimFailure,
    assertEndParamsValidity
}