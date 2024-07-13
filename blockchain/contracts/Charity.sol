// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Charity {

    // These are events to be emitted when specific actions are completed
    event OrganizationVerified(address organization, bool status);
    event OrganizationRevoked(address organization, bool status);
    event CampaignStarted(bytes32 campaignId, address donor);
    event TokenRedeemed(bytes32 campaignId, bytes32 tokenId);
    event RefundClaimed(bytes32 campaignId, address donor, uint256 amount);
    event DonationClaimed(bytes32 campaignId, address beneficiary, uint256 amount);

    address owner;
    bytes32[] public campaignsIds;

    struct Token {
        bytes32 tokenId;
        bool redeemed;
        uint256 value;
    }

    struct Campaign {
        string title;
        string description;
        uint256 deadline; //timestamp format
        bool exists;
        address payable donor;
        address payable beneficiary;
        uint256 balance;
        uint256 refund;
        uint256 deposit;
        Token[] tokens;
    }

    constructor() {
        owner = msg.sender;
    }

    // keep track of verified organizations
    mapping(address => bool) public verifiedOrganizations;

    // keep track of created campaigns using a unique ID
    mapping(bytes32 => Campaign) public campaigns;

    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyDonor(bytes32 campaignId) {
        require(msg.sender == campaigns[campaignId].donor, "Only the donor can perform this action");
        _;
    }

    modifier onlyVerifiedBeneficiary(address beneficiary) {
        require(verifiedOrganizations[beneficiary], "Beneficiary is not a verified organization");
        _;
    }

    modifier onlyLiveCampaign(bytes32 campaignId) {
        require(block.timestamp < campaigns[campaignId].deadline, "Campaign has ended");
        _;
    }

    modifier onlyEndedCampaign(bytes32 campaignId) {
        require(block.timestamp >= campaigns[campaignId].deadline, "Campaign is still live");
        _;
    }

    // only admin can verify or revoke organizations
    function verifyOrganization(address _organization) public onlyOwner {
        verifiedOrganizations[_organization] = true;
        emit OrganizationVerified(_organization, true);
    }

    function revokeOrganization(address _organization) public onlyOwner {
        verifiedOrganizations[_organization] = false;
        emit OrganizationRevoked(_organization, false);
    }

    // check if an organization is verified
    function isOrganizationVerified(address _organization) public view returns (bool) {
        return verifiedOrganizations[_organization];
    }

    // generate a unique ID for a campaign from its title, description and creator address
    function generateCampaignId(
        address _donor, 
        address _beneficiary,
        string calldata _title, 
        string calldata _description
    ) private view returns(bytes32) {
        return keccak256(abi.encodePacked(_title, _description, _donor, _beneficiary, campaignsIds.length));
    }

    // generate a unique ID for a token from its campaign ID and index
    function generateTokenId(
        bytes32 _campaignId, 
        uint256 _index
    ) private pure returns(bytes32) {
        return keccak256(abi.encodePacked(_campaignId, _index));
    }

    // create a new campaign for a verified organization 
    function startCampaign(
        string calldata _title, 
        string calldata _description, 
        uint256 _deadline,
        uint256 _tokenCounts,
        address _beneficiary
    ) public payable onlyVerifiedBeneficiary(_beneficiary) { 
        // generate a unique ID for the campaign
        bytes32 campaignId = generateCampaignId(msg.sender, _beneficiary, _title, _description);

        // get a reference to the campaign with the generated Id
        Campaign storage campaign = campaigns[campaignId];

        // require that the campaignId doesn't exist in the mapping
        require(!campaign.exists, "Campaign already exists");

        // set the campaign properties
        campaignsIds.push(campaignId);
        campaign.title = _title;
        campaign.description = _description;
        campaign.deadline = _deadline;
        campaign.exists = true;
        campaign.donor = payable(msg.sender);
        campaign.beneficiary = payable(_beneficiary);
        campaign.deposit = msg.value;
        campaign.refund = msg.value;

        // create tokens with equal value for the campaign
        for (uint i = 0; i < _tokenCounts - 1; i++) {
            bytes32 tokenId = generateTokenId(campaignId, i);
            campaign.tokens.push(Token(tokenId, false, msg.value / _tokenCounts));
        }

        // create the last token with the remaining value
        campaign.tokens.push(Token(generateTokenId(campaignId, _tokenCounts - 1), false, msg.value % _tokenCounts));

        // emit the CampaignStarted event
        emit CampaignStarted(campaignId, msg.sender);
    }

    // get the tokens of a campaign
    function getCampaignTokens(bytes32 campaignId) public view onlyLiveCampaign(campaignId) onlyDonor(campaignId) returns(Token[] memory) {
        return campaigns[campaignId].tokens;
    }

    // returns the IDs of all campaigns
    function getCampaignsIds() public view returns(bytes32[] memory) {
        return campaignsIds;
    }

    // returns the details of an active campaign given the campaignId
    function getCampaign(bytes32 campaignId) public view returns(Campaign memory) {
        
        // retrieve a copy of the campaign with the given ID
        Campaign memory campaign = campaigns[campaignId];

        // remove the token array from the campaign before returning it
        delete campaign.tokens;

        return campaign;
    }

    // allow the donor to claim the refund
    function claimRefund(bytes32 campaignId) public onlyEndedCampaign(campaignId) onlyDonor(campaignId) {

        // get a reference to the campaign with the given ID
        Campaign storage campaign = campaigns[campaignId];

        // require that the refund is available
        require(campaign.refund > 0, "No refund available");

        // transfer the balance to the donor
        campaign.donor.transfer(campaign.refund);
        campaign.refund = 0;

        emit RefundClaimed(campaignId, campaign.donor, campaign.deposit - campaign.balance);
    }

    // allow the beneficiary to claim the donation
    function claimDonation(bytes32 campaignId) public onlyEndedCampaign(campaignId) {
        
        // get a reference to the campaign with the given ID
        Campaign storage campaign = campaigns[campaignId];
        
        // require that the sender is the beneficiary of the campaign
        require(msg.sender == campaign.beneficiary, "Only the beneficiary can claim the donation");

        // require that the balance is available
        require(campaign.balance > 0, "No donation available");

        // transfer the balance to the beneficiary
        campaign.beneficiary.transfer(campaign.balance);
        campaign.balance = 0;

        emit DonationClaimed(campaignId, campaign.beneficiary, campaign.balance);
    }

    // allow users to reedem the tokens they bought
    function redeemToken(bytes32 campaignId, bytes32 tokenId) public onlyLiveCampaign(campaignId) {

        // retrieve the campaign with the given ID
        Campaign storage campaign = campaigns[campaignId];
        
        for (uint i = 0; i < campaign.tokens.length; i++) {
            if (campaign.tokens[i].tokenId == tokenId) {

                // require that the token has not been redeemed yet
                require(!campaign.tokens[i].redeemed, "Token already redeemed");

                // mark the token as redeemed and change the owner to the beneficiary
                campaign.tokens[i].redeemed = true;
                campaign.balance += campaign.tokens[i].value;
                campaign.refund -= campaign.tokens[i].value;

                // emit the TokenRedeemed event
                emit TokenRedeemed(campaignId, tokenId);

                break;
            }
        }
    }
}