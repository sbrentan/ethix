const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

const { expect } = require("chai");
const CharityModule = require("../ignition/modules/Charity");

const log = (message, tabs) => { console.log(`${"\t".repeat(tabs)}${message}`); };

describe("Charity", function () {
	
	let charity, owner, donor, beneficiary, other;
	let owner_private_key;

	async function deployCharityFixture() {
		const { charity } = await ignition.deploy(CharityModule);
		return { charity: charity };
	}

	before(async function () {
		
		// Runs before all tests in this block
		const [_owner, _donor, _beneficiary, _other] = await ethers.getSigners();

		const _accounts = config.networks.hardhat.accounts;
		const _owner_wallet = ethers.Wallet.fromPhrase(_accounts.mnemonic, _accounts.path + `/0`);

		owner = _owner.address;
		owner_private_key = _owner_wallet.privateKey;
		donor = _donor.address;
		beneficiary = _beneficiary.address;
		other = _other.address;
		
		log(`owner: ${owner}`, 1);
		log(`donor: ${donor}`, 1);
		log(`beneficiary: ${beneficiary}`, 1);
		log(`other: ${other}`, 1);
	});

	beforeEach(async function () {
		// Runs before each test (it) in this block
		const _fixture = await loadFixture(deployCharityFixture);
		charity = _fixture.charity;
	});

	/**
	 * Deployment test cases
	 */
	describe("Deployment", function () {
		it("T001 - Should deploy the contract", async function () {
			charity = _fixture.charity;

			const contract_address = await charity.getAddress();
			expect(contract_address).to.be.properAddress;

			log(`charity deployed to: ${contract_address}`, 1);
		});

		it("T002 - Should set the right owner", async function () {
			expect(charity.runner.address).to.equal(owner);
		});

		it("CT003 - General flow", async function () {
			
			let _is_verified = await charity.isOrganizationVerified(beneficiary);
			expect(_is_verified).to.be.false;

			// Verify the beneficiary
			await charity.verifyOrganization(beneficiary, { from: owner });

			_is_verified = await charity.isOrganizationVerified(beneficiary);
			expect(_is_verified).to.be.true;

			const _seed = web3.utils.randomHex(32);
			const _seedHash = web3.utils.keccak256(_seed);

			// Sign the seed
			const _signature = await web3.eth.accounts.sign(_seedHash, owner_private_key);

			const _startingDate = new Date().getTime();
			const _deadline = new Date().getTime() + 60;
			
			log(`startingDate: ${_startingDate}`, 1);
			log(`deadline: ${_deadline}`, 1);
			log(`beneficiary: ${beneficiary}`, 1);
			log(`seedHash: ${_seedHash}`, 1);
			log(`signature: ${JSON.stringify(_signature)}`, 1);
			log(`donor: ${donor}`, 1);

			// Donor can create campaign
			const _creation = await charity.createCampaign(
				"Test",
				_startingDate,
				_deadline,
				5,
				10,
				beneficiary,
				_seedHash, // is the hash of the seed
				{
					r: _signature.r,
					s: _signature.s,
					v: _signature.v
				}, // is the signature of the seed 
				{ from: owner }
			);
		});
	});
});
