const mongoose = require("mongoose");
const ROLES_LIST = require("../config/roles_list");

// TODO: CONFILCT ON USER (name, mail -> username)
const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: Object.values(ROLES_LIST),
			default: ROLES_LIST.user,
		},
		verified: {
			type: Boolean,
			default: false,
		},
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("User", userSchema);
