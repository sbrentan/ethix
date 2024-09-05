const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const {
    assertOrganizationVerification,
    assertOrganizationVerificationFailure,
    assertOrganizationRevocation,
    assertOrganizationRevocationFailure
} = require("../assertions/verification-assertions.js");
const { log } = require("../../common/utils.js");

const test_verification_fails_from_non_owner = async (contract, accounts) => {
    log();
    log(`[Test verification fails from non owner]`, tabs = 2, sep = '');

    const { beneficiary, other } = assertAccountsValidity(contract, accounts);

    await assertOrganizationVerificationFailure(other, beneficiary);
}

const test_verification = async (contract, accounts) => {  
    log();
    log(`[Test verification]`, tabs = 2, sep = '');

    const { owner, beneficiary } = assertAccountsValidity(contract, accounts);

    await assertOrganizationVerification(owner, beneficiary);
}

const test_revocation_fails_from_non_owner = async (contract, accounts) => {
    log();
    log(`[Test revocation fails from non owner]`, tabs = 2, sep = '');

    const { beneficiary, other } = assertAccountsValidity(contract, accounts);

    await assertOrganizationRevocationFailure(other, beneficiary);
}

const test_revocation = async (contract, accounts) => {
    log();
    log(`[Test revocation]`, tabs = 2, sep = '');

    const { owner, beneficiary } = assertAccountsValidity(contract, accounts);

    await assertOrganizationVerification(owner, beneficiary);
    await assertOrganizationRevocation(owner, beneficiary);
}

module.exports = {
    test_verification_fails_from_non_owner,
    test_verification,
    test_revocation_fails_from_non_owner,
    test_revocation
}