const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const CharityModule = require("../ignition/modules/Charity");

const helpers = require("@nomicfoundation/hardhat-network-helpers");

const {
	log,
	getPrivateKey
} = require("./common/utils.js");

require("@nomicfoundation/hardhat-chai-matchers");
require("./Charity/deployment.test.js");
require("./Charity/organization-verification.test.js");
require("./Charity/campaign-creation.test.js");
require("./Charity/campaign-start.test.js");

describe("Charity", function () {

	let charity; // contract instance of owner
	let owner, donor, beneficiary, other; // signers providers
	let owner_private_key; // owner private key

	async function deployCharityFixture() {
		const { charity } = await ignition.deploy(CharityModule);
		return { charity: charity };
	}

	before(async function () {
		const [_owner, _donor, _beneficiary, _other] = await ethers.getSigners();

		// if no index is specified, the owner private key is returned
		owner_private_key = getPrivateKey();

		owner = _owner;
		donor = _donor;
		beneficiary = _beneficiary;
		other = _other;

		log(`owner: \n\t* address: ${owner.address}\n\t* private key: ${owner_private_key}`, 1);
		log(`donor address: ${donor.address}`, 1);
		log(`beneficiary address: ${beneficiary.address}`, 1);
		log(`other address: ${other.address}\n\n`, 1);
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

	describe("Organization/Beneficiary verification", function () {

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

		// should revert if parameters are not properly defined ???
		// eg. expect(title).to.be.a('string'); expect(startingDate).to.be.a('number'); etc.

		// should revert if beneficiary is unverified
		it("T007 - Should revert if beneficiary is unverified", () => test_beneficiary_is_verified(charity, donor, beneficiary));

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
	});

	describe("Campaign start/funding", function () {

		// should revert if the campaign is not created
		it("T012 - Should revert if the campaign is not created", () => test_campaign_is_not_created(charity, donor));

		// should verify commitHash and block number
		// ISSUE: cannot verify from here

		// should revert if the signature is incorrect
		it("T013 - Should revert if the signature is incorrect", () => test_start_signature_is_correct(charity, donor, beneficiary));

		// should start the campaign
		it("T014 - Should start the campaign", () => test_campaign_start(charity, donor, beneficiary));
	});

	/*test("flow", async function () {

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

		const _seed = web3.utils.randomHex(32);
		const _seedHash = web3.utils.keccak256(_seed);

		// Sign the seed
		let _signature = await web3.eth.accounts.sign(_seedHash, owner_private_key);

		let block = await ethers.provider.getBlock("latest");
		log(`After verification: ${formatDate(block.timestamp)}`);

		const HOUR = 3600;
		const _startingDate = Math.floor(block.timestamp + (2 * HOUR));
		const _deadline = Math.floor(_startingDate + (6 * HOUR));

		log(`Starting date: ${formatDate(_startingDate)}`);
		log(`Deadline: ${formatDate(_deadline)}`);

		block = await ethers.provider.getBlock("latest");
		log(`Pre creation: ${formatDate(block.timestamp)}`);

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

		const create_receipt = await create_tx.wait();
		const create_event = create_receipt?.logs[0]?.fragment?.name;
		const _campaignId = create_receipt?.logs[0]?.data; // campaign id

		expect(create_event).to.equal("CampaignCreated");

		block = await ethers.provider.getBlock("latest");
		log(`After creation: ${formatDate(block.timestamp)}`);

		// TODO: add block mining and test startCampaign does not work before

		// TODO: test if the campaign id has been added to the list of campaigns
		//const _campaignId = (await charity.getCampaignsIds()).at(-1);

		const _rwallet = web3.eth.accounts.create();
		log(`Rwallet address: ${_rwallet.address}`);
		log(`Rwallet private key: ${_rwallet.privateKey}`);

		const _combinedHash = encodePacked(_rwallet.address, _campaignId);
		_signature = await web3.eth.accounts.sign(_combinedHash, owner_private_key);

		block = await ethers.provider.getBlock("latest");
		log(`Pre start: ${formatDate(block.timestamp)}`);

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
		log(`After start: ${formatDate(block.timestamp)}`);

		await helpers.time.increase((4 * HOUR));

		block = await ethers.provider.getBlock("latest");
		log(`Entering the campaign period: ${formatDate(block.timestamp)}`);

		const _campaign = await getCampaign(charity, _campaignId);

		expect(_campaign).to.not.be.null;

		const _token_structure = await generateToken(owner_charity, _seed, _campaignId, _rwallet);

		expect(_token_structure).to.not.be.null;

		const is_valid = await redeemToken(owner_charity, _campaignId, _token_structure);

		expect(is_valid).to.be.true;

		await helpers.time.increase((10 * HOUR));

		block = await ethers.provider.getBlock("latest");
		log(`Campaign finished! ${formatDate(block.timestamp)}`);

		const refund_tx = await donor_charity.claimRefund(_campaignId);
		const refund_receipt = await refund_tx.wait();
		const refund_event = refund_receipt?.logs[0]?.fragment?.name;
		const refund_amount = refund_receipt?.logs[0]?.data;

		expect(refund_event).to.equal("RefundClaimed");

		// convert the amount from hex wei to ether
		const _refund_amount = web3.utils.fromWei(refund_amount, 'ether');
		log(`Refund amount: ${_refund_amount} ETH`);

		const donation_tx = await beneficiary_charity.claimDonation(_campaignId);
		const donation_receipt = await donation_tx.wait();
		const donation_event = donation_receipt?.logs[0]?.fragment?.name;
		const donation_amount = donation_receipt?.logs[0]?.data;

		expect(donation_event).to.equal("DonationClaimed");

		// convert the amount from hex wei to ether
		const _donation_amount = web3.utils.fromWei(donation_amount, 'ether');
		log(`Donation amount: ${_donation_amount} ETH`);
	});*/
});
