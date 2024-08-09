const express = require("express");
const router = express.Router();
const publicProfileController = require("../controllers/publicProfileController")
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

router
	.route("/")
	.get(
		publicProfileController.getAllPublicProfiles
	)

router
	.route("/myprofile")
	.get(
        verifyJWT,
		verifyRoles(ROLES_LIST.beneficiary, ROLES_LIST.donor),
		publicProfileController.getMyPublicProfile
	)
    .patch(
        verifyJWT,
        verifyRoles(ROLES_LIST.beneficiary, ROLES_LIST.donor),
        publicProfileController.updateMyPublicProfile
    )

router
	.route("/:userId")
	.get(
		publicProfileController.getPublicProfileByUser
	)

module.exports = router;