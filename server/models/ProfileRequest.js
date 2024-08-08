const mongoose = require("mongoose");
const ROLES_LIST = require("../config/roles_list");

// I import the schema of the model of the actual profile, it might be that they will have more fields than what is required for the registration, in that case it will require to split them

const { donorSchema } = require("./Donor")
const { beneficiarySchema } = require("./Beneficiary")

// TODO: CONFILCT ON USER (name, mail -> username)
const profileRequestSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		username: {
			type: String,
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: [ROLES_LIST.donor, ROLES_LIST.beneficiary],
			required: true,
		},
		state: {
			type: String,
            enum: ["rejected", "accepted", "waiting"],
			default: "waiting",
		},
        donorData: {
            type: donorSchema,
            required: false,
        },
        beneficiaryData: {
            type: beneficiarySchema,
            required: false,
        }
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("ProfileRequest", profileRequestSchema);