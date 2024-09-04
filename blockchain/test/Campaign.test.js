const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const buildCampaign = require("../ignition/modules/Campaign");

const { log } = require("../common/utils.js");

require("@nomicfoundation/hardhat-chai-matchers");

// Deployment test cases
const {
	test_contract_is_deployed,
	test_owner_is_correct
} = require("./Campaign/campaign-deployment.test.js").tests;

// Campaign start/funding test cases
const {
	test_start_request_fails_if_is_not_from_owner,
	test_start_fails_if_is_not_from_donor,
	test_campaign_start,
	test_start_fails_if_is_already_started
} = require("./Campaign/campaign-start.test.js").tests;

const {
	test_token_redeem_fails_without_signature,
	test_token_redeem_fails_if_goal_already_reached,
	test_redeeming_fails_with_invalid_token,
	test_valid_token_is_redeemed
} = require("./Campaign/campaign-redeeming.test.js").tests;

const {
	test_refund_claim_request_fails_if_is_not_from_owner,
	test_refund_claim_fails_if_is_not_from_donor,
	test_refund_claim_fails_if_campaign_is_not_ended,
	test_refund_claim_fails_if_is_already_claimed,
	test_refund_claim_fails_if_campaign_is_not_funded,
	test_refund_claim_succeeds
} = require("./Campaign/campaign-refund.test.js").tests;

const {
	test_donation_claim_request_fails_if_is_not_from_owner,
	test_donation_claim_fails_if_is_not_from_beneficiary,
	test_donation_claim_fails_if_campaign_is_not_ended,
	test_donation_claim_fails_if_is_already_claimed,
	test_donation_claim_fails_if_campaign_is_not_funded,
	test_donation_claim_succeeds
} = require("./Campaign/campaign-donation.test.js").tests;

describe("CCampaign", function () {

	let campaign; // contract instance of owner
	let accounts; // owner, donor, beneficiary, other

	async function deployCampaignFixture() {
		const CampaignModule = await buildCampaign(accounts);
		const { campaign } = await ignition.deploy(CampaignModule);
		return { campaign: campaign };
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
		const fixture = await loadFixture(deployCampaignFixture);
		campaign = fixture.campaign;
	});

	describe("Deployment", function () {

		after(() => log());

		it("T001 - Should deploy the contract", () => test_contract_is_deployed(campaign));

		it("T002 - Should set the right owner", () => test_owner_is_correct(campaign, accounts));

	});

	describe("Campaign start/funding", function () {

		after(() => log());

		// should revert if the request is not from owner 
		// (only the contract factory can start the process for funding a campaign)
		it("T001 - Should revert if the start request is not from owner", () => test_start_request_fails_if_is_not_from_owner(campaign, accounts));

		// should revert if the campaign is not started from donor
		it("T002 - Should revert if the campaign is not started from donor", () => test_start_fails_if_is_not_from_donor(campaign, accounts));

		// should start the campaign
		it("T003 - Should start the campaign", () => test_campaign_start(campaign, accounts));

		// should revert if the campaign has been already funded
		it("T004 - Should revert if the campaign has been already funded", () => test_start_fails_if_is_already_started(campaign, accounts));

	});

	describe("Token redeeming", function () {

		after(() => log());

		// should revert if the token doesn't have the corresponding signature
		it("T001 - Should revert if the token doesn't have the corresponding signature", () => test_token_redeem_fails_without_signature(campaign, accounts));

		// should revert if token goal is already reached when redeeming
		it("T002 - Should revert if token goal is already reached when redeeming", () => test_token_redeem_fails_if_goal_already_reached(campaign, accounts));

		// should revert if the token is not valid
		it("T003 - Should revert if the token is not valid", () => test_redeeming_fails_with_invalid_token(campaign, accounts));

		// should redeem the token
		it("T004 - Should redeem the token", () => test_valid_token_is_redeemed(campaign, accounts));

	});

	describe("Campaign end", function () {
		
		describe("Refund claiming", function () {

			after(() => log());

			// should revert if the refund claim request is not from the owner
			it("T001 - Should revert if the refund claim request is not from the owner", () => test_refund_claim_request_fails_if_is_not_from_owner(campaign, accounts));

			// should revert if the refund isn't requested by the donor
			it("T002 - Should revert if the refund isn't requested by the donor", () => test_refund_claim_fails_if_is_not_from_donor(campaign, accounts));

			// should revert if the campaign is not ended
			it("T003 - Should revert if the campaign is not ended", () => test_refund_claim_fails_if_campaign_is_not_ended(campaign, accounts));

			// should revert if the refund has been already claimed
			it("T004 - Should revert if the refund has been already claimed", () => test_refund_claim_fails_if_is_already_claimed(campaign, accounts));

			// should revert if the campaign hasn't been funded
			it("T005 - Should revert if the campaign hasn't been funded", () => test_refund_claim_fails_if_campaign_is_not_funded(campaign, accounts));

			// should refund the donor
			it("T006 - Should refund the donor", () => test_refund_claim_succeeds(campaign, accounts));

		});

		describe("Donation claiming", function () {

			// should revert if the donation claim request is not from the owner
			it("T001 - Should revert if the donation claim request is not from the owner", () => test_donation_claim_request_fails_if_is_not_from_owner(campaign, accounts));

			// should revert if the donation isn't requested by the beneficiary
			it("T002 - Should revert if the donation isn't requested by the beneficiary", () => test_donation_claim_fails_if_is_not_from_beneficiary(campaign, accounts));

			// should revert if the campaign is not ended
			it("T003 - Should revert if the campaign is not ended", () => test_donation_claim_fails_if_campaign_is_not_ended(campaign, accounts));

			// should revert if the donation has been already claimed
			it("T004 - Should revert if the donation has been already claimed", () => test_donation_claim_fails_if_is_already_claimed(campaign, accounts));

			// should revert if the campaign hasn't been funded
			it("T005 - Should revert if the campaign hasn't been funded", () => test_donation_claim_fails_if_campaign_is_not_funded(campaign, accounts));

			// should donate the beneficiary
			it("T006 - Should donate the beneficiary", () => test_donation_claim_succeeds(campaign, accounts));

		});
	});
});
