const mongoose = require("mongoose");

const RedeemableTokenSchema = new mongoose.Schema(
	{
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Campaign",
        },
        token: {
            type: String,
            required: true,
        },
        signature: {
            type: String,
            required: true,
        }
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("RedeemableToken", RedeemableTokenSchema);
