// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Charity {

    // These are events to be emitted when specific actions are completed
    event AdminAdded(address admin);
    event AdminRemoved(address admin);
    event OrganizationVerified(address organization);
    event OrganizationRevoked(address organization);
    event CampaignStarted(bytes32 campaignId, address donor);
    event CampaignEnded(bytes32 campaignId);
    event TokenRedeemed(bytes32 campaignId, bytes32 tokenId);
    event DonationMade(address donor, address receiver, uint256 amount);

    uint256 public campaignCount;

    struct Token {
        bytes32 tokenId;
        bool redeemed;
        uint256 price;
    }

    struct Campaign {
        string title;
        string image;
        string description;
        uint256 deadline; //timestamp format
        bool isLive;
        address donor;
        address receiver;
        uint256 balance;
        uint256 deposit;
        Token[] tokens;
    }

    // keep track of admins
    mapping(address => bool) public verifiedAdmins;

    // keep track of verified organizations
    mapping(address => bool) public verifiedOrganizations;

    // keep track of created campaigns using a unique ID
    mapping(bytes32 => Campaign) public campaigns;

    function addAdmin(address _admin) public {
        verifiedAdmins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) public {
        verifiedAdmins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    // modifier to check if a user is an admin
    modifier onlyAdmin() {
        require(verifiedAdmins[msg.sender], "Only admins can perform this action");
        _;
    }

    function verifyOrganization(address _organization) public onlyAdmin {
        verifiedOrganizations[_organization] = true;
        emit OrganizationVerified(_organization);
    }

    function revokeOrganization(address _organization) public onlyAdmin {
        verifiedOrganizations[_organization] = false;
        emit OrganizationRevoked(_organization);
    }

    // modifier to check if an organization is verified
    modifier onlyVerifiedOrganization() {
        require(verifiedOrganizations[msg.sender], "Only verified organizations can start a campaign");
        _;
    }

    // generate a unique ID for a campaign from it's title, descrition and creator address
    function generateCampaignId(
        address _donor, 
        address _receiver,
        string calldata _title, 
        string calldata _description
    ) private pure returns(bytes32) {
        return keccak256(abi.encodePacked(_title, _description, _donor, _receiver));
    }

    // generate a unique ID for a token from it's campaign ID and index
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
        string calldata _imgUrl, 
        uint256 _deadline,
        uint256 _tokenCounts,
        address _receiver
    ) public payable onlyVerifiedOrganization { 
        // generate a unique ID for the campaign
        bytes32 campaignId = generateCampaignId(msg.sender, _receiver, _title, _description);

        // get a reference to the campaign with the generated Id
        Campaign storage campaign = campaigns[campaignId];

        // require that the campaign is not live yet.
        require(!campaign.isLive, "Campaign already exists");

        // set the campaign properties
        campaign.title = _title;
        campaign.description = _description;
        campaign.image = _imgUrl;
        campaign.deadline = _deadline;
        campaign.isLive = true;
        campaign.donor = msg.sender;
        campaign.receiver = _receiver;
        campaign.deposit = msg.value;

        // create tokens for the campaign
        for (uint i = 0; i < _tokenCounts; i++) {
            bytes32 tokenId = generateTokenId(campaignId, i);
            campaign.tokens.push(Token(tokenId, false, msg.value / _tokenCounts));
        }

        // increment the campaign count
        campaignCount++;

        // emit the CampaignStarted event
        emit CampaignStarted(campaignId, msg.sender);
    }

    // end the campaign of a verified organization 
    function endCampaign(bytes32 campaignId) public onlyVerifiedOrganization {

        // get a reference to the campaign with the given ID
        Campaign storage campaign = campaigns[campaignId];

        // require that the campaign is live
        require(campaign.isLive, "Campaign does not exist");

        // require that campaign deadline has passed
        require(block.timestamp > campaign.deadline, "Campaign deadline has not passed");

        // require that sender is the donor of the campaign
        require(msg.sender == campaign.donor, "Only the donor can end the campaign");

        // end the campaign
        campaign.isLive = false;

        emit CampaignEnded(campaignId);

        // transfer the balance to the receiver
        payable(campaign.receiver).transfer(campaign.balance);
        payable(msg.sender).transfer(campaign.deposit - campaign.balance);

        emit DonationMade(msg.sender, campaign.receiver, campaign.balance);
    }

    // returns the details of an active campaign given the campaignId
    function getCampaign(bytes32 campaignId) public view returns(Campaign memory) {
        
        // retrieve the campaign with the given ID
        Campaign storage campaign = campaigns[campaignId];

        // require that the campaign is live
        require(campaign.isLive, "Campaign does not exist");

        return campaign;
    }

    // allow users to reedem the tokens they bought
    function reedemToken(bytes32 campaignId, bytes32 tokenId) public {

        // retrieve the campaign with the given ID
        Campaign storage campaign = campaigns[campaignId];

        // require that the campaign is live
        require(campaign.isLive, "Campaign does not exist");

        // require that the deadline has not passed
        require(block.timestamp < campaign.deadline, "Cannot redeem. Campaign deadline has passed");
        
        for (uint i = 0; i < campaign.tokens.length; i++) {
            if (campaign.tokens[i].tokenId == tokenId) {

                // require that the token has not been redeemed yet
                require(!campaign.tokens[i].redeemed, "Token already redeemed");

                // mark the token as redeemed and change the owner to the receiver
                campaign.tokens[i].redeemed = true;
                campaign.balance += campaign.tokens[i].price;

                // emit the TokenRedeemed event
                emit TokenRedeemed(campaignId, tokenId);

                break;
            }
        }
    }
}