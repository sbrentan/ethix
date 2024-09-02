const { log } = require('../../common/utils.js');

const verifyOrganization = async (contract, beneficiary) => {   
    const verifyBeneficiary = () => contract.verifyOrganization(beneficiary);
    try {
        const pre_verify = await contract.isOrganizationVerified(beneficiary);
        const verify_tx = await verifyBeneficiary();
        const post_verify = await contract.isOrganizationVerified(beneficiary);

        log();
        log(`Verification process:`, tabs = 3, sep = '');
        log(`Organization ${beneficiary} => current status: [${pre_verify}]`);
        log(`Organization ${beneficiary} => status after verification: [${post_verify}]`);

        return { tx: verify_tx, status: post_verify };

    } catch (e) { 
        return { 
            tx: null, 
            get method() { return (verifyBeneficiary)() }
        }
    }
}

const revokeOrganization = async (contract, beneficiary) => {
    const revokeBeneficiary = () => contract.revokeOrganization(beneficiary);
    try {
        const pre_revoke = await contract.isOrganizationVerified(beneficiary);
        const revoke_tx = await revokeBeneficiary();
        const post_revoke = await contract.isOrganizationVerified(beneficiary);

        log();
        log(`Revocation process:`, tabs = 3, sep = '');
        log(`Organization ${beneficiary} => current status: [${pre_revoke}]`);
        log(`Organization ${beneficiary} => status after revocation: [${post_revoke}]`);

        return { tx: revoke_tx, status: post_revoke };

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (revokeBeneficiary)() }
        }
    }
}

module.exports = {
    verifyOrganization,
    revokeOrganization
}