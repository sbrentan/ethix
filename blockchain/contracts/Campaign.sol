// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Campaign {
    // ====================================== STRUCTS ======================================

    struct Token {
        bytes32 tokenId;
        bool redeemed;
        uint256 value;
    }

    struct CampaignDetails {
        bytes32 campaignId;
        string title;
        uint256 startingDate; //timestamp format
        uint256 deadline; //timestamp format
        address payable donor;
        address payable beneficiary;
        uint256 initialDeposit; // initial deposit for the campaign
        uint256 refunds;
        uint256 donations;
        uint256 tokensCount;

        // TODO: move below
        bool refundClaimed;
        bool donationClaimed;
        bool funded;
        bool suspended; // TODO: add a flag to suspend the campaign
    }

    // ====================================== VARIABLES ======================================

    address public owner;
    
    // seed used to generate the tokens
    bytes32 private seed;

    // campaign details
    CampaignDetails private campaignDetails;

    // keep track of all tokens IDs
    bytes32[] private tokensIds;

    // keep track of all tokens
    mapping(bytes32 => Token) private tokens;

    // keep track of the gas fees
    uint256 public gasFeesStorage;
    uint256 constant public REDEEM_TOKEN_GAS_COST = 65000; // approximated gas cost to redeem a token
    uint24 constant public REDEEM_TOKEN_COST_MULTIPLIER = 2; // gas cost multiplier to be sure to have enough gas to redeem a token


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
        address _from
    ) external payable onlyOwner onlyDonor(_from) {

        // require the campaign is not already funded
        require(
            campaignDetails.funded == false,
            "Campaign has already been funded"
        );

        uint256 redeemTransactionCost = REDEEM_TOKEN_GAS_COST * REDEEM_TOKEN_COST_MULTIPLIER * tx.gasprice;
        gasFeesStorage = redeemTransactionCost * campaignDetails.tokensCount;

        require(
            msg.value > gasFeesStorage,
            "Insufficient funds to start the campaign"
        );

        // compute the initial deposit after subtracting the gas fees for the tokens redeem
        uint _initialDeposit = msg.value - gasFeesStorage;

        seed = _seed;
        campaignDetails.initialDeposit = _initialDeposit;
        campaignDetails.refunds = _initialDeposit;

        // generate tokens
        _generateTokens();
    }


    function getDetails() external view returns (CampaignDetails memory) {
        CampaignDetails memory _campaignDetails = campaignDetails;
        
        // filter out sensitive control booleans
        delete _campaignDetails.funded;
        delete _campaignDetails.refundClaimed;
        delete _campaignDetails.donationClaimed;
        delete _campaignDetails.suspended;
        
        return _campaignDetails;
    }


    // get the tokens of a campaign
    function getTokens(
        address _from
    )
        external
        view
        onlyOwner
        onlyDonor(_from)
        onlyFundedCampaign
        returns (Token[] memory)
    {
        Token[] memory _tokens = new Token[](campaignDetails.tokensCount);

        for (uint i = 0; i < campaignDetails.tokensCount; i++) {
            _tokens[i] = tokens[tokensIds[i]];
        }

        return _tokens;
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
        uint256 _refunds = 0;
        Token storage _token;

        for (uint i = 0; i < campaignDetails.tokensCount; i++) {
            _token = tokens[tokensIds[i]];
            if (!_token.redeemed) _refunds += _token.value;
        }

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
        uint256 _donations = 0;
        Token storage _token;

        for (uint i = 0; i < campaignDetails.tokensCount; i++) {
            _token = tokens[tokensIds[i]];
            if (_token.redeemed) _donations += _token.value;
        }

        // transfer the balance to the beneficiary
        campaignDetails.donations = _donations;
        campaignDetails.beneficiary.transfer(_donations);
        campaignDetails.donationClaimed = true;
    }


    // get the number of tokens redeemed
    function getRedeemedTokensCount() external view returns (uint256) {
        uint256 _redeemedTokens = 0;

        for (uint i = 0; i < campaignDetails.tokensCount; i++) {
            if (tokens[tokensIds[i]].redeemed)
                _redeemedTokens++;
        }

        return _redeemedTokens;
    }


    // allow users to reedem the tokens they bought
    function redeemToken(
        bytes32 tokenId
    ) external {
        
        require(isTokenValid(tokenId), "Token is not valid");

        // redeem the token
        tokens[tokenId].redeemed = true;
    }


    // check if a token is valid
    function isTokenValid(
        bytes32 tokenId
    ) public view returns (bool) {
        // check if the campaign contract has made the validation call
        if (msg.sender != owner) {
            return false;
        }

        // check if the campaign is live
        if (block.timestamp < campaignDetails.startingDate || block.timestamp >= campaignDetails.deadline) {
            return false;
        }

        // check if the campaign is funded
        if (!campaignDetails.funded) {
            return false;
        }

        Token memory token = tokens[tokenId];
        // check if the token exists
        if(token.tokenId == 0) {
            return false;
        }
        
        // check if the token has been redeemed
        if (token.redeemed) {
            return false;
        }

        return true;
    }


    // ====================================== UTILS FUNCTIONS ======================================


    function _generateTokens() private {
        uint256 _tokensCount = campaignDetails.tokensCount;
        bytes32 _campaignId = campaignDetails.campaignId;

        uint256 tokenValue = msg.value / _tokensCount;
        uint256 remainingValue = msg.value % _tokensCount;

        bytes32 tokenId;

        for (uint i = 0; i < _tokensCount; i++) {
            tokenId = _generateTokenId(_campaignId, i);
            tokens[tokenId] = Token(
                tokenId,
                false,
                (i == _tokensCount - 1 && remainingValue != 0) ? tokenValue + remainingValue : tokenValue
            );
            tokensIds.push(tokenId);
        }

        campaignDetails.funded = true;
    }


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
                    block.timestamp,
                    blockhash(block.number - 1),
                    msg.sender
                )
            );
    }
}
