const express = require("express");
const router = express.Router();
const campaignsController = require("../controllers/campaignsController");
const tokensController = require("../controllers/tokensController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

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
	.route("/:id/tokens")
	.post(
		verifyRoles(ROLES_LIST.donor),
		tokensController.generateTokens
	);

router
	.route("/:id/wallet/random")
	.post(
		verifyRoles(ROLES_LIST.donor),
		campaignsController.generateRandomWallet
	);

module.exports = router;