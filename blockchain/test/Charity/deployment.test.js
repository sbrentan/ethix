const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.test_contract_is_deployed = async (charity) => {
    const contract_address = await charity.getAddress();
    expect(contract_address).to.be.properAddress;
    log(`Charity deployed to: ${contract_address}`);
}

module.exports.test_owner_is_correct = async (charity, owner) => {
    expect(charity.runner.address).to.equal(owner.address);
    log(`Owner address: ${owner.address}`);
}

Object.assign(global, module.exports);