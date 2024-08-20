const mongoose = require("mongoose");

// TODO: CONFILCT ON USER (name, mail -> username)
const donorSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
        companyName: {
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
        businessType: {
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
    donorSchema,
    Donor: mongoose.model("Donor", donorSchema)
}