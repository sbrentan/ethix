const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const ROLES_LIST = require("../config/roles_list");
const ProfileRequest = require("../models/ProfileRequest");

// @desc Get all requests
// @route GET /requests
// @access Private: manager, admin
const getAllRequests = asyncHandler(async (req, res) => {
	const requests = await ProfileRequest.find().lean();
	if (!requests?.length) {
		return res.status(400).json({ message: "No requests found" });
	}
	res.json(requests);
});

// @desc Update a request
// @route PATCH /requests/profile
// @access Private: manager, admin
const updateUser = asyncHandler(async (req, res) => {
	const { id, state } = req.body;

	// Confirm data
	if (!id || !state) {
		return res
			.status(400)
			.json({ message: "Some required fields are missing" });
	}

	const request = await ProfileRequest.findById(id).exec();

	if (!request) {
		return res.status(400).json({ message: "Request not found" });
	}

	if (!["rejected", "accepted", "waiting"].includes(state)) {
		res.status(409).json({ message: "Invalid state" });
	}

	request.state = state;

	const updatedRequest = await request.save();

	if (updatedRequest.state === "accepted") {
		const user = await User.findById(
			updatedRequest.user._id.toString()
		).exec();
		user.verified = true;
		const updatedUser = await user.save();
	}

	res.json({ message: `Request updated` });
});

const getMyLastProfileRequest = asyncHandler(async (req, res) => {
	const reqUsername = req.user;

	try {
		const latestProfileRequest = await ProfileRequest.findOne({ username: reqUsername })
			.sort({ createdAt: -1 })
			.exec();

		if (latestProfileRequest) {
			res.json(latestProfileRequest);
		} else {
			res.status(404).json({ message: "No request found" });
		}
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

const createMyNewRequest = asyncHandler(async (req, res) => {
    const username = req.user;
    const values = {...req.body}

    // Check for duplicate
    const user = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (!user) {
        return res.status(500).json({ message: 'Something went wrong' })
    } else {
        // create the new profile request for the admin
        console.log(user)
        console.log(user._id.toString())

        // do I fill the donorSchema or beneficiarySchema?
        const donorData = user.role === ROLES_LIST.donor ? {...values, user: user._id.toString()} : undefined
        const beneficiaryData = user.role === ROLES_LIST.beneficiary ? {...values, user: user._id.toString()} : undefined
        const request = await ProfileRequest.create({ user: user._id.toString(), username, role: user.role, donorData, beneficiaryData})
    }

    res.status(200).json({ message: `New Request created!` });
})

module.exports = {
	getAllRequests,
	updateUser,
    getMyLastProfileRequest,
    createMyNewRequest
	// deleteUser,
};
