const { 
    assertAccountsValidity,
    assertProperAddress,
    assertEqualAddress 
} = require("../assertions/deployment-assertions.js");
const { log } = require("../../common/utils.js");

const test_contract_is_deployed = async (contract) => {
    log();
    log(`[Test contract deployment]`, tabs = 2, sep = '');

    const contract_address = await contract.getAddress();
    log(`Campaign deployed to: ${contract_address}`);

    assertProperAddress(contract_address);
}

const test_owner_is_correct = async (contract, accounts) => {
    log();
    log(`[Test contract owner is correct]`, tabs = 2, sep = '');

    const { owner } = assertAccountsValidity(contract, accounts);

    log(`Owner address: ${owner.address}`);
    log(`Contract owner address: ${contract.runner.address}`);

    assertEqualAddress(contract.runner.address, owner.address);
}

module.exports = {
    test_contract_is_deployed,
    test_owner_is_correct
}