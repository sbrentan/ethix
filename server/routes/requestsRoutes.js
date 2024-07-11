const express = require("express");
const router = express.Router();
const requestsController = require("../controllers/requestsController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
	.route("/profiles")
	.get(
		verifyRoles(ROLES_LIST.admin),
		requestsController.getAllRequests
	)
	.patch(
		verifyRoles(ROLES_LIST.admin),
		requestsController.updateUser
	)
	// .delete(
	// 	verifyRoles(ROLES_LIST.admin),
	// 	requestsController.deleteUser
	// );
router
	.route("/myprofile")
	.get(
		verifyRoles(ROLES_LIST.beneficiary, ROLES_LIST.donor),
		requestsController.getMyLastProfileRequest
	)
    .post(
        verifyRoles(ROLES_LIST.beneficiary, ROLES_LIST.donor),
        requestsController.createMyNewRequest
    )

module.exports = router;