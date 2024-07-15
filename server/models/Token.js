const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
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
        redeemed: {
            type: Boolean,
            required: true,
            default: false
        }
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("Token", TokenSchema);
