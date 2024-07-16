// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Campaign {
    
    struct Token {
        bytes32 tokenId;
        bool redeemed;
        uint256 value;
    }

    struct CampaignDetails {
        bytes32 campaignId;
        string title;
        uint256 deadline; //timestamp format
        address payable donor;
        address payable beneficiary;
        uint256 initialDeposit; // initial deposit for the campaign
        uint256 refunds; 
        uint256 donations;
        bool refunded;
        bool donated;
        bool suspended; // to do: add a flag to suspend the campaign
        uint256 tokensCount;
    }

    CampaignDetails private campaignDetails;
    
    mapping(bytes32 => Token) private tokens;

    modifier onlyDonor(address sender) {
        require(sender == campaignDetails.donor, "Only the donor can perform this action");
        _;
    }

    modifier onlyBeneficiary(address sender) {
        require(sender == campaignDetails.beneficiary, "Only the beneficiary can perform this action");
        _;
    }

    modifier onlyLiveCampaign {
        require(block.timestamp < campaignDetails.deadline, "Campaign has ended");
        _;
    }

    modifier onlyEndedCampaign {
        require(block.timestamp >= campaignDetails.deadline, "Campaign is still live");
        _;
    }

    modifier onlyNotAlreadyRefunded {
        require(!campaignDetails.refunded, "Refunds already claimed");
        _;
    }

    modifier onlyNotAlreadyDonated {
        require(!campaignDetails.donated, "Donations already claimed");
        _;
    }

    function generateTokenIndex(
        bytes32 _campaignId, 
        uint256 _index
    ) private pure returns(bytes32) {
        return keccak256(abi.encodePacked(_campaignId, _index));
    }

    function generateTokenId(
        bytes32 _campaignId,
        uint256 _index,
        bytes32 _seed
    ) private view returns(bytes32) {
        return keccak256(abi.encodePacked(_campaignId, _index, _seed, block.timestamp, blockhash(block.number - 1), msg.sender));
    }

    function start(
        bytes32 _campaignId,
        string calldata _title,
        uint256 _deadline,
        address _donor,
        address _beneficiary,
        uint256 _tokensCount,
        bytes32 _seed
    ) external payable {

        campaignDetails.campaignId = _campaignId;
        campaignDetails.title = _title;
        campaignDetails.deadline = _deadline;
        campaignDetails.donor = payable(_donor);
        campaignDetails.beneficiary = payable(_beneficiary);
        campaignDetails.tokensCount = _tokensCount;
        campaignDetails.initialDeposit = msg.value;
        campaignDetails.refunds = msg.value;

        bytes32 tokenIndex;
        bytes32 tokenId;  

        if (msg.value % _tokensCount == 0) {

            // create all tokens with equal value
            for (uint i = 0; i < _tokensCount; i++) {
                tokenIndex = generateTokenIndex(_campaignId, i);
                tokenId = generateTokenId(_campaignId, i, _seed);
                tokens[tokenIndex] = Token(tokenId, false, msg.value / _tokensCount);
            }            

        } else {

            // create N-1 tokens with equal value
            for (uint i = 0; i < _tokensCount - 1; i++) {
                tokenIndex = generateTokenIndex(_campaignId, i);
                tokenId = generateTokenId(_campaignId, i, _seed);
                tokens[tokenIndex] = Token(tokenId, false, msg.value / _tokensCount);
            }

            // create the last token with the remaining value
            tokenIndex = generateTokenIndex(_campaignId, _tokensCount - 1);
            tokenId = generateTokenId(_campaignId, _tokensCount - 1, _seed);
            tokens[tokenIndex] = Token(tokenId, false, msg.value % _tokensCount);
        }
    }

    function getDetails() external view returns(CampaignDetails memory) {
        return campaignDetails;
    }

    // get the tokens of a campaign
    function getTokens(address _from) external view onlyDonor(_from) onlyLiveCampaign returns(Token[] memory) {
        Token[] memory _tokens = new Token[](campaignDetails.tokensCount);
        for (uint i = 0; i < campaignDetails.tokensCount; i++) {
            _tokens[i] = tokens[generateTokenIndex(campaignDetails.campaignId, i)];
        }
        return _tokens;
    }

    // allow the donor to claim the refund
    function claimRefund(address _from) external onlyDonor(_from) onlyEndedCampaign onlyNotAlreadyRefunded {
        // transfer the refunds to the donor
        campaignDetails.donor.transfer(campaignDetails.refunds);
        campaignDetails.refunded = true;
    }

    // allow the beneficiary to claim the donation
    function claimDonation(address _from) external onlyBeneficiary(_from) onlyEndedCampaign onlyNotAlreadyDonated {
        // transfer the balance to the beneficiary
        campaignDetails.beneficiary.transfer(campaignDetails.donations);
        campaignDetails.donated = true;
    }

    // allow users to reedem the tokens they bought
    function redeemToken(bytes32 tokenId) external onlyLiveCampaign {

        // get the token from the mapping
        for (uint i = 0; i < campaignDetails.tokensCount; i++) {
            Token storage token = tokens[generateTokenIndex(campaignDetails.campaignId, i)];
            if (token.tokenId == tokenId) {
                
                // require that the token has not been redeemed yet
                require(!token.redeemed, "Token already redeemed");

                // mark the token as redeemed
                token.redeemed = true;
                campaignDetails.donations += token.value;
                campaignDetails.refunds -= token.value;
                break;
            }
        }
    }

    function getBalance() external view returns(uint256, uint256, uint256) {
        return (address(this).balance, campaignDetails.refunds, campaignDetails.donations);
    }
}