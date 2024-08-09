const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const ROLES_LIST = require("../config/roles_list");

// @desc Get all users
// @route GET /users
// @access Private: manager, admin
const getAllUsers = asyncHandler(async (req, res) => {
	const users = await User.find().select("-password").lean();
	if (!users?.length) {
		return res.status(400).json({ message: "No users found" });
	}
	res.json(users);
});
// @desc Get beneficiaries
// @route GET /users/beneficiaries
// @access Private: donor
const getBeneficiaryUser = asyncHandler(async (req, res) => {
	const users = await User.find({role: "Beneficiary"}).select("-password").lean();
	if (!users?.length) {
		return res.status(400).json({ message: "No beneficiaries found" });
	}
	res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private: office, manager, admin
const createNewUser = asyncHandler(async (req, res) => {
	const { username, password, role } = req.body;

	// Confirm data
	if (!username || !password) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Check for duplicate
	const duplicate = await User.findOne({ username })
		.collation({ locale: "en", strength: 2 })
		.lean()
		.exec();

	if (duplicate) {
		return res.status(409).json({ message: "Duplicate username" });
	}

	// Hash password
	const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

	let assignedRole = role
	// default role is user (we still pass)
	if (role) {
		if (!Object.values(ROLES_LIST).includes(role))
			// check role valid
			return res.status(409).json({ message: "Invalid role" });
	} else {
		assignedRole = ROLES_LIST.user;
	} // if pass the cycle the role is well defined

	// Create and store new user
	const user = await User.create({ username, password: hashedPwd, role: assignedRole });

	if (user) {
		// created
		res.status(201).json({ message: `New user ${username} created` });
	} else {
		res.status(500).json({ message: "Something went wrong!" });
	}
});

// @desc Update a user
// @route PATCH /users
// @access Private: manager, admin
const updateUser = asyncHandler(async (req, res) => {
	const { id, username, role, password, verified } = req.body;

	// Confirm data
	if (!id) {
		return res.status(400).json({ message: "Id is required" });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "User not found" });
	}

	if (username) {
		// Check for duplicate
		const duplicate = await User.findOne({ username })
			.collation({ locale: "en", strength: 2 })
			.lean()
			.exec();

		// Allow updates to the original user
		if (duplicate && duplicate?._id.toString() !== id) {
			return res.status(409).json({ message: "Duplicate username" });
		}
		user.username = username;
	}
	
    // we dont want the user to send for each update the role
	if (role) {
		if (!Object.values(ROLES_LIST).includes(role))
			// check role valid
			return res.status(409).json({ message: "Invalid role" });
		user.role = role;
	}

    // we dont want the user to send for each update the active
	if (typeof verified === 'boolean') {
		user.verified = verified;
	}

	// we dont want the user to send for each update the password
	if (password) {
		// Hash password
		user.password = await bcrypt.hash(password, 10); // salt rounds
	}

	const updatedUser = await user.save();

	res.json({ message: `User: ${updatedUser.username} updated` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private: manager, admin
const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: "User ID Required" });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "User not found" });
	}

	const result = await user.deleteOne();

	const reply = `User: ${result.username} deleted`;

	res.json({ message: reply });
});

module.exports = {
	getAllUsers,
	getBeneficiaryUser,
	createNewUser,
	updateUser,
	deleteUser
};
