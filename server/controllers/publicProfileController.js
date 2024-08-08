const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const PublicProfile = require("../models/PublicProfile");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const getAllPublicProfiles = asyncHandler(async (req, res) => {
	const profiles = await PublicProfile.find().lean();
	if (!profiles?.length) {
		return res.status(400).json({ message: "No profiles found" });
	}
	res.json(profiles);
});

const getMyPublicProfile = asyncHandler(async (req, res) => {
	const username = req.user;

	const user = await User.findOne({ username })
		.collation({ locale: "en", strength: 2 })
		.lean()
		.exec();

	// Convert the userId string to an ObjectId
	const userObjectId = new ObjectId(user._id);

	const profile = await PublicProfile.findOne({ user: userObjectId }).exec();

	if (profile) {
		res.json(profile);
	} else {
		return res.status(404).json({ message: "No request found" });
	}
});

const getPublicProfileByUser = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	if (!userId)
		return res
			.status(400)
			.json({ message: "Some required fields are missing" });

	// Convert the userId string to an ObjectId
	try {
		const userObjectId = new ObjectId(userId.toString());

		const profile = await PublicProfile.findOne({
			user: userObjectId,
		}).exec();

		if (profile) {
			res.json(profile);
		} else {
			return res.status(404).json({ message: "No request found" });
		}
	} catch (err) {
        console.log(err.message)
		return res.status(500).json({ message: "Something went wrong" });
	}
});

const updateMyPublicProfile = asyncHandler(async (req, res) => {
	const username = req.user;
	const { publicName, publicDescription, publicImage, profileId } = req.body;

	if (!profileId)
		return res
			.status(400)
			.json({ message: "Some required fields are missing" });

	const user = await User.findOne({ username })
		.collation({ locale: "en", strength: 2 })
		.lean()
		.exec();

	if (!user) {
		return res.status(500).json({ message: "Something went wrong" });
	}

	const profile = await PublicProfile.findById(profileId).exec();

	if (!profile || profile.user.toString() !== user._id.toString()) {
		return res.status(500).json({ message: "Something went wrong" });
	}

	if (publicName) profile.publicName = publicName;
	if (publicDescription) profile.publicDescription = publicDescription;
	if (publicImage) profile.publicImage = publicImage;

	const updatedprofile = await profile.save();

	res.json({ message: `Profile: ${updatedprofile.publicName} updated` });
});

module.exports = {
	getAllPublicProfiles,
	getMyPublicProfile,
	updateMyPublicProfile,
	getPublicProfileByUser,
};
