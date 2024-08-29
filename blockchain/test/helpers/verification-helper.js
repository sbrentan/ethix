const { log } = require('../common/utils.js');

const verifyOrganization = async (contract, beneficiary) => {    
    try {
        const pre_verify = await contract.isOrganizationVerified(beneficiary);
        const verify_tx = await contract.verifyOrganization(beneficiary);
        const post_verify = await contract.isOrganizationVerified(beneficiary);

        log(`Organization ${beneficiary} => current status: [${pre_verify}]`);
        log(`Organization ${beneficiary} => status after verification: [${post_verify}]`);

        return verify_tx;

    } catch (e) {
        return null;
    }
}

const revokeOrganization = async (contract, beneficiary) => {
    try {
        const pre_revoke = await contract.isOrganizationVerified(beneficiary);
        const revoke_tx = await contract.revokeOrganization(beneficiary);
        const post_revoke = await contract.isOrganizationVerified(beneficiary);

        log(`Organization ${beneficiary} => current status: [${pre_revoke}]`);
        log(`Organization ${beneficiary} => status after revocation: [${post_revoke}]`);

        return revoke_tx;

    } catch (e) {
        return null;
    }
}

module.exports = {
    verifyOrganization,
    revokeOrganization
}