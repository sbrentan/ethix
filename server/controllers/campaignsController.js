const asyncHandler = require("express-async-handler");
const Campaign = require("../models/Campaign");
const { web3, WEB3_MANAGER_PRIVATE_KEY, WEB3_CONTRACT, encodePacked } = require("../config/web3");
const User = require("../models/User");
const { beneficiary } = require("../config/roles_list");

// @desc Get all campaigns
// @route GET /campaigns
// @access Public - each user can see all campaigns
const getAllCampaigns = asyncHandler(async (req, res) => {
	var campaigns = await Campaign.find().exec();
	if (!campaigns?.length) {
		return res.status(400).json({ message: "No campaigns found" });
	}
	const new_campaigns = await _injectBlockchainCampaign(campaigns);

	res.json(new_campaigns);
});

// @desc Get a campaign
// @route GET /campaigns/:id
// @access Public - each user can see a campaign
const getCampaign = asyncHandler(async (req, res) => {
	let campaign = await Campaign.findById(req.params.id).lean();
	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}
	
	[campaign] = await _injectBlockchainCampaign([campaign]);

	res.json(campaign);
});

// @desc Get a campaign
// @route GET /campaigns/userCampaigns
// @access Donor
const getUserCampaigns = asyncHandler(async (req, res) => {
	let userId = req.userId;
	console.log("userid:"+userId)
	let campaigns = await Campaign.find({$or:[{donor: userId},{receiver: userId}]}).exec();
	if (!campaigns?.length) {
		return res.status(400).json({ message: "No campaigns found" });
	}
	
	campaigns = await _injectBlockchainCampaign(campaigns);
	res.json(campaigns);
});

// @route POST /campaigns
// @access Private: donor
const createNewCampaign = asyncHandler(async (req, res) => {
	const { target, tokensCount, title, image, description, startingDate, deadline, receiver, draft } = req.body;

	// Confirm data
	if (!target || !title || !deadline || !receiver || !tokensCount) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Check if the campaign is a draft and skip campaign creation if it is
	// Saving the seed in the session to be used later
	// Also return the seed hash and the signature to be passed to the blockchain method
	if (draft) {
		// Generate a seed for the campaign
		const seed = web3.utils.randomHex(32);
		const seedHash = web3.utils.keccak256(seed);
	
		// sign seed with account manager signature
		const signResult = await web3.eth.accounts.sign(seedHash, WEB3_MANAGER_PRIVATE_KEY);

		// saving seed in session
		req.session.seed = seed;

		// const seedHash = web3.utils.keccak256("\\x19Ethereum Signed Message:\n" + seed.length + seed);

		res.status(200).json({ message: "Validation passed", seedHash: seedHash, signature: {
				"r": signResult.r,
				"s": signResult.s,
				"v": signResult.v
			}
		});	

		return;
	}

	const seed = req.session.seed;
	const { seedHash, campaignAddress } = req.body;
	let { batchRedeem } = req.body;
	
	// Confirm seed and seedHash are valid
	if (!seed || !seedHash || seedHash !== web3.utils.keccak256(seed)) {
		return res.status(400).json({ message: "Seed is not valid" });
	}

	// check if the campaignAddress is valid
	if (!campaignAddress) {
		return res.status(400).json({ message: "Campaign address is required" });
	}

	if(!batchRedeem) {
		batchRedeem = 1;
	}

	// Get current blockchain block number (used for to wait for CRR reveal method)
	const blockNumber = Number(await web3.eth.getBlockNumber());

	let donor = req.userId;

	// Create and store new campaign
	const campaign = await Campaign.create({ 
		target, title, image, description, startingDate, deadline, donor, receiver, tokensCount,
		seed, blockNumber, campaignId: campaignAddress, createdBy: donor, batchRedeem: batchRedeem
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
	campaign = await Campaign.findById(campaign_id).exec();

	if (!campaign) {
		return res.status(400).json({ message: "Campaign not found" });
	}
	campaignAddress = campaign.campaignId;
	if (!campaignAddress) {
		return res.status(400).json({ message: "Campaign not associated to blockchain" });
	}

	logged_user = await User.findOne({username: req.user}).exec();
	if(!campaign.createdBy.equals(logged_user._id)) {
		return res.status(400).json({ message: "User not authorized to generate wallet for this campaign" });
	}

	seed = campaign.seed;
	if(!seed) {
		return res.status(400).json({ message: "Seed not found" });
	}

	// Generate a random wallet
	const wallet = web3.eth.accounts.create();

	// Sign the public key of the wallet with the manager's private key
	combinedHash = encodePacked(wallet.address, campaignAddress);
	const signResult = await web3.eth.accounts.sign(combinedHash, WEB3_MANAGER_PRIVATE_KEY);

	// Save the wallet in the session
	req.session.wallet = wallet;

	res.status(200).json({ address: wallet.address, campaign: campaign, signature: signResult });
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

async function _injectBlockchainCampaign(campaigns) {
	// Get current blockchain block number (used for to wait for CRR reveal method)
	const blockNumber = Number(await web3.eth.getBlockNumber());
	new_campaigns = [];
	for (let i = 0; i < campaigns.length; i++) {
		campaign = campaigns[i].toObject();

		// inject data from blockchain
		delete campaign.seed;

		// Tell the frontend when the reveal method is callable because the block number has changed
		campaign.is_fundable = campaign.blockNumber < blockNumber;

		if (!campaign.campaignId) {
			continue;
		}
		try{
			campaign.blockchain_data = await WEB3_CONTRACT.methods.getCampaign(campaign.campaignId).call();
			for (let key in campaign.blockchain_data) {
				// if is big int
				if(typeof(campaign.blockchain_data[key]) === 'bigint')
					campaign.blockchain_data[key] = Number(campaign.blockchain_data[key]);
			}
			// console.log("Retrieved campaign data from blockchain for campaign:", campaign._id);
		} catch (error) {
			campaign.blockchain_data = {};
			// console.log('Error getting campaign data from blockchain for campaign:', campaign._id);
			continue;
		}

		new_campaigns.push(campaign);
	}
	return new_campaigns;
}


module.exports = {
	getAllCampaigns,
	getCampaign,
	createNewCampaign,
	generateRandomWallet,
	updateCampaign,
	deleteCampaign,
	getUserCampaigns,
};
