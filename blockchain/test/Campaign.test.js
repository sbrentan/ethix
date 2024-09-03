const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const buildCampaign = require("../ignition/modules/Campaign");

const { log } = require("../common/utils.js");

require("@nomicfoundation/hardhat-chai-matchers");

// Deployment test cases
const {
	test_contract_is_deployed,
	test_owner_is_correct
} = require("./Campaign/contract-deployment.test.js").tests;

// Campaign start/funding test cases
const {
	test_request_fails_if_is_not_from_owner,
	test_start_fails_if_is_not_from_donor,
	test_campaign_start,
	test_start_fails_if_is_already_started
} = require("./Campaign/campaign-start.test.js").tests;

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
		it("T001 - Should revert if the request is not from owner", () => test_request_fails_if_is_not_from_owner(campaign, accounts));

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
		it("T001 - Should revert if the token doesn't have the corresponding signature", () => {});

		// should revert if token goal is already reached when redeeming
		it("T002 - Should revert if token goal is already reached when redeeming", () => {});

		// should revert if the token is not valid
		it("T003 - Should revert if the token is not valid", () => {});

		// should redeem the token
		it("T004 - Should redeem the token", () => {});

	});
});
