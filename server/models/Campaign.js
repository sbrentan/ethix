const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
	{
        // Save who generated the campaign
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
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
        // The target amount of the campaign donation
        targetEur: {
            type: Number,
            required: true
        },
        // TODO: still needed?
        // The amount of money each redeemable token donates. Initially empty, will be filled when the campaign is created on the blockchain.
        tokenDonation: {
            type: Number,
            required: false
        },
        // The number of tokens to generate
        tokensCount: {
            type: Number,
            required: true
        },
        maxTokensCount: {   // The maximum number of tokens that can be generated
            type: Number,
            required: true
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
        // The start of the campaign (equal to the startingDate stored in the contract)
        startingDate: {
            type: Date,
            required: true
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
        // batchRedeem is the number of tokens that will be redeemed at once
        batchRedeem: {
            type: Number,
            required: true
        },
        // total redeemable tokens count saved on db
        redeemableTokens: {
            type: Number,
            required: false,
            default: 0
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
