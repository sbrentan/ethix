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

const assertProperAddress = (address) => {
    expect(address).to.be.properAddress;
}

const assertEqualAddress = (address1, address2) => {
    expect(address1).to.equal(address2);
}

module.exports = {
    assertAccountsValidity,
    assertProperAddress,
    assertEqualAddress
}