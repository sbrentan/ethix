const { log } = require('../../../common/utils.js');

const verifyOrganization = async (signer, beneficiary) => {  
    const verifyBeneficiary = () => signer.contract.verifyOrganization(beneficiary.address);
    try {
        const pre_verify = await signer.contract.isOrganizationVerified(beneficiary.address);
        const verify_tx = await verifyBeneficiary();
        const post_verify = await signer.contract.isOrganizationVerified(beneficiary.address);

        log();
        log(`Verification process:`, tabs = 3, sep = '');
        log(`Organization ${beneficiary.address} => current status: [${pre_verify}]`);
        log(`Organization ${beneficiary.address} => status after verification: [${post_verify}]`);

        return { tx: verify_tx, status: post_verify };

    } catch (e) { 
        return { 
            tx: null, 
            get method() { return (verifyBeneficiary)() }
        }
    }
}

const revokeOrganization = async (signer, beneficiary) => {
    const revokeBeneficiary = () => signer.contract.revokeOrganization(beneficiary.address);
    try {
        const pre_revoke = await signer.contract.isOrganizationVerified(beneficiary.address);
        const revoke_tx = await revokeBeneficiary();
        const post_revoke = await signer.contract.isOrganizationVerified(beneficiary.address);

        log();
        log(`Revocation process:`, tabs = 3, sep = '');
        log(`Organization ${beneficiary.address} => current status: [${pre_revoke}]`);
        log(`Organization ${beneficiary.address} => status after revocation: [${post_revoke}]`);

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