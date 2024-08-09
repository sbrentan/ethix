// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

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
        bytes32 campaignId;
        string title;
        uint256 startingDate; //timestamp format
        uint256 deadline; //timestamp format
        address payable donor;
        address payable beneficiary;
        uint256 tokensCount;
        uint256 initialDeposit; // initial deposit for the campaign
        uint256 refunds;
        uint256 donations;
    }

    // ====================================== VARIABLES ======================================

    address public owner;

    // is the public wallet address used to verify the authenticity of the tokens generated
    address private walletAddress;

    bool private refundClaimed;
    bool private donationClaimed;
    bool private funded;
    bool private suspended; // TODO: add a flag to suspend the campaign

    // seed used to generate the tokens
    bytes32 private seed;

    // campaign details
    CampaignDetails private campaignDetails;

    // keep track of sensitive token info
    TokenBlock private tokenBlock;

    // keep track of all tokens redeeming status (redeemed or not)
    uint256 public redeemedTokensCount;
    mapping(bytes32 => bool) private tokens;

    // keep track of the gas fees
    uint256 public gasFeesStorage;
    uint256 public constant REDEEM_TOKEN_GAS_COST = 65000; // approximated gas cost to redeem a token
    uint24 public constant REDEEM_TOKEN_COST_MULTIPLIER = 2; // gas cost multiplier to be sure to have enough gas to redeem a token

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
        require(funded, "Campaign has not been funded yet");
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
        require(!refundClaimed, "Refunds already claimed");
        _;
    }

    modifier onlyNotDonated() {
        require(!donationClaimed, "Donations already claimed");
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
        uint256 _tokensCount
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
    }


    function start(
        bytes32 _seed,
        address _walletAddress,
        address _from
    ) external payable onlyOwner onlyDonor(_from) {
        // require the campaign is not already funded
        require(!funded, "Campaign has already been funded");

        /*uint256 redeemTransactionCost = REDEEM_TOKEN_GAS_COST * REDEEM_TOKEN_COST_MULTIPLIER * tx.gasprice;
        gasFeesStorage = redeemTransactionCost * campaignDetails.tokensCount;

        require(
            msg.value > gasFeesStorage,
            "Insufficient funds to start the campaign"
        );*/

        // compute the initial deposit after subtracting the gas fees for the tokens redeem
        uint _initialDeposit = msg.value; // - gasFeesStorage;

        seed = _seed;
        walletAddress = _walletAddress;
        campaignDetails.initialDeposit = _initialDeposit;
        campaignDetails.refunds = _initialDeposit;

        // saves information for future token generation
        tokenBlock.blockNumber = block.number - 1;
        tokenBlock.blockTimestamp = block.timestamp;

        // set the campaign as funded
        funded = true;
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
        if (redeemedTokensCount < campaignDetails.tokensCount)
            _refunds =
                _lastTokenValue +
                (_tokenValue *
                    ((campaignDetails.tokensCount - 1) - redeemedTokensCount));

        // transfer the refunds to the donor
        campaignDetails.refunds = _refunds;
        campaignDetails.donor.transfer(_refunds);
        refundClaimed = true;
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
        if (redeemedTokensCount < campaignDetails.tokensCount)
            _donations = _tokenValue * redeemedTokensCount;

        // transfer the balance to the beneficiary
        campaignDetails.donations = _donations;
        campaignDetails.beneficiary.transfer(_donations);
        donationClaimed = true;
    }

    // allow users to reedem the tokens they bought
    function redeemToken(
        bytes32 t2_token,
        Signature calldata _signature
    ) external {
        require(isTokenValid(t2_token, _signature), "Token is not valid");

        // redeem the token
        tokens[t2_token] = true;
        redeemedTokensCount += 1;
    }

    // check if a token is valid
    function isTokenValid(
        bytes32 t2_token,
        Signature calldata _signature
    ) public view returns (bool) {
        // check if the campaign contract has made the validation call
        if (msg.sender != owner) {
            return false;
        }

        // check if the campaign is live
        if (
            block.timestamp < campaignDetails.startingDate ||
            block.timestamp >= campaignDetails.deadline
        ) {
            return false;
        }

        // check if the campaign is funded
        if (!funded) {
            return false;
        }

        // check if the token is generated by the campaign wallet
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
    ) external view onlyOwner returns (bytes32) {
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
        return
            ecrecover(
                _prefixedHash,
                _signature.v,
                _signature.r,
                _signature.s
            ) == _sender;
    }
}
