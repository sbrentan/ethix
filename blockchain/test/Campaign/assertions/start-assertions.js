const { startCampaign } = require("../helpers/start-helper.js");
const { expect } = require("chai");

const assertCampaignStart = async (signers, params) => {
    const start_tx_outcome = await startCampaign(signers, params);
    expect(start_tx_outcome.tx).to.not.be.reverted;
    
    const details = start_tx_outcome.details;
    expect(details).to.be.an("object");
    expect(details).to.have.property('initialDeposit').that.is.a("number").and.is.greaterThan(0);
    expect(details).to.have.property('refunds').that.is.a("number").and.is.equal(details.initialDeposit);
    expect(details).to.have.property('funded').that.is.a("boolean").and.is.true;

    return details;
}

const assertCampaignStartFailure = async (signers, params) => {
    const start_tx_outcome = await startCampaign(signers, params);
    await expect(start_tx_outcome.method).to.be.reverted;
    expect(start_tx_outcome.tx).to.be.null;
}

const assertStartParamsValidity = (params) => {

    // Start params verification
    params?.campaignId && expect(params.campaignId).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.seed && expect(params.seed).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.wallet && expect(params.wallet).to.be.an("object").that.includes.keys('address', 'privateKey');
    params?.wallet && expect(params.wallet.address).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    params?.wallet && expect(params.wallet.privateKey).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.value && expect(params.value).to.be.a("number").that.is.greaterThan(0);

    // Verifying the signature object
    params?.signature && expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    params?.signature?.r && expect(params.signature.r).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.signature?.s && expect(params.signature.s).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{64}$/);
    params?.signature?.v && expect(params.signature.v).to.be.a("string").that.matches(/^0x[0-9a-fA-F]{2}$/);

    // Verifying the optional parameters
    params?.generateTokens !== undefined && expect(params.generateTokens).to.be.a("boolean");
    params?.amount && expect(params.amount).to.be.a("number").that.is.at.least(0);
    params?.decode !== undefined && expect(params.decode).to.be.a("boolean");
    params?.emulate !== undefined && expect(params.emulate).to.be.a("boolean");
    params?.value && expect(params.value).to.be.a("number").that.is.greaterThan(0);
    params?.from && expect(params.from).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);

    return params;
}

module.exports = {
    assertCampaignStart,
    assertCampaignStartFailure,
    assertStartParamsValidity
}