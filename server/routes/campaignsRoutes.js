const express = require("express");
const router = express.Router();
const campaignsController = require("../controllers/campaignsController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

// router.use(verifyJWT);

router
	.route("")
	.get(
		// verifyRoles(ROLES_LIST.admin),
		campaignsController.getAllCampaigns
	)

module.exports = router;