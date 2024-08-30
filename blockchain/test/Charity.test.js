const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const CharityModule = require("../ignition/modules/Charity");

const { log } = require("./common/utils.js");

require("@nomicfoundation/hardhat-chai-matchers");

require("./Charity/contract-deployment.test.js");
require("./Charity/organization-verification.test.js");
require("./Charity/campaign-creation.test.js");
require("./Charity/campaign-start.test.js");
require("./Charity/token-validation.test.js");
require("./Charity/campaign-end.test.js");

describe("Charity", function () {

	let charity; // contract instance of owner
	let owner, donor, beneficiary, other; // signers providers

	async function deployCharityFixture() {
		const { charity } = await ignition.deploy(CharityModule);
		return { charity: charity };
	}

	before(async function () {
		[owner, donor, beneficiary, other] = await ethers.getSigners();

		log(`owner address: ${owner.address}`, 1);
		log(`donor address: ${donor.address}`, 1);
		log(`beneficiary address: ${beneficiary.address}`, 1);
		log(`other address: ${other.address}`, 1);
		log();
	});

	beforeEach(async function () {
		// Runs before each test (it) in this block
		const _fixture = await loadFixture(deployCharityFixture);
		charity = _fixture.charity;
	});

	describe("Deployment", function () {

		after(() => log());

		it("T001 - Should deploy the contract", () => test_contract_is_deployed(charity));

		it("T002 - Should set the right owner", () => test_owner_is_correct(charity, owner));

	});

	describe("Organization/Beneficiary verification", function () {

		after(() => log());

		// should be authorized to verify the organization
		it("T003 - Should revert the verification", () => test_verification_is_not_authorized(charity, other, beneficiary));

		// if authorized, should verify the organization
		it("T004 - Should verify the organization", () => test_verification_is_performed(charity, beneficiary));

		// should be authorized to revoke the organization verification
		it("T005 - Should revert the revocation", () => test_revocation_is_not_authorized(charity, other, beneficiary));

		// should revoke the organization verification
		it("T006 - Should revoke the verification", () => test_revocation_is_performed(charity, beneficiary));

	});

	describe("Campaign creation", function () {

		after(() => log());

		// should revert if parameters are not properly defined ???
		// eg. expect(title).to.be.a('string'); expect(startingDate).to.be.a('number'); etc.

		// should revert if beneficiary is unverified
		it("T007 - Should revert if beneficiary is unverified", () => test_beneficiary_is_not_verified(charity, donor, beneficiary));

		// should verify if the campaign doesn't already exist
		// ISSUE: the campaign id is always unique

		// should verify the date is proper defined:
		/*
			- startingDate < deadline
			- startingDate >= block.timestamp
		*/
		it("T008 - Should revert if improper dates are given", () => test_dates_are_properly_defined(charity, donor, beneficiary));

		// should verify the tokenGoal is less than maxTokens
		it("T009 - Should revert if tokenGoal is greater than maxTokens", () => test_token_goal_is_less_than_max_tokens(charity, donor, beneficiary));

		// should verify if the signature is correct
		it("T010 - Should revert if the signature is incorrect", () => test_creation_signature_is_correct(charity, donor, beneficiary));

		// should create the campaign
		it("T011 - Should create the campaign", () => test_campaign_creation(charity, donor, beneficiary));

		// should get the campaign
		it("T012 - Should get the campaign details", () => test_get_campaign(charity, donor, beneficiary));

	});

	describe("Campaign start/funding", function () {

		after(() => log());

		// should revert if the campaign is not created
		it("T013 - Should revert if the campaign is not created", () => test_campaign_is_not_created(charity, donor));

		// should verify commitHash and block number
		// ISSUE: cannot verify from here

		// should revert if the signature is incorrect
		it("T014 - Should revert if the signature is incorrect", () => test_start_signature_is_correct(charity, donor, beneficiary));

		// should start the campaign
		it("T015 - Should start the campaign", () => test_campaign_start(charity, donor, beneficiary));

	});

	describe("Token validation", function () {

		after(() => log());

		// should revert if the token is not valid
		it("T016 - Should revert if a token is not valid", () => test_token_is_not_valid(charity, donor, beneficiary));

		// should validate the token
		it("T017 - Should validate a token", () => test_token_is_valid(charity, donor, beneficiary));

	});

	describe("Campaign end", function () {

		// should revert if refund claim is not authorized
		it("T018 - Should revert if refund claim is not authorized", () => test_refund_claim_is_not_authorized(charity, donor, beneficiary, other));

		// should claim the refund
		it("T019 - Should claim the refund", () => test_refund_is_claimed(charity, donor, beneficiary));

		// should revert if donation claim is not authorized
		it("T020 - Should revert if donation claim is not authorized", () => test_donation_claim_is_not_authorized(charity, donor, beneficiary, other));

		// should claim the donation
		it("T021 - Should claim the donation", () => test_donation_is_claimed(charity, donor, beneficiary));

	});
});
