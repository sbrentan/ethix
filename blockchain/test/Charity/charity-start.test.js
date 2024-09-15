const { prepareCreationParams } = require("../helpers/creation-helper.js");
const { prepareStartParams } = require("../helpers/start-helper.js");
const { assertAccountsValidity } = require("../assertions/deployment-assertions.js");
const { assertOrganizationVerification } = require("../assertions/verification-assertions.js");
const { 
    assertCampaignCreation, 
    assertCreationParamsValidity
} = require("../assertions/creation-assertions.js");
const { 
    assertCampaignStart, 
    assertCampaignStartFailure,
    assertStartParamsValidity 
} = require("../assertions/start-assertions.js");
const { log } = require("../../common/utils.js");

const test_not_existing_campaign = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test campaign is not created => revert]`, tabs = 2, sep = '');
    
    const _params = await prepareStartParams().then(assertStartParamsValidity);
    await assertCampaignStartFailure(_signers, _params);
}

const test_start_fails_if_seed_doesnt_match_commit_hash_seed = async (contract, accounts) => {

    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test seed doesn't match commit hash => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: web3.utils.randomHex(32)
    }).then(assertStartParamsValidity);

    await assertCampaignStartFailure(_signers, _params);
}

const test_start_fails_if_block_number_is_incorrect = async (contract, accounts) => {
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test block number is incorrect => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        emulate: true
    }).then(assertStartParamsValidity);
    
    await assertCampaignStartFailure(_signers, _params);
}

const test_start_fails_if_signature_is_incorrect = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test signature is not valid => revert]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    const _key = (await ethers.Wallet.createRandom()).privateKey;
    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed,
        private_key: _key
    }).then(assertStartParamsValidity);

    await assertCampaignStartFailure(_signers, _params);
}

const test_campaign_start = async (contract, accounts) => {
    
    const _signers = await assertAccountsValidity(contract, accounts);

    log();
    log(`[Test campaign start]`, tabs = 2, sep = '');
    
    await assertOrganizationVerification(_signers.owner, _signers.beneficiary);

    let _params = await prepareCreationParams({ 
        beneficiary: _signers.beneficiary 
    }).then(assertCreationParamsValidity);

    const _campaignId = await assertCampaignCreation(_signers, _params);

    _params = await prepareStartParams({
        campaignId: _campaignId,
        seed: _params.seed
    }).then(assertStartParamsValidity);
    
    await assertCampaignStart(_signers, _params);
}

module.exports = {
    test_not_existing_campaign,
    test_start_fails_if_seed_doesnt_match_commit_hash_seed,
    test_start_fails_if_block_number_is_incorrect,
    test_start_fails_if_signature_is_incorrect,
    test_campaign_start
}