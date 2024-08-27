const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

const helpers = require("@nomicfoundation/hardhat-network-helpers");

const { expect } = require("chai");
const CharityModule = require("../ignition/modules/Charity");

const {
	log,
	formatDate,
	getPrivateKey,
	encodePacked,
	generateToken,
	redeemToken
} = require("./common/utils.js");

require("./Charity/deployment.test.js");

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

		log(`owner: \n\t* address: ${owner.address}\n\t* private key: ${owner_private_key}`, 1);
		log(`donor address: ${donor.address}`, 1);
		log(`beneficiary address: ${beneficiary.address}`, 1);
		log(`other address: ${other.address}\n`, 1);
		log("");
	});

	beforeEach(async function () {
		// Runs before each test (it) in this block
		const _fixture = await loadFixture(deployCharityFixture);
		charity = _fixture.charity;
	});

	describe("Deployment", function () {

		it("T001 - Should deploy the contract", () => test_contract_is_deployed(charity));
		
		it("T002 - Should set the right owner", () => test_owner_is_correct(charity, owner));

	});

	describe("Organization verification", function () {

		// should be authorized to verify the organization
		// should verify the organization (both proper and not proper adddress)

		// should be authorized to revoke the organization verification
		// should revoke the organization verification

	});

	it("CT003 - General flow", async function () {

		let owner_charity = charity.connect(owner);
		let donor_charity = charity.connect(donor);
		let beneficiary_charity = charity.connect(beneficiary);

		let _is_verified = await charity.isOrganizationVerified(beneficiary);
		expect(_is_verified).to.be.false;

		// Verify the beneficiary
		await expect(owner_charity.verifyOrganization(beneficiary)).to.emit(owner_charity, "OrganizationVerified");

		_is_verified = await charity.isOrganizationVerified(beneficiary);
		expect(_is_verified).to.be.true;

		log("Organization verified", 1);

		// TODO: test also the organization revocation

		const _seed = web3.utils.randomHex(32);
		const _seedHash = web3.utils.keccak256(_seed);

		// Sign the seed
		let _signature = await web3.eth.accounts.sign(_seedHash, owner_private_key);

		// TODO: change log with formatted strings

		let block = await ethers.provider.getBlock("latest");
		log("After verification: ", formatDate(block.timestamp));

		const HOUR = 3600;
		const _startingDate = Math.floor(block.timestamp + (2 * HOUR));
		const _deadline = Math.floor(_startingDate + (6 * HOUR));

		log("Starting date: ", formatDate(_startingDate));
		log("Deadline: ", formatDate(_deadline));

		block = await ethers.provider.getBlock("latest");
		log("Pre creation: ", formatDate(block.timestamp));

		const create_tx = await donor_charity.createCampaign(
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

		log("create_tx", create_tx);

		const create_receipt = await create_tx.wait();

		log(create_receipt.logs);
		const create_event = create_receipt?.logs[0]?.fragment?.name;
		const _campaignId = create_receipt?.logs[0]?.data; // campaign id

		expect(create_event).to.equal("CampaignCreated");

		block = await ethers.provider.getBlock("latest");
		log("After creation: ", formatDate(block.timestamp));

		// TODO: add block mining and test startCampaign does not work before

		// TODO: test if the campaign id has been added to the list of campaigns
		//const _campaignId = (await charity.getCampaignsIds()).at(-1);

		const _rwallet = web3.eth.accounts.create();
		log(`Rwallet address: ${_rwallet.address}`);
		log(`Rwallet private key: ${_rwallet.privateKey}`);

		const _combinedHash = encodePacked(_rwallet.address, _campaignId);
		_signature = await web3.eth.accounts.sign(_combinedHash, owner_private_key);

		block = await ethers.provider.getBlock("latest");
		log("Pre start: ", formatDate(block.timestamp));

		await expect(donor_charity.startCampaign(
			_campaignId,
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
		)).to.emit(donor_charity, "CampaignStarted")

		block = await ethers.provider.getBlock("latest");
		log("After start: ", formatDate(block.timestamp));

		await helpers.time.increase((4 * HOUR));

		block = await ethers.provider.getBlock("latest");
		log("Entering the campaign period: ", formatDate(block.timestamp));

		const _campaign = await charity.getCampaign(_campaignId);

		log(_campaign);

		const _token_structure = await generateToken(owner_charity, _seed, _campaignId, _rwallet);

		log(_token_structure.token, _token_structure.token_seed, _token_structure.token_salt);

		const is_valid = await redeemToken(owner_charity, _campaignId, _token_structure);

		log(is_valid);

		await helpers.time.increase((10 * HOUR));

		block = await ethers.provider.getBlock("latest");
		log("Campaign finished! ", formatDate(block.timestamp));

		const refund_tx = await donor_charity.claimRefund(_campaignId);
		const refund_receipt = await refund_tx.wait();
		const refund_event = refund_receipt?.logs[0]?.fragment?.name;
		const refund_amount = refund_receipt?.logs[0]?.data;

		expect(refund_event).to.equal("RefundClaimed");

		// convert the amount from hex wei to ether
		const _refund_amount = web3.utils.fromWei(refund_amount, 'ether');
		log("Refund amount: ", _refund_amount);

		const donation_tx = await beneficiary_charity.claimDonation(_campaignId);
		const donation_receipt = await donation_tx.wait();
		const donation_event = donation_receipt?.logs[0]?.fragment?.name;
		const donation_amount = donation_receipt?.logs[0]?.data;

		expect(donation_event).to.equal("DonationClaimed");

		// convert the amount from hex wei to ether
		const _donation_amount = web3.utils.fromWei(donation_amount, 'ether');
		log("Donation amount: ", _donation_amount);
	});
});
