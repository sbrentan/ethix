const { log } = require("../common/utils.js");
const { expect } = require("chai");
const { HOUR } = require('../common/constants.js');
const { prepareCreationParams } = require("../common/utils.js");

module.exports.test_beneficiary_is_verified = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    let donor_charity = charity.connect(donor);

    log();
    log(`[Test T007]: Beneficiary is unverified => revert`, tabs = 2, sep = '');
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
}

module.exports.test_dates_are_properly_defined = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    let donor_charity = charity.connect(donor);

    let _block = await ethers.provider.getBlock("latest");
    let _startingDate = Math.floor(_block.timestamp + (12 * HOUR));
    let _deadline = Math.floor(_block.timestamp - (24 * HOUR));

    await charity.verifyOrganization(beneficiary.address);
    await expect(await charity.isOrganizationVerified(beneficiary.address)).to.be.true;

    log();
    log(`[Test T008]`, tabs = 2, sep = '');

    log();
    log(`* [Case 1]: Starting date > deadline => revert\n`, tabs = 3, sep = '');
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
    log(`* [Case 2]: Starting date is in the past => revert\n`, tabs = 3, sep = '');
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

module.exports.test_token_goal_is_less_than_max_tokens = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    let donor_charity = charity.connect(donor);

    await charity.verifyOrganization(beneficiary.address);
    await expect(await charity.isOrganizationVerified(beneficiary.address)).to.be.true;
    
    log();
    log(`[Test T009]: tokenGoal > maxTokens => revert`, tabs = 2, sep = '');
    
    const _params = await prepareCreationParams({ 
        tokenGoal: 10,
        maxTokens: 5,
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

module.exports.test_signature_is_correct =  async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    let donor_charity = charity.connect(donor);

    await charity.verifyOrganization(beneficiary.address);
    await expect(await charity.isOrganizationVerified(beneficiary.address)).to.be.true;
    
    log();
    log(`[Test T010]: Signature is incorrect => revert`, tabs = 2, sep = '');
    
    const _key = (await ethers.Wallet.createRandom()).privateKey;
    const _params = await prepareCreationParams({ 
        private_key: _key,
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

module.exports.test_campaign_creation = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    let donor_charity = charity.connect(donor);

    await charity.verifyOrganization(beneficiary.address);
    await expect(await charity.isOrganizationVerified(beneficiary.address)).to.be.true;

    log();
    log(`[Test T011]: Campaign creation`, tabs = 2, sep = '');

    const _params = await prepareCreationParams({ beneficiary: beneficiary.address });

    const create_tx = await donor_charity.createCampaign(
        _params.title,
        _params.startingDate,
        _params.deadline,
        _params.tokenGoal,
        _params.maxTokens,
        _params.beneficiary,
        _params.seedHash,
        _params.signature
    );
    const create_receipt = await create_tx.wait();
    const create_event = create_receipt?.logs[0]?.fragment?.name;
    const create_data = create_receipt?.logs[0]?.data; // campaign id

    expect(create_event).to.equal("CampaignCreated");
    expect(create_data).to.be.a.properHex;

    const _campaignIds = await charity.getCampaignsIds();
    expect(_campaignIds).to.be.an('array').that.includes(create_data);
}

Object.assign(global, module.exports);