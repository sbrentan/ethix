const { log } = require("../common/utils.js");
const { expect } = require("chai");
const { HOUR } = require('../common/constants.js');
const { prepareCreationParams } = require("../common/utils.js");

require("./organization-verification.test.js");

// should verify the date is proper defined:
/*
    - startingDate < deadline
    - startingDate >= block.timestamp
*/

// should verify the tokenGoal is less than maxTokens

// should verify the signature is correct

// should create the campaign


module.exports.test_beneficiary_is_verified = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    let donor_charity = charity.connect(donor);

    log();
    log(`[Test 1]: Beneficiary is unverified => revert`, tabs = 2, sep = '');
    const _params = await prepareCreationParams({ beneficiary: beneficiary.address });

    await expect(donor_charity.createCampaign(
        _params.title,
        _params.startingDate,
        _params.deadline,
        _params.tokenGoal,
        _params.maxTokens,
        _params.beneficiary,
        _params.seedHash,
        _params.signature
    )).to.be.reverted;

    /*log();
    log(`[Test 2]: Beneficiary is verified`, tabs = 2, sep = '');
    await test_verification_is_performed(charity, beneficiary, separator = '-');
    
    expect(await donor_charity.createCampaign(
        _params.title,
        _params.startingDate,
        _params.deadline,
        _params.tokenGoal,
        _params.maxTokens,
        _params.beneficiary,
        _params.seedHash,
        _params.signature
    )).to.not.be.reverted;*/
}

module.exports.test_date_is_properly_defined = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;

    let donor_charity = charity.connect(donor);

    await test_verification_is_performed(charity, beneficiary);

    let _block = await ethers.provider.getBlock("latest");
    let _startingDate = Math.floor(_block.timestamp + (12 * HOUR));
    let _deadline = Math.floor(_block.timestamp - (24 * HOUR));

    log();
    log(`[Test 1]: Starting date > deadline => revert`, tabs = 2, sep = '');
    let _params = await prepareCreationParams({ 
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: beneficiary.address 
    });

    await expect(donor_charity.createCampaign(
        _params.title,
        _params.startingDate,
        _params.deadline,
        _params.tokenGoal,
        _params.maxTokens,
        _params.beneficiary,
        _params.seedHash,
        _params.signature
    )).to.be.reverted;

    _startingDate = Math.floor(_block.timestamp - (12 * HOUR));
    _deadline = Math.floor(_block.timestamp + (24 * HOUR));

    log();
    log(`[Test 2]: Starting date is in the past => revert`, tabs = 2, sep = '');
    _params = await prepareCreationParams({ 
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: beneficiary.address 
    });

    await expect(donor_charity.createCampaign(
        _params.title,
        _params.startingDate,
        _params.deadline,
        _params.tokenGoal,
        _params.maxTokens,
        _params.beneficiary,
        _params.seedHash,
        _params.signature
    )).to.be.reverted;
}

Object.assign(global, module.exports);