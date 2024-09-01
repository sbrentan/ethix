const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const CampaignModule = require("../ignition/modules/Campaign");

const { log } = require("./common/utils.js");

require("@nomicfoundation/hardhat-chai-matchers");

describe("Charity", function () {

	let campaign; // contract instance of owner
	let accounts; // owner, donor, beneficiary, other

	async function deployCampaignFixture() {
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

});
