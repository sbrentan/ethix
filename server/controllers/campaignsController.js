const asyncHandler = require("express-async-handler");
const Campaign = require("../models/Campaign");
const { web3, WEB3_MANAGER_PRIVATE_KEY, WEB3_MANAGER_ACCOUNT } = require("../config/web3");
const { recoverAddress, getBytes, hashMessage } =  require("ethers");

// @desc Get all campaigns
// @route GET /campaigns
// @access Public - each user can see all campaigns
const getAllCampaigns = asyncHandler(async (req, res) => {
	const campaigns = await Campaign.find().lean();
	if (!campaigns?.length) {
		return res.status(400).json({ message: "No campaigns found" });
	}
	res.json(campaigns);
});

// @desc Get a campaign
// @route GET /campaigns/:id
// @access Public - each user can see a campaign
const getCampaign = asyncHandler(async (req, res) => {
	const campaign = await Campaign.findById(req.params.id).lean();
	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}
	inject_from_blockchain = req.query.from_blockchain
	if (inject_from_blockchain) {
		// inject data from blockchain
		// TODO: implement
		// campaign.blockchain_data = ...
	}

	// Get current blockchain block number (used for to wait for CRR reveal method)
	const blockNumber = Number(await web3.eth.getBlockNumber());

	// Tell the frontend when the reveal method is callable because the block number has changed
	campaign.is_fundable = campaign.blockNumber < blockNumber;

	// Remove `seed` from the response
	delete campaign.seed;

	res.json(campaign);
});

// @route POST /campaigns
// @access Private: donor
const createNewCampaign = asyncHandler(async (req, res) => {
	const { target, title, image, description, deadline, donor, receiver, draft } = req.body;

	// Confirm data
	if (!target || !title || !deadline || !donor || !receiver) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Check if the campaign is a draft and skip campaign creation if it is
	if (draft) {
		// Generate a seed for the campaign
		const seed = web3.utils.randomHex(32);
	
		// sign seed with account manager signature
		const signResult = await web3.eth.accounts.sign(web3.utils.keccak256(seed), WEB3_MANAGER_PRIVATE_KEY);
		console.log(signResult);

		// saving seed in session
		req.session.seed = seed;

		// const seedHash = web3.utils.keccak256("\\x19Ethereum Signed Message:\n" + seed.length + seed);
		const seedHash = web3.utils.keccak256(seed);

		return res.status(200).json({ message: "Validation passed", seedHash: seedHash, signature: {
				"r": signResult.r,
				"s": signResult.s,
				"v": signResult.v
			}
		});	
	}

	const seed = req.session.seed;
	const seedHash = req.body.seedHash;
	const campaignAddress = req.body.campaignAddress;
	
	// Confirm seed and seedHash are valid
	if (!seed || !seedHash || seedHash !== web3.utils.keccak256(seed)) {
		return res.status(400).json({ message: "Seed is not valid" });
	}

	// check if the campaignAddress is valid
	if (!campaignAddress) {
		return res.status(400).json({ message: "Campaign address is required" });
	}

	// Get current blockchain block number (used for to wait for CRR reveal method)
	const blockNumber = Number(await web3.eth.getBlockNumber());

	// Create and store new campaign
	const campaign = await Campaign.create({ 
		target, title, image, description, deadline, donor, receiver, seed, blockNumber, campaignId: campaignAddress, createdBy: req.user._id
	});

	if (campaign) {
		// created
		res.status(201).json({ message: `New campaign ${title} created`, campaignId: campaign._id });
	} else {
		res.status(500).json({ message: "Something went wrong!" });
	}
});

// @desc Generates a random wallet for a campaign
// @route GET /campaigns/:id/wallet/random
// @access Private: donor
const generateRandomWallet = asyncHandler(async (req, res) => {
	campaign_id = req.params.id;
	campaign = await Campaign.findOne(_id=campaign_id, ).exec();

	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}
	campaignAddress = campaign.campaignId;
	if (!campaignAddress) {
		return res.status(400).json({ message: "Campaign not associated to blockchain" });
	}
	if(campaign.createdBy != req.user._id) {
		return res.status(400).json({ message: "User not authorized to generate wallet for this campaign" });
	}

	seed = campaign.seed;
	if(!seed) {
		return res.status(400).json({ message: "Seed not found" });
	}
	
	// Generate a random wallet
	const wallet = web3.eth.accounts.create();

	// Sign the public key of the wallet with the manager's private key
	const signResult = await web3.eth.accounts.sign(web3.utils.keccak256(wallet.address + campaignAddress), WEB3_MANAGER_PRIVATE_KEY);

	// Save the wallet in the session
	req.session.wallet = wallet;

	res.status(200).json({ address: wallet.address, campaign: campaign, signature: {
		"r": signResult.r,
		"s": signResult.s,
		"v": signResult.v
	}});
});

// @desc Update a campaign
// @route PATCH /campaigns
// @access Private: donor
const updateCampaign = asyncHandler(async (req, res) => {
	id = req.params.id;

	// Confirm data
	if (!id) {
		return res.status(400).json({ message: "Id is required" });
	}

	const { image, description } = req.body;

	const campaign = await Campaign.findById(id).exec();

	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}

	// Update campaign
	campaign.image = image;
	campaign.description = description;

	// Updates only image and description. Other fields require to be changed in blockchain with apposite methods

	await campaign.save();

	res.json(campaign);
});

// @desc Delete a campaign
// @route DELETE /campaigns/:id
// @access Private: donor
const deleteCampaign = asyncHandler(async (req, res) => {
	const campaign = await Campaign.findById(req.params.id).exec();

	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}

	if (campaign.campaignId) {
		// TODO: manage a way to delete a campaign from blockchain (maybe setting a flag `deleted` in the blockchain) (maybe only from admin)
		return res.status(400).json({ message: "Cannot delete a campaign associated to blockchain" });
	}

	await campaign.deleteOne();

	res.json({ message: "Campaign removed" });
});

module.exports = {
	getAllCampaigns,
	getCampaign,
	createNewCampaign,
	updateCampaign,
	deleteCampaign,
};
