const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.test_verification_is_authorized = async (charity, other, beneficiary) => {
    log();
    log(`[Test 1]: Unauthorized verification`, tabs = 2, sep = '');

    expect(other.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    let other_charity = charity.connect(other);

    let _is_verified = await other_charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => current status: [${_is_verified}]`);
    expect(_is_verified).to.be.false;

    await expect(other_charity.verifyOrganization(beneficiary.address)).to.be.reverted;

    _is_verified = await other_charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => status after verification: [${_is_verified}]`);
    expect(_is_verified).to.be.false;
}

module.exports.test_verification_is_performed = async (charity, beneficiary, separator = '') => {
    log();
    log(`[Test 2]: Authorized verification`, tabs = (separator ? 3 : 2), sep = separator);

    expect(beneficiary.address).to.be.properAddress;

    let _is_verified = await charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => current status: [${_is_verified}]`);
    expect(_is_verified).to.be.false;

    const verify_tx = await charity.verifyOrganization(beneficiary.address);
    const verify_receipt = await verify_tx.wait();
    const verify_event = verify_receipt?.logs[0]?.fragment?.name;

    expect(verify_event).to.equal("OrganizationVerified");

    _is_verified = await charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => status after verification: [${_is_verified}]`);
    expect(_is_verified).to.be.true;

    if (separator) log();
}

module.exports.test_revocation_is_authorized = async (charity, other, beneficiary) => {
    log();
    log(`[Test 3]: Unauthorized revocation`, tabs = 2, sep = '');

    expect(other.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    await this.test_verification_is_performed(charity, beneficiary, separator = '-');

    let other_charity = charity.connect(other);

    let _is_verified = await other_charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => current status: [${_is_verified}]`);
    expect(_is_verified).to.be.true;

    await expect(other_charity.revokeOrganization(beneficiary.address)).to.be.reverted;

    _is_verified = await other_charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => status after revocation: [${_is_verified}]`);
    expect(_is_verified).to.be.true;
}

module.exports.test_revocation_is_performed = async (charity, beneficiary) => {
    log();
    log(`[Test 4]: Authorized revocation`, tabs = 2, sep = '');

    expect(beneficiary.address).to.be.properAddress;

    await this.test_verification_is_performed(charity, beneficiary, separator = '-');

    let _is_verified = await charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => current status: [${_is_verified}]`);
    expect(_is_verified).to.be.true;

    const revoke_tx = await charity.revokeOrganization(beneficiary.address);
    const revoke_receipt = await revoke_tx.wait();
    const revoke_event = revoke_receipt?.logs[0]?.fragment?.name;

    expect(revoke_event).to.equal("OrganizationRevoked");

    _is_verified = await charity.isOrganizationVerified(beneficiary.address);
    log(`Organization ${beneficiary.address} => status after revocation: [${_is_verified}]`);
    expect(_is_verified).to.be.false;
}

Object.assign(global, module.exports);