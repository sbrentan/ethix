const express = require("express");
const router = express.Router();
const campaignsController = require("../controllers/campaignsController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

router
	.route("/userCampaigns")
		.get(
			verifyJWT,
			verifyRoles(ROLES_LIST.donor, ROLES_LIST.beneficiary),
			campaignsController.getUserCampaigns
		);

router
	.route("")
	.get(
		campaignsController.getAllCampaigns
	)
	.post(
		verifyJWT,
		verifyRoles(ROLES_LIST.donor),
		campaignsController.createNewCampaign
	);

router
	.route("/:id")
	.get(
		campaignsController.getCampaign
	)
	.patch(
		verifyJWT,
		verifyRoles(ROLES_LIST.donor),
		campaignsController.updateCampaign
	)
	.delete(
		verifyJWT,
		verifyRoles(ROLES_LIST.donor),
		campaignsController.deleteCampaign
	);

router
	.route("/:id/associate")
	.post(
		verifyJWT,
		verifyRoles(ROLES_LIST.donor),
		campaignsController.associateCampaignToBlockchain
	);
module.exports = router;
