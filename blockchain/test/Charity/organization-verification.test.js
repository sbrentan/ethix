const { 
    verifyOrganization,
    revokeOrganization 
} = require("../helpers/verification-helper.js");
const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.assertOrganizationVerification = async (charity, beneficiary) => {
    const verify_tx_outcome = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx_outcome.tx).to.emit(charity, "OrganizationVerified");
    expect(verify_tx_outcome.status).to.be.true;
}

module.exports.assertOrganizationRevocation = async (charity, beneficiary) => {
    const revoke_tx_outcome = await revokeOrganization(charity, beneficiary.address);
    await expect(revoke_tx_outcome.tx).to.emit(charity, "OrganizationRevoked");
    expect(revoke_tx_outcome.status).to.be.false;
}

module.exports.test_verification_is_not_authorized = async (charity, other, beneficiary) => {
    log();
    log(`[Test T003]: Unauthorized verification`, tabs = 2, sep = '');

    expect(other.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const other_charity = charity.connect(other);

    const verify_tx_outcome = await verifyOrganization(other_charity, beneficiary.address);
    await expect(verify_tx_outcome.method).to.be.reverted;
    expect(verify_tx_outcome.tx).to.be.null;
}

module.exports.test_verification_is_performed = async (charity, beneficiary) => {  
    log();
    log(`[Test T004]: Authorized verification`, tabs = 2, sep = '');

    expect(beneficiary.address).to.be.properAddress;

    await this.assertOrganizationVerification(charity, beneficiary);
}

module.exports.test_revocation_is_not_authorized = async (charity, other, beneficiary) => {
    log();
    log(`[Test T005]: Unauthorized revocation`, tabs = 2, sep = '');

    expect(other.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const other_charity = charity.connect(other);

    const revoke_tx_outcome = await revokeOrganization(other_charity, beneficiary.address);
    await expect(revoke_tx_outcome.method).to.be.reverted;
    expect(revoke_tx_outcome.tx).to.be.null;
}

module.exports.test_revocation_is_performed = async (charity, beneficiary) => {
    log();
    log(`[Test T006]: Authorized revocation`, tabs = 2, sep = '');

    expect(beneficiary.address).to.be.properAddress;

    await this.assertOrganizationVerification(charity, beneficiary);
    await this.assertOrganizationRevocation(charity, beneficiary);
}

Object.assign(global, {
    test_verification_is_not_authorized: module.exports.test_verification_is_not_authorized,
    test_verification_is_performed: module.exports.test_verification_is_performed,
    test_revocation_is_not_authorized: module.exports.test_revocation_is_not_authorized,
    test_revocation_is_performed: module.exports.test_revocation_is_performed
});