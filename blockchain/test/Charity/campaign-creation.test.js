const { 
    prepareCreationParams,
    createCampaign
} = require("../helpers/creation-helper.js");
const { verifyOrganization } = require("../helpers/verification-helper.js");
const { log } = require("../common/utils.js");
const { HOUR } = require('../common/constants.js');
const { expect } = require("chai");

module.exports.verifyCreationParams = (params) => {
    expect(params?.title).to.be.a("string").that.is.not.empty;
    expect(params?.startingDate).to.be.a("number").that.is.above(0);
    expect(params?.deadline).to.be.a("number").that.is.above(0);
    expect(params?.tokenGoal).to.be.a("number").that.is.above(0);
    expect(params?.maxTokens).to.be.a("number").that.is.above(0);
    expect(params?.beneficiary).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    expect(params?.seedHash).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    
    // Verifying the signature object
    expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    expect(params.signature.r).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    expect(params.signature.s).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    expect(params.signature.v).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{2}$/);
    
    return params;
}

module.exports.test_beneficiary_is_verified = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T007]: Beneficiary is unverified => revert`, tabs = 2, sep = '');

    const _params = await prepareCreationParams({ beneficiary: beneficiary.address })
    .then(params => {
        return this.verifyCreationParams(params);
    });
    const _retVal = await createCampaign(donor_charity, _params);

    expect(_retVal).to.be.null;
}

module.exports.test_dates_are_properly_defined = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    let _block = await ethers.provider.getBlock("latest");
    let _startingDate = Math.floor(_block.timestamp + (12 * HOUR));
    let _deadline = Math.floor(_block.timestamp - (24 * HOUR));

    log();
    log(`[Test T008]`, tabs = 2, sep = '');
    
    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");

    log();
    log(`* [Case 1]: Starting date > deadline => revert\n`, tabs = 3, sep = '');
    let _params = await prepareCreationParams({
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: beneficiary.address
    })
    .then(params => {
        return this.verifyCreationParams(params);
    });
    
    let _retVal = await createCampaign(donor_charity, _params);
    expect(_retVal).to.be.null;

    _startingDate = Math.floor(_block.timestamp - (12 * HOUR));
    _deadline = Math.floor(_block.timestamp + (24 * HOUR));

    log();
    log(`* [Case 2]: Starting date is in the past => revert\n`, tabs = 3, sep = '');
    _params = await prepareCreationParams({
        startingDate: _startingDate,
        deadline: _deadline,
        beneficiary: beneficiary.address
    })
    .then(params => {
        return this.verifyCreationParams(params);
    });

    _retVal = await createCampaign(donor_charity, _params);
    expect(_retVal).to.be.null;
}

module.exports.test_token_goal_is_less_than_max_tokens = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T009]: tokenGoal > maxTokens => revert`, tabs = 2, sep = '');
    
    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");

    const _params = await prepareCreationParams({
        tokenGoal: 10,
        maxTokens: 5,
        beneficiary: beneficiary.address
    })
    .then(params => {
        return this.verifyCreationParams(params);
    });

    const _retVal = await createCampaign(donor_charity, _params);
    expect(_retVal).to.be.null;
}

module.exports.test_creation_signature_is_correct = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);
    
    log();
    log(`[Test T010]: Signature is incorrect => revert`, tabs = 2, sep = '');
    
    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");
    
    const _key = (await ethers.Wallet.createRandom()).privateKey;
    const _params = await prepareCreationParams({
        private_key: _key,
        beneficiary: beneficiary.address
    })
    .then(params => {
        return this.verifyCreationParams(params);
    });

    const _retVal = await createCampaign(donor_charity, _params);
    expect(_retVal).to.be.null;
}

module.exports.test_campaign_creation = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T011]: Campaign creation`, tabs = 2, sep = '');
    
    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");

    const _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    })
    .then(params => {
        return this.verifyCreationParams(params);
    });
    const _retVal = await createCampaign(donor_charity, _params);

    await expect(_retVal.create_tx).to.emit(donor_charity, "CampaignCreated");
    expect(_retVal.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);

    // ??? maybe to move this to another test
    /*const _campaignIds = await charity.getCampaignsIds();
    expect(_campaignIds).to.be.an('array').that.includes(_retVal.campaignId);*/
}

Object.assign(global, module.exports);