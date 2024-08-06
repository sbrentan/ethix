const asyncHandler = require("express-async-handler");
const Campaign = require("../models/Campaign");
const Token = require("../models/Token");
const crypto = require('crypto');
const { web3 } = require("../config/web3");
const { beneficiary } = require("../config/roles_list");

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

	res.json(campaign);
});

// @desc Get a campaign
// @route GET /campaigns/userCampaigns
// @access Donor
const getUserCampaigns = asyncHandler(async (req, res) => {
	let userId = req.userId;
	console.log("userid:"+userId)
	const campaigns = await Campaign.find({$or:[{donor: userId},{receiver: userId}]}).exec();
	if (!campaigns?.length) {
		return res.status(400).json({ message: "No campaigns found" });
	}
	res.json(campaigns);
});

// @desc Create new campaign
// @route POST /campaigns
// @access Private: donor
const createNewCampaign = asyncHandler(async (req, res) => {
	const { target, title, image, description, startingDate, deadline, receiver, seed } = req.body;
	const { draft } = req.params;

	// Confirm data
	if (!target || !title || !deadline || !receiver, !seed) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Check if the campaign is a draft and skip campaign creation if it is
	if (draft) {
		res.status(200).json({ message: "Validation passed" });
		return;
	}

	// Get current blockchain block number (used for to wait for CRR reveal method)
	const blockNumber = Number(await web3.eth.getBlockNumber());

	let donor = req.userId;
	console.log(req)

	// Create and store new campaign
	const campaign = await Campaign.create({ target, title, image, description, startingDate, deadline, donor, receiver, seed, blockNumber });

	if (campaign) {
		// created
		res.status(201).json({ message: `New campaign ${title} created`, campaignId: campaign._id });
	} else {
		res.status(500).json({ message: "Something went wrong!" });
	}
});

// @desc Associate a campaign to blockchain
// @route POST /campaigns/:id/associate
// @access Private: donor
const associateCampaignToBlockchain = asyncHandler(async (req, res) => {
	const campaign = await Campaign.findById(req.params.id).exec();
	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}

	if (campaign.campaignId) {
		return res.status(400).json({ message: "Campaign already associated to blockchain" });
	}
	campaign.association_failed = true;
	await campaign.save();

	const { campaignId, tokenDonation, tokens } = req.body;

	// Confirm data
	if (!campaignId || !tokenDonation || !tokens) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// ===================== associate to blockchain

	// update campaign with blockchain data
	campaign.campaignId = campaignId;
	campaign.tokenDonation = tokenDonation;

	// for each token, generate its hash and store it on db
	const tokenEntities = tokens.map((token) => {
		return new Token({ 
			campaignId: campaign._id, 
			hash: crypto.createHash('sha256').update(campaignId + token).digest('hex')
		});
	});
	
	await Token.insertMany(tokenEntities);

	campaign.association_failed = false;
	await campaign.save();

	// TODO: add endpoint to edit campaign data in blockchain

	res.json(campaign);
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
	associateCampaignToBlockchain,
	updateCampaign,
	deleteCampaign,
	getUserCampaigns,
};
