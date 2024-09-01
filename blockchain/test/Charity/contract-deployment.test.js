const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.assertAccountsValidity = (contract, accounts) => {
    
    expect(contract.target).to.be.properAddress;
    expect(contract.runner.address).to.be.properAddress;

    let _signers = {};

    for (const [key, account] of Object.entries(accounts)) {
        expect(account.address).to.be.properAddress;

        _signers[key] = {
            address: account.address,
            contract: contract.connect(account)
        };
    }

    return _signers;
}

module.exports.test_contract_is_deployed = async (contract) => {
    log();
    log(`[Test contract deployment]`, tabs = 2, sep = '');

    const contract_address = await contract.getAddress();
    log(`Charity deployed to: ${contract_address}`);

    expect(contract_address).to.be.properAddress;
}

module.exports.test_owner_is_correct = async (contract, accounts) => {
    log();
    log(`[Test contract owner is correct]`, tabs = 2, sep = '');

    const { owner } = this.assertAccountsValidity(contract, accounts);

    log(`Owner address: ${owner.address}`);
    log(`Contract owner address: ${contract.runner.address}`);

    expect(contract.runner.address).to.equal(owner.address);
}

Object.assign(global, {
    test_contract_is_deployed: module.exports.test_contract_is_deployed,
    test_owner_is_correct: module.exports.test_owner_is_correct
});