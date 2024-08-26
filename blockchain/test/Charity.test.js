const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

const { expect } = require("chai");
const CharityModule = require("../ignition/modules/Charity");

const { 
	log,
	getPrivateKey,
	encodePacked,
	generateToken
} = require("../common/utils");

describe("Charity", function () {
	
	let charity; // contract instance

	let owner, donor, beneficiary, other; // signers providers
	let owner_private_key;

	async function deployCharityFixture() {
		const { charity } = await ignition.deploy(CharityModule);
		return { charity: charity };
	}

	before(async function () {
		
		const [_owner, _donor, _beneficiary, _other] = await ethers.getSigners();

		// if no index is specified, the owner private key is returned
		owner_private_key = getPrivateKey();

		// check if the owner private key is correct
		/* const _owner_wallet = new ethers.Wallet(owner_private_key);
		expect(_owner.address).to.equal(_owner_wallet.address); */

		owner = _owner;
		donor = _donor;
		beneficiary = _beneficiary;
		other = _other;
		
		log(`owner: ${owner.address}`, 1);
		log(`donor: ${donor.address}`, 1);
		log(`beneficiary: ${beneficiary.address}`, 1);
		log(`other: ${other.address}`, 1);
	});

	beforeEach(async function () {
		// Runs before each test (it) in this block
		const _fixture = await loadFixture(deployCharityFixture);
		charity = _fixture.charity;
	});

	describe("Deployment", function () {
		it("T001 - Should deploy the contract", async function () {
			const contract_address = await charity.getAddress();
			expect(contract_address).to.be.properAddress;

			log(`charity deployed to: ${contract_address}`, 1);
		});

		it("T002 - Should set the right owner", async function () {
			expect(charity.runner.address).to.equal(owner.address);
		});

		it("CT003 - General flow", async function () {

			let owner_charity = charity.connect(owner);
			let donor_charity = charity.connect(donor);
			
			let _is_verified = await charity.isOrganizationVerified(beneficiary);
			expect(_is_verified).to.be.false;

			// Verify the beneficiary
			await owner_charity.verifyOrganization(beneficiary);

			_is_verified = await charity.isOrganizationVerified(beneficiary);
			expect(_is_verified).to.be.true;

			log("Organization verified", 1);

			// TODO: test also the organization revocation

			const _seed = web3.utils.randomHex(32);
			const _seedHash = web3.utils.keccak256(_seed);

			// Sign the seed
			let _signature = await web3.eth.accounts.sign(_seedHash, owner_private_key);

			const _startingDate = new Date().getTime();
			const _deadline = new Date().getTime() + 60;

			// Donor can create campaign
			await donor_charity.createCampaign(
				"Test",
				_startingDate,
				_deadline,
				5,
				10,
				beneficiary,
				_seedHash,
				{
					r: _signature.r,
					s: _signature.s,
					v: _signature.v
				}
			);

			const _latestCampaign = (await charity.getCampaignsIds()).at(-1);

			const _rwallet = web3.eth.accounts.create();

			const _combinedHash = encodePacked(_rwallet.address, _latestCampaign);
			_signature = await web3.eth.accounts.sign(_combinedHash, owner_private_key);

			await donor_charity.startCampaign(
				_latestCampaign,
				_seed,
				_rwallet.address,
				{
					r: _signature.r,
					s: _signature.s,
					v: _signature.v
				},
				{
					value: web3.utils.toWei('1', 'ether')
				}
			)

			const _campaign = await charity.getCampaign(_latestCampaign);

			console.log(_campaign);

			const token_structure = generateToken(owner_charity, _seed, _latestCampaign);

			console.log(token_structure.token, token_structure.token_seed, token_structure.token_salt);

		});
	});
});
