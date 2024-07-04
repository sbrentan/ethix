const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/verifyRoles");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
	.route("/")
	.get(
		verifyRoles(ROLES_LIST.admin),
		usersController.getAllUsers
	)
	.post(
		verifyRoles(ROLES_LIST.admin),
		usersController.createNewUser
	)
	.patch(
		verifyRoles(ROLES_LIST.admin),
		usersController.updateUser
	)
	.delete(
		verifyRoles(ROLES_LIST.admin),
		usersController.deleteUser
	);

module.exports = router;
