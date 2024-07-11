const asyncHandler = require("express-async-handler");
const Campaign = require("../models/Campaign");

// @desc Get all campaigns
// @route GET /campaigns
// @access Private: manager, admin
const getAllCampaigns = asyncHandler(async (req, res) => {
	const campaigns = await Campaign.find().lean();
	if (!campaigns?.length) {
		return res.status(400).json({ message: "No campaigns found" });
	}
	res.json(campaigns);
});

module.exports = {
	getAllCampaigns
};
