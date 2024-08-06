const express = require("express");
const router = express.Router();
const campaignsController = require("../controllers/campaignsController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);


router
	.route("/userCampaigns")
		.get(
			verifyRoles(ROLES_LIST.donor, ROLES_LIST.beneficiary),
			campaignsController.getUserCampaigns
		);

router
	.route("")
	.get(
		campaignsController.getAllCampaigns
	)
	.post(
		verifyRoles(ROLES_LIST.donor),
		campaignsController.createNewCampaign
	);

router
	.route("/:id")
	.get(
		campaignsController.getCampaign
	)
	.patch(
		verifyRoles(ROLES_LIST.donor),
		campaignsController.updateCampaign
	)
	.delete(
		verifyRoles(ROLES_LIST.donor),
		campaignsController.deleteCampaign
	);

router
	.route("/:id/associate")
	.post(
		verifyRoles(ROLES_LIST.donor),
		campaignsController.associateCampaignToBlockchain
	);
module.exports = router;