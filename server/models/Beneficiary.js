const mongoose = require("mongoose");

// TODO: CONFILCT ON USER (name, mail -> username)
const beneficiarySchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
        beneficiaryName: {
            type: String,
            required: true,
        },
        ownerName: {
            type: String,
            required: true,
        },
        contactNumber: {
            type: String,
            required: true,
        },
        organizationType: {
            type: String,
            required: true,
        },
        // others to add...
	},
    {
		timestamps: true,
	}
);

module.exports = {
    beneficiarySchema,
    Beneficiary: mongoose.model("Beneficiary", beneficiarySchema)
}