const { verifyOrganization } = require("../helpers/verification-helper.js");
const { prepareCreationParams, createCampaign } = require("../helpers/creation-helper.js");
const { prepareStartParams, startCampaign } = require("../helpers/start-helper.js");
const { verifyCreationParams } = require("./campaign-creation.test.js");
const { log } = require("../common/utils.js");
const { expect } = require("chai");

module.exports.verifyStartParams = (params) => {
    expect(params.campaignId).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    expect(params.seed).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    expect(params.wallet.address).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    expect(params.wallet.privateKey).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);

    // Verifying the signature object
    expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    expect(params.signature.r).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    expect(params.signature.s).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    expect(params.signature.v).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{2}$/);

    return params;
}

module.exports.test_campaign_is_not_created = async (charity, donor) => {
    expect(donor.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T012]: Campaign is not created => revert`, tabs = 2, sep = '');

    const _params = await prepareStartParams()
    .then(params => {
        return this.verifyStartParams(params);
    })
    const _retVal = await startCampaign(donor_charity, _params);

    expect(_retVal).to.be.null;
}

module.exports.test_start_signature_is_correct = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T013]: Signature is invalid => revert`, tabs = 2, sep = '');
    
    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");

    let _params = await prepareCreationParams({ beneficiary: beneficiary.address })
    .then(params => {
        return verifyCreationParams(params);
    });
    let _retVal = await createCampaign(donor_charity, _params);
    await expect(_retVal.create_tx).to.emit(donor_charity, "CampaignCreated");

    const _key = (await ethers.Wallet.createRandom()).privateKey;
    _params = await prepareStartParams({
        campaignId: _retVal.campaignId,
        seed: _params.seed,
        private_key: _key,
        beneficiary: beneficiary.address
    })
    .then(params => {
        return verifyStartParams(params);
    });
    _retVal = await startCampaign(donor_charity, _params);
    expect(_retVal).to.be.null;
}

module.exports.test_campaign_start = async (charity, donor, beneficiary) => {
    expect(donor.address).to.be.properAddress;
    expect(beneficiary.address).to.be.properAddress;

    const donor_charity = charity.connect(donor);

    log();
    log(`[Test T014]: Campaign start`, tabs = 2, sep = '');
    
    const verify_tx = await verifyOrganization(charity, beneficiary.address);
    await expect(verify_tx).to.emit(charity, "OrganizationVerified");

    let _params = await prepareCreationParams({ beneficiary: beneficiary.address })
    .then(params => {
        return verifyCreationParams(params);
    });
    let _retVal = await createCampaign(donor_charity, _params);
    await expect(_retVal.create_tx).to.emit(donor_charity, "CampaignCreated");

    _params = await prepareStartParams({
        campaignId: _retVal.campaignId,
        seed: _params.seed
    })
    .then(params => {
        return verifyStartParams(params);
    });
    _retVal = await startCampaign(donor_charity, _params);
    
    await expect(_retVal.start_tx).to.emit(donor_charity, "CampaignStarted");
    expect(_retVal.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
}

Object.assign(global, module.exports);