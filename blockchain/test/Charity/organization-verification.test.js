const { assertAccountsValidity } = require("./contract-deployment.test.js").assertions;
const { 
    verifyOrganization,
    revokeOrganization 
} = require("../helpers/charity/verification-helper.js");
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertOrganizationVerification = async (contract, beneficiary) => {
    const verify_tx_outcome = await verifyOrganization(contract, beneficiary.address);
    await expect(verify_tx_outcome.tx).to.emit(contract, "OrganizationVerified");
    expect(verify_tx_outcome.status).to.be.true;
}

const assertOrganizationRevocation = async (contract, beneficiary) => {
    const revoke_tx_outcome = await revokeOrganization(contract, beneficiary.address);
    await expect(revoke_tx_outcome.tx).to.emit(contract, "OrganizationRevoked");
    expect(revoke_tx_outcome.status).to.be.false;
}

const test_verification_fails_from_non_owner = async (contract, accounts) => {
    log();
    log(`[Test verification fails from non owner]`, tabs = 2, sep = '');

    const { beneficiary, other } = assertAccountsValidity(contract, accounts);

    const verify_tx_outcome = await verifyOrganization(other.contract, beneficiary.address);
    await expect(verify_tx_outcome.method).to.be.reverted;
    expect(verify_tx_outcome.tx).to.be.null;
}

const test_verification = async (contract, accounts) => {  
    log();
    log(`[Test verification]`, tabs = 2, sep = '');

    const { beneficiary } = assertAccountsValidity(contract, accounts);

    await assertOrganizationVerification(contract, beneficiary);
}

const test_revocation_fails_from_non_owner = async (contract, accounts) => {
    log();
    log(`[Test revocation fails from non owner]`, tabs = 2, sep = '');

    const { beneficiary, other } = assertAccountsValidity(contract, accounts);

    const revoke_tx_outcome = await revokeOrganization(other.contract, beneficiary.address);
    await expect(revoke_tx_outcome.method).to.be.reverted;
    expect(revoke_tx_outcome.tx).to.be.null;
}

const test_revocation = async (contract, accounts) => {
    log();
    log(`[Test revocation]`, tabs = 2, sep = '');

    const { beneficiary } = assertAccountsValidity(contract, accounts);

    await assertOrganizationVerification(contract, beneficiary);
    await assertOrganizationRevocation(contract, beneficiary);
}

module.exports = {
    assertions: {
        assertOrganizationVerification,
        assertOrganizationRevocation
    },
    tests: {
        test_verification_fails_from_non_owner,
        test_verification,
        test_revocation_fails_from_non_owner,
        test_revocation
    }
}