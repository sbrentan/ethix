const { getCampaign } = require("../helpers/common-helper.js");
const { expect } = require("chai");

const assertCorrectParameterAssignments = async (contract) => {
    const details = await getCampaign(contract);

    expect(details).to.be.an("object");
    expect(details).to.have.a.property('campaignId').that.matches(/^0x[0-9a-fA-F]{64}$/);
    expect(details).to.have.a.property('title').that.is.a("string").and.is.not.empty;
    expect(details).to.have.a.property('startingDate').that.is.a("number").and.is.greaterThan(0);
    expect(details).to.have.a.property('deadline').that.is.a("number").and.is.greaterThan(details.startingDate);
    expect(details).to.have.a.property('donor').that.matches(/^0x[a-fA-F0-9]{40}$/);
    expect(details).to.have.a.property('beneficiary').that.matches(/^0x[a-fA-F0-9]{40}$/);
    expect(details).to.have.a.property('tokenGoal').that.is.a("number").and.is.greaterThan(0);
    expect(details).to.have.a.property('maxTokens').that.is.a("number").and.is.greaterThan(details.tokenGoal);
}

module.exports = {
    assertCorrectParameterAssignments
}