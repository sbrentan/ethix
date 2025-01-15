const { 
    verifyOrganization,
    revokeOrganization 
} = require("../helpers/verification-helper.js");
const { expect } = require("chai");

const assertOrganizationVerification = async (signer, beneficiary) => {
    const verify_tx_outcome = await verifyOrganization(signer, beneficiary);
    await expect(verify_tx_outcome.tx).to.emit(verify_tx_outcome.contract, "OrganizationVerified");
    expect(verify_tx_outcome.status).to.be.true;
}

const assertOrganizationVerificationFailure = async (signer, beneficiary) => {
    const verify_tx_outcome = await verifyOrganization(signer, beneficiary);
    await expect(verify_tx_outcome.method).to.be.reverted;
    expect(verify_tx_outcome.tx).to.be.null;
}

const assertOrganizationRevocation = async (signer, beneficiary) => {
    const revoke_tx_outcome = await revokeOrganization(signer, beneficiary);
    await expect(revoke_tx_outcome.tx).to.emit(revoke_tx_outcome.contract, "OrganizationRevoked");
    expect(revoke_tx_outcome.status).to.be.false;
}

const assertOrganizationRevocationFailure = async (signer, beneficiary) => {
    const revoke_tx_outcome = await revokeOrganization(signer, beneficiary);
    await expect(revoke_tx_outcome.method).to.be.reverted;
    expect(revoke_tx_outcome.tx).to.be.null;
}

module.exports = {
    assertOrganizationVerification,
    assertOrganizationVerificationFailure,
    assertOrganizationRevocation,
    assertOrganizationRevocationFailure
}