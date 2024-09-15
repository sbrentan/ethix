const { 
    claimRefund,
    claimDonation 
} = require("../helpers/end-helper.js");
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

const assertDonationClaim = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.tx).to.emit(donation_tx_outcome.contract, "DonationClaimed");
    expect(donation_tx_outcome.donation_amount).to.be.a("number").that.is.at.least(0);
}

const assertDonationClaimFailure = async (signers, params) => {
    const donation_tx_outcome = await claimDonation(signers, params);
    await expect(donation_tx_outcome.method).to.be.reverted;
    expect(donation_tx_outcome.tx).to.be.null;
}

const assertEndParamsValidity = (params) => {
    params?.campaignId && expect(params.campaignId).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.increaseTime !== undefined && expect(params.increaseTime).to.be.a("boolean");
    params?.from && expect(params.from).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);

    return params;
}

module.exports = {
    assertRefundClaim,
    assertRefudClaimFailure,
    assertDonationClaim,
    assertDonationClaimFailure,
    assertEndParamsValidity
}