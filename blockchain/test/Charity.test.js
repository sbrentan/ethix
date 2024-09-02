const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const CharityModule = require("../ignition/modules/Charity");

const { log } = require("../common/utils.js");

//require("@nomicfoundation/hardhat-chai-matchers");

require("./Charity/contract-deployment.test.js");
require("./Charity/organization-verification.test.js");
require("./Charity/campaign-creation.test.js");
require("./Charity/campaign-start.test.js");
require("./Charity/token-validation.test.js");
require("./Charity/campaign-end.test.js");

describe("Charity", function () {

	let charity; // contract instance of owner
	let accounts; // owner, donor, beneficiary, other

	async function deployCharityFixture() {
		const { charity } = await ignition.deploy(CharityModule);
		return { charity: charity };
	}

	before(async function () {
		const [owner, donor, beneficiary, other] = await ethers.getSigners();

		log(`owner address: ${owner.address}`, 1);
		log(`donor address: ${donor.address}`, 1);
		log(`beneficiary address: ${beneficiary.address}`, 1);
		log(`other address: ${other.address}`, 1);
		log();

		accounts = { owner, donor, beneficiary, other };
	});

	beforeEach(async function () {
		// Runs before each test (it) in this block
		const fixture = await loadFixture(deployCharityFixture);
		charity = fixture.charity;
	});

	describe("Deployment", function () {

		after(() => log());

		it("T001 - Should deploy the contract", () => test_contract_is_deployed(charity));

		it("T002 - Should set the right owner", () => test_owner_is_correct(charity, accounts));

	});

	describe("Organization/Beneficiary verification", function () {

		after(() => log());

		// non-owner should not be authorized to verify the organization
		it("T001 - Should revert the verification if not from owner", () => test_verification_fails_from_non_owner(charity, accounts));

		// if authorized, should verify the organization
		it("T002 - Should verify the organization if from owner", () => test_verification(charity, accounts));

		// non-owner should be authorized to revoke the organization verification
		it("T003 - Should revert the revocation if not from owner", () => test_revocation_fails_from_non_owner(charity, accounts));

		// should revoke the organization verification
		it("T004 - Should revoke the verification if from owner", () => test_revocation(charity, accounts));

	});

	describe("Campaign creation", function () {

		after(() => log());

		// should revert if parameters are not properly defined ???
		// eg. expect(title).to.be.a('string'); expect(startingDate).to.be.a('number'); etc.
		// TODO: to do so, we need to validate the params in the contract first

		// should revert if beneficiary is unverified
		it("T001 - Should revert if beneficiary is unverified", () => test_beneficiary_is_not_verified(charity, accounts));

		// should verify if campaign id is different even when the same parameters are given
		it("T002 - Should verify the campaign id is always different", () => test_campaign_id_is_different(charity, accounts));

		// should verify the date is proper defined:
		/*
			- startingDate < deadline
			- startingDate >= block.timestamp
		*/
		it("T003 - Should revert if improper dates are given", () => test_dates_are_properly_defined(charity, accounts));

		// should verify the tokenGoal is less than maxTokens
		it("T004 - Should revert if tokenGoal is greater than maxTokens", () => test_token_goal_is_less_than_max_tokens(charity, accounts));

		// should verify if the signature is correct
		it("T005 - Should revert if the signature is incorrect", () => test_creation_signature_is_correct(charity, accounts));

		// should create the campaign
		it("T006 - Should create the campaign", () => test_campaign_creation(charity, accounts));

		// should get the campaign
		it("T007 - Should get the campaign details", () => test_get_campaign(charity, accounts));

	});

	describe("Campaign start/funding", function () {

		after(() => log());

		// should revert if the campaign does not exist
		it("T001 - Should revert if the campaign does not exist", () => test_not_existing_campaign(charity, accounts));

		// should verify commitHash and block number
		// ISSUE: cannot verify from here

		// should revert if the signature is incorrect
		it("T002 - Should revert if the signature is incorrect", () => test_start_fails_if_signature_is_incorrect(charity, accounts));

		// should start the campaign
		it("T003 - Should start the campaign", () => test_campaign_start(charity, accounts));

	});

	describe("Token redeeming", function () {

		after(() => log());

		// should revert if the token is not valid
		it("T001 - Should revert if a token is not valid", () => test_redeeming_fails_with_invalid_token(charity, accounts));

		// should redeem a valid token
		it("T002 - Should redeem a valid token", () => test_valid_token_is_redeemed(charity, accounts));

	});

	describe("Campaign end", function () {

		// should revert if refund claim is not authorized
		it("T001 - Should revert refund claiming if not from donor", () => test_refund_claim_fails_if_not_from_donor(charity, accounts));

		// should claim the refund
		it("T002 - Should claim the refund", () => test_refund_is_claimed(charity, accounts));

		// should revert if donation claim is not authorized
		it("T003 - Should revert donation claiming if not from beneficiary", () => test_donation_claim_fials_if_not_from_beneficiary(charity, accounts));

		// should claim the donation
		it("T004 - Should claim the donation", () => test_donation_is_claimed(charity, accounts));

	});
});
