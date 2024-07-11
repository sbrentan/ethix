const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true
		},
        image: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        deadline: {
            type: Date,
            required: true
        },
        isLive: {
            type: Boolean,
            required: true,
            default: false
        },
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Donor",
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Beneficiary",
        },
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("Campaign", CampaignSchema);



// struct Campaign {
//     string title;
//     string image;
//     string description;
//     uint256 deadline; //timestamp format
//     bool isLive;
//     address donor;
//     address receiver;
//     uint256 balance;
//     uint256 deposit;
//     Token[] tokens;
// }
