const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.test_contract_is_deployed = async (charity) => {
    log();
    log(`[Test T001]: Contract deployment`, tabs = 2, sep = '');

    const contract_address = await charity.getAddress();
    log(`Charity deployed to: ${contract_address}`);

    expect(contract_address).to.be.properAddress;
}

module.exports.test_owner_is_correct = async (charity, owner) => {
    log();
    log(`[Test T002]: Owner verification`, tabs = 2, sep = '');

    log(`Owner address: ${owner.address}`);
    log(`Contract owner address: ${charity.runner.address}`);

    expect(charity.runner.address).to.equal(owner.address);
}

Object.assign(global, module.exports);