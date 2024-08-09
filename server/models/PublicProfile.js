const mongoose = require("mongoose");

// this are data of donor and beneficiary public and accessible for everyone
const publicProfileScheme = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
        publicName: {
            type: String,
			required: false,
        },
        publicDescription: {
            type: String,
			required: false,
        },
        publicImage: {
            type: String,
			required: false,
        }
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("PublicProfile", publicProfileScheme);