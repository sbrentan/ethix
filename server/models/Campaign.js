const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
	{
        // Blockchain campaign id. Initially empty, will be filled when the campaign is created on the blockchain. 
        campaignId: {
            type: String,
            required: false
        },
        // The target amount of the campaign donation
        target: {
            type: Number,
            required: true
        },
        // The amount of money each redeemable token donates. Initially empty, will be filled when the campaign is created on the blockchain.
        tokenDonation: {
            type: Number,
            required: false
        },
        // The image url of the campaign
        image: {
            type: String,
            required: false
        },
        // The title of the campaign (equal to the title stored in the contract)
		title: {
			type: String,
			required: true
		},
        // The description of the campaign
        description: {
            type: String,
            required: false
        },
        // The deadline of the campaign (equal to the deadline stored in the contract)
        deadline: {
            type: Date,
            required: true
        },
        // The donor user id        
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Donor",
        },
        // The receiver user id
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Beneficiary",
        },
        seed: {
            type: String,
            required: true
        },
        blockNumber: {
            type: Number,
            required: true
        }
	},
    {
		timestamps: true,
	}
);

module.exports = mongoose.model("Campaign", CampaignSchema);
