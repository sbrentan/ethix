const { startCampaign } = require("../helpers/start-helper.js");
const { decodeToken } = require("../helpers/token-helper.js");
const { expect } = require("chai");

const assertCampaignStart = async (signers, params) => {
    const start_tx_outcome = await startCampaign(signers, params);
    await expect(start_tx_outcome.tx).to.emit(start_tx_outcome.contract, "CampaignStarted");
    expect(start_tx_outcome.campaignId).to.match(/^0x[0-9a-fA-F]{64}$/);
    
    if (start_tx_outcome.tokens) {
        expect(start_tx_outcome.tokens).to.include.keys('valid', 'invalid');
        expect(start_tx_outcome.tokens.valid).to.be.a("array");
        
        start_tx_outcome.tokens.valid.forEach(token => {
            expect(token).to.have.property('jwt').that.is.a('string');
            expect(decodeToken(token.jwt)).to.not.be.null;
            expect(token).to.have.property('salt').that.matches(/^[0-9a-fA-F]{64}$/);
            expect(token).to.have.property('seed').that.matches(/^[0-9a-fA-F]{64}$/);
        });

        expect(start_tx_outcome.tokens.invalid).to.be.a("object");
        expect(start_tx_outcome.tokens.invalid).to.have.property('jwt').that.is.a('string');
        expect(decodeToken(start_tx_outcome.tokens.invalid.jwt)).to.not.be.null;
        expect(start_tx_outcome.tokens.invalid).to.have.property('salt').that.matches(/^[0-9a-fA-F]{64}$/);
        expect(start_tx_outcome.tokens.invalid).to.have.property('seed').that.matches(/^[0-9a-fA-F]{64}$/);
    }

    return {
        campaignId: start_tx_outcome.campaignId,
        tokens: start_tx_outcome.tokens
    }
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