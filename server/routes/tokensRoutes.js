const express = require("express");
const router = express.Router();
const tokensController = require("../controllers/tokensController");

router
	.route("/redeem")
    .post(
        tokensController.redeemToken
    )

module.exports = router;