// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Campaign {
    // ====================================== STRUCTS ======================================

    struct TokenBlock {
        uint256 blockNumber;
        uint256 blockTimestamp;
    }

    // create bytes65 type for signature
    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    struct CampaignDetails {

        // campaign initial details
        bytes32 campaignId;
        string title;
        uint256 startingDate; //timestamp format
        uint256 deadline; //timestamp format
        address payable donor;
        address payable beneficiary;
        uint256 tokensCount;
        uint256 maxTokensCount;
        
        // campaign status information
        uint256 initialDeposit;
        uint256 refunds;
        uint256 donations;
        bool refundClaimed;
        bool donationClaimed;
        bool funded;
        uint256 redeemedTokensCount;
    }

    // ====================================== VARIABLES ======================================

    address public owner;

    // is the public wallet address used to verify the authenticity of the tokens generated
    address private walletAddress;

    // seed used to generate the tokens
    bytes32 private seed;

    // campaign details
    CampaignDetails private campaignDetails;

    // keep track of sensitive token info
    TokenBlock private tokenBlock;

    // keep track of all tokens redeeming status (redeemed or not)
    mapping(bytes32 => bool) private tokens;

    // ====================================== MODIFIERS ======================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyDonor(address sender) {
        require(
            sender == campaignDetails.donor,
            "Only the donor can perform this action"
        );
        _;
    }

    modifier onlyBeneficiary(address sender) {
        require(
            sender == campaignDetails.beneficiary,
            "Only the beneficiary can perform this action"
        );
        _;
    }

    modifier onlyFundedCampaign() {
        require(campaignDetails.funded, "Campaign has not been funded yet");
        _;
    }

    modifier onlyLiveCampaign() {
        require(
            campaignDetails.startingDate <= block.timestamp,
            "Campaign has not started yet"
        );
        require(
            block.timestamp < campaignDetails.deadline,
            "Campaign has ended"
        );
        _;
    }

    modifier onlyEndedCampaign() {
        require(
            block.timestamp >= campaignDetails.deadline,
            "Campaign is still live"
        );
        _;
    }

    modifier onlyNotRefunded() {
        require(!campaignDetails.refundClaimed, "Refunds already claimed");
        _;
    }

    modifier onlyNotDonated() {
        require(!campaignDetails.donationClaimed, "Donations already claimed");
        _;
    }

    // ====================================== FUNCTIONS ======================================

    constructor(
        bytes32 _campaignId,
        string memory _title,
        uint256 startingDate,
        uint256 _deadline,
        address _donor,
        address _beneficiary,
        uint256 _tokensCount,
        uint256 _maxTokensCount
    ) {
        // saving charity contract address
        owner = msg.sender;

        campaignDetails.campaignId = _campaignId;
        campaignDetails.title = _title;
        campaignDetails.deadline = _deadline;
        campaignDetails.startingDate = startingDate;
        campaignDetails.donor = payable(_donor);
        campaignDetails.beneficiary = payable(_beneficiary);
        campaignDetails.tokensCount = _tokensCount;
        campaignDetails.maxTokensCount = _maxTokensCount;
    }


    function start(
        bytes32 _seed,
        address _walletAddress,
        address _from
    ) external payable onlyOwner onlyDonor(_from) {
        // require the campaign is not already funded
        require(!campaignDetails.funded, "Campaign has already been funded");

        seed = _seed;
        walletAddress = _walletAddress;
        campaignDetails.initialDeposit = msg.value;
        campaignDetails.refunds = msg.value;

        // saves information for future token generation
        tokenBlock.blockNumber = block.number - 1;
        tokenBlock.blockTimestamp = block.timestamp;

        // set the campaign as funded
        campaignDetails.funded = true;
    }

    function setWalletAddress(address _walletAddress) external onlyOwner {
        walletAddress = _walletAddress;
    }


    function getDetails() external view returns (CampaignDetails memory) {
        return campaignDetails;
    }


    // allow the donor to claim the refund
    function claimRefund(
        address _from
    )
        external
        onlyOwner
        onlyDonor(_from)
        onlyEndedCampaign
        onlyNotRefunded
        onlyFundedCampaign
    {
        uint256 _tokenValue = campaignDetails.initialDeposit /
            campaignDetails.tokensCount;
        uint256 _lastTokenValue = (campaignDetails.initialDeposit %
            campaignDetails.tokensCount) + _tokenValue;

        uint256 _refunds = 0;
        if (campaignDetails.redeemedTokensCount < campaignDetails.tokensCount)
            _refunds =
                _lastTokenValue +
                (_tokenValue *
                    ((campaignDetails.tokensCount - 1) - campaignDetails.redeemedTokensCount));

        // transfer the refunds to the donor
        campaignDetails.refunds = _refunds;
        campaignDetails.donor.transfer(_refunds);
        campaignDetails.refundClaimed = true;
    }


    // allow the beneficiary to claim the donation
    function claimDonation(
        address _from
    )
        external
        onlyOwner
        onlyBeneficiary(_from)
        onlyEndedCampaign
        onlyNotDonated
        onlyFundedCampaign
    {
        uint256 _tokenValue = campaignDetails.initialDeposit /
            campaignDetails.tokensCount;

        uint256 _donations = campaignDetails.initialDeposit;
        if (campaignDetails.redeemedTokensCount < campaignDetails.tokensCount)
            _donations = _tokenValue * campaignDetails.redeemedTokensCount;

        // transfer the balance to the beneficiary
        campaignDetails.donations = _donations;
        campaignDetails.beneficiary.transfer(_donations);
        campaignDetails.donationClaimed = true;
    }

    function redeemTokensBatch(
        bytes32[] calldata _tokens,
        Signature[] calldata _signatures
    ) external {
        require(
            _tokens.length == _signatures.length,
            "Tokens and signatures length mismatch"
        );

        require (
            campaignDetails.redeemedTokensCount + _tokens.length <= campaignDetails.tokensCount,
            "Redeemed tokens count exceeds the total tokens count"
        );

        for (uint256 i = 0; i < _tokens.length; i++) {

            bytes32 t2_token = generateTokenHash(_tokens[i]);
            require(isTokenValid(_tokens[i], _signatures[i]), "Token is not valid");

            // redeem the token
            tokens[t2_token] = true;
        }
        
        campaignDetails.redeemedTokensCount += _tokens.length;
    }

    // check if a token is valid
    function isTokenValid(
        bytes32 t15_token,
        Signature calldata _signature
    ) public view returns (bool) {
        // check if the campaign contract has made the validation call
        if (msg.sender != owner) {
            return false;
        }

        console.log('t15_token: ');
        console.logBytes(abi.encodePacked(t15_token));

        console.log('starting_date: ');
        console.log(campaignDetails.startingDate);
        console.log('deadline: ');
        console.log(campaignDetails.deadline);
        console.log('block.timestamp: ');
        console.log(block.timestamp);

        // check if the campaign is live
        if (
            block.timestamp < campaignDetails.startingDate ||
            block.timestamp >= campaignDetails.deadline
        ) {
            return false;
        }

        console.log('funded: ');
        console.log(campaignDetails.funded);

        // check if the campaign is funded
        if (!campaignDetails.funded) {
            return false;
        }

        console.log('walletAddress: ');
        console.log(walletAddress);

        // check if the token is generated by the campaign wallet
        bytes32 t2_token = generateTokenHash(t15_token);
        console.log('t2_token: ');
        console.logBytes(abi.encodePacked(t2_token));

        console.log('campaignId: ');
        console.logBytes(abi.encodePacked(campaignDetails.campaignId));

        console.log('encode packed: ');
        console.logBytes(abi.encodePacked(t2_token, campaignDetails.campaignId));
        if (
            !_signatureVerified(
                keccak256(
                    abi.encodePacked(t2_token, campaignDetails.campaignId)
                ),
                _signature,
                walletAddress
            )
        ) {
            return false;
        }

        // check if the token has already been redeemed
        if (tokens[t2_token]) {
            return false;
        }

        return true;
    }

    function generateTokenHash(
        bytes32 _rawToken
    ) public view onlyOwner returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _rawToken,
                    seed,
                    tokenBlock.blockTimestamp,
                    blockhash(tokenBlock.blockNumber)
                )
            );
    }


    // ====================================== UTILS FUNCTIONS ======================================

    function _generateTokenId(
        bytes32 _campaignId,
        uint256 _index
    ) private view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _campaignId,
                    _index,
                    seed,
                    tokenBlock.blockTimestamp,
                    blockhash(tokenBlock.blockNumber)
                )
            );
    }

    function _signatureVerified(
        bytes32 _commitHash,
        Signature calldata _signature,
        address _sender
    ) private pure returns (bool) {
        bytes32 _prefixedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _commitHash)
        );
        console.log('commitHash: ');
        console.logBytes(abi.encodePacked(_commitHash));
        return
            ecrecover(
                _prefixedHash,
                _signature.v,
                _signature.r,
                _signature.s
            ) == _sender;
    }
}
