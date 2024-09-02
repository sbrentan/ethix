const { prepareCreationParams } = require("../helpers/charity/creation-helper.js");
const { 
    prepareStartParams, 
    startCampaign 
} = require("../helpers/charity/start-helper.js");
const { assertAccountsValidity } = require("./contract-deployment.test.js").assertions;
const { assertOrganizationVerification } = require("./organization-verification.test.js").assertions;
const { 
    assertCampaignCreation, 
    assertCreationParamsValidity
} = require("./campaign-creation.test.js").assertions;
const { log } = require("../../common/utils.js");
const { expect } = require("chai");

const assertCampaignStart = async (contract, params, owner_charity = null) => {
    const start_tx_outcome = await startCampaign(contract, params, owner_charity);
    await expect(start_tx_outcome.tx).to.emit(start_tx_outcome.campaign_contract, "CampaignStarted");
    expect(start_tx_outcome.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    return start_tx_outcome.jwts || {};
}

const assertCampaignStartFailure = async (contract, params) => {
    const start_tx_outcome = await startCampaign(contract, params);
    await expect(start_tx_outcome.method).to.be.reverted;
    expect(start_tx_outcome.tx).to.be.null;
}

const assertStartParamsValidity = (params) => {

    // Start params verification
    params?.campaignId && expect(params.campaignId).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.seed && expect(params.seed).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.wallet && expect(params.wallet).to.be.an("object").that.includes.keys('address', 'privateKey');
    expect(params.wallet.address).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    expect(params.wallet.privateKey).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.value && expect(params.value).to.be.a("number").that.is.greaterThan(0);

    // Verifying the signature object
    params?.signature && expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    params?.signature?.r && expect(params.signature.r).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.signature?.s && expect(params.signature.s).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.signature?.v && expect(params.signature.v).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{2}$/);

    // Verifying the optional parameters
    params?.generateTokens && expect(params.generateTokens).to.be.a("boolean");
    params?.validAmount && expect(params.validAmount).to.be.a("number").that.is.at.least(0);
    params?.invalidAmount && expect(params.invalidAmount).to.be.a("number").that.is.at.least(0);

    return params;
}

const test_not_existing_campaign = async (contract, accounts) => {
    
    const { donor } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test campaign is not created => revert]`, tabs = 2, sep = '');
    
    const _params = await prepareStartParams().then(assertStartParamsValidity);
    await assertCampaignStartFailure(donor.contract, _params);
}

const test_start_fails_if_signature_is_incorrect = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test token is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    const _key = (await ethers.Wallet.createRandom()).privateKey;
    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        private_key: _key,
        beneficiary: beneficiary.address
    }).then(assertStartParamsValidity);

    await assertCampaignStartFailure(donor.contract, _params);
}

const test_campaign_start = async (contract, accounts) => {
    
    const { donor, beneficiary } = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test campaign start]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(contract, beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: beneficiary.address 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(donor.contract, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed
    }).then(assertStartParamsValidity);
    
    await assertCampaignStart(donor.contract, _params);
}

module.exports = {
    assertions: {
        assertCampaignStart,
        assertCampaignStartFailure,
        assertStartParamsValidity
    },
    tests: {
        test_not_existing_campaign,
        test_start_fails_if_signature_is_incorrect,
        test_campaign_start
    }
}