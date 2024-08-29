const { 
    verifyOrganization,
    revokeOrganization 
} = require("../helpers/verification-helper.js");
const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.test_verification_is_not_authorized = async (charity, other, beneficiary) => {
    log();
    log(`[Test T003]: Unauthorized verification`, tabs = 2, sep = '');

    expect(other.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const other_charity = charity.connect(other);

    const verify_tx = await verifyOrganization(other_charity, beneficiary.address);
    expect(verify_tx).to.be.null;
}

module.exports.test_verification_is_performed = async (charity, beneficiary) => {  
    log();
    log(`[Test T004]: Authorized verification`, tabs = 2, sep = '');

    expect(beneficiary.address).to.be.properAddress;

    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");
}

module.exports.test_revocation_is_not_authorized = async (charity, other, beneficiary) => {
    log();
    log(`[Test T005]: Unauthorized revocation`, tabs = 2, sep = '');

    expect(other.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const other_charity = charity.connect(other);

    const revoke_tx = await revokeOrganization(other_charity, beneficiary.address);
    expect(revoke_tx).to.be.null;
}

module.exports.test_revocation_is_performed = async (charity, beneficiary) => {
    log();
    log(`[Test T006]: Authorized revocation`, tabs = 2, sep = '');

    expect(beneficiary.address).to.be.properAddress;
    
    const revoke_tx = await revokeOrganization(charity, beneficiary.address);
    await expect(revoke_tx).to.emit(charity, "OrganizationRevoked");
}

Object.assign(global, module.exports);