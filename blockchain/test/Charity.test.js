const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

const { expect } = require("chai");
const CharityModule = require("../ignition/modules/Charity");

const log = (message, tabs) => { console.log(`${"\t".repeat(tabs)}${message}`); };

describe("Charity", function () {

	let charity, owner, donor, beneficiary, other;

	async function deployCharityFixture() {
		const { charity } = await ignition.deploy(CharityModule);
		return { charity: charity };
	}

	before(async function () {
		// Runs before all tests in this block
		console.log("before all tests");
	});

	beforeEach(async function () {
		// Runs before each test (it) in this block
		console.log("before each test");
	});

	describe("Deployment", function () {
		it("T001 - Should deploy the contract", async function () {
			const _fixture = await loadFixture(deployCharityFixture);
			charity = _fixture.charity;

			const contract_address = await charity.getAddress();
			expect(contract_address).to.be.properAddress;

			log(`charity deployed to: ${contract_address}`, 1);

			const contract_owner = charity.runner.address;
			const [_owner, _donor, _beneficiary, _other] = await ethers.getSigners();

			expect(contract_owner).to.be.equal(_owner.address);

			owner = _owner.address;
			donor = _donor.address;
			beneficiary = _beneficiary.address;
			other = _other.address;

			
			log(`owner: ${owner}`, 1);
			log(`donor: ${donor}`, 1);
			log(`beneficiary: ${beneficiary}`, 1);
			log(`other: ${other}`, 1);
		});
	});
});
