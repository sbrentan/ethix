const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertAccountsValidity = (contract, accounts) => {
    
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

const test_contract_is_deployed = async (contract) => {
    log();
    log(`[Test contract deployment]`, tabs = 2, sep = '');

    const contract_address = await contract.getAddress();
    log(`Campaign deployed to: ${contract_address}`);

    expect(contract_address).to.be.properAddress;
}

const test_owner_is_correct = async (contract, accounts) => {
    log();
    log(`[Test contract owner is correct]`, tabs = 2, sep = '');

    const { owner } = assertAccountsValidity(contract, accounts);

    log(`Owner address: ${owner.address}`);
    log(`Contract owner address: ${contract.runner.address}`);

    expect(contract.runner.address).to.equal(owner.address);
}

module.exports = {
    assertions: {
        assertAccountsValidity
    },
    tests: {
        test_contract_is_deployed,
        test_owner_is_correct
    }
}