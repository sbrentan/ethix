const { createCampaign } = require("../helpers/creation-helper.js");
const { expect } = require("chai");

const assertCampaignCreation = async (signers, params) => {
    const create_tx_outcome = await createCampaign(signers, params);
    await expect(create_tx_outcome.tx).to.emit(create_tx_outcome.contract, "CampaignCreated");
    expect(create_tx_outcome.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    return create_tx_outcome.campaignId;
}

const assertCampaignCreationFailure = async (signers, params) => {
    const create_tx_outcome = await createCampaign(signers, params);
    await expect(create_tx_outcome.method).to.be.reverted;
    expect(create_tx_outcome.tx).to.be.null;
}

const assertCreationParamsValidity = (params) => {

    // General verification
    params?.campaignId && expect(params.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    params?.title && expect(params.title).to.be.a("string").that.is.not.empty;
    params?.startingDate && expect(params.startingDate).to.be.a("number").that.is.above(0);
    params?.deadline && expect(params.deadline).to.be.a("number").that.is.above(0);
    params?.tokenGoal && expect(params.tokenGoal).to.be.a("number").that.is.above(0);
    params?.maxTokens && expect(params.maxTokens).to.be.a("number").that.is.above(0);
    params?.donor && expect(params.donor).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    params?.beneficiary && expect(params.beneficiary).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{40}$/);
    params?.initialDeposit && expect(params.initialDeposit).to.be.a("number").that.is.at.least(0);
    params?.refunds && expect(params.refunds).to.be.a("number").that.is.at.least(0);
    params?.donations && expect(params.donations).to.be.a("number").that.is.at.least(0);
    params?.refundClaimed !== undefined && expect(params.refundClaimed).to.be.a("boolean");
    params?.donationClaimed !== undefined && expect(params.donationClaimed).to.be.a("boolean");
    params?.funded !== undefined && expect(params.funded).to.be.a("boolean");

    // Creation specific verification
    params?.seedHash && expect(params.seedHash).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    params?.signature && expect(params.signature).to.be.an("object").that.includes.keys('r', 's', 'v');
    params?.signature?.r && expect(params.signature.r).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    params?.signature?.s && expect(params.signature.s).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{64}$/);
    params?.signature?.v && expect(params.signature.v).to.be.a("string").that.matches(/^0x[a-fA-F0-9]{2}$/);

    return params;
}

const assertDifferentCampaignIds = (campaignId1, campaignId2) => {
    expect(campaignId1).to.not.equal(campaignId2);
}

const assertCampaignToBeInArray = (campaignId, campaigns) => {
    expect(campaigns).to.be.an("array").that.includes(campaignId);
}

module.exports = {
    assertCampaignCreation,
    assertCampaignCreationFailure,
    assertCreationParamsValidity,
    assertDifferentCampaignIds,
    assertCampaignToBeInArray
}