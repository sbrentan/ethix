const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const buildCampaign = require("../ignition/modules/Campaign");

const { log } = require("../common/utils.js");

require("@nomicfoundation/hardhat-chai-matchers");

require("./Campaign/contract-deployment.test.js");

describe("Campaign", function () {

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
});
