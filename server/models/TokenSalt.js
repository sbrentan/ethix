const mongoose = require("mongoose");

const TokenSaltSchema = new mongoose.Schema(
	{
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Campaign",
        },
        hash: {
            type: String,
            required: true,
        },
        salt: {
            type: String,
            required: true,
        },
        redeemed: {
            type: Boolean,
            default: false,
        },
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("TokenSalt", TokenSaltSchema);
