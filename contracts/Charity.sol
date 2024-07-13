// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Charity {

    // These are events to be emitted when specific actions are completed
    event AdminAdded(address admin);
    event AdminRemoved(address admin);
    event OrganizationVerified(address organization, bool status);
    event OrganizationRevoked(address organization, bool status);
    event CampaignStarted(bytes32 campaignId, address donor);
    event CampaignEnded(bytes32 campaignId);
    event TokenRedeemed(bytes32 campaignId, bytes32 tokenId);
    event DonationMade(bytes32 campaignId, address donor, uint256 refund, address beneficiary, uint256 donation);

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
        address beneficiary;
        uint256 balance;
        uint256 deposit;
        Token[] tokens;
    }

    // keep track of verified organizations
    mapping(address => bool) public verifiedOrganizations;

    // keep track of created campaigns using a unique ID
    mapping(bytes32 => Campaign) public campaigns;

    // only admin can verify or revoke organizations
    function verifyOrganization(address _organization) public {
        verifiedOrganizations[_organization] = true;
        emit OrganizationVerified(_organization, true);
    }

    function isOrganizationVerified(address _organization) public view returns (bool) {
        return verifiedOrganizations[_organization];
    }

    function revokeOrganization(address _organization) public {
        verifiedOrganizations[_organization] = false;
        emit OrganizationRevoked(_organization, false);
    }

    // modifier to check if an organization is verified
    modifier onlyVerifiedOrganization() {
        require(verifiedOrganizations[msg.sender], "Only verified organizations can perform this action");
        _;
    }

    // generate a unique ID for a campaign from its title, description and creator address
    function generateCampaignId(
        address _donor, 
        address _beneficiary,
        string calldata _title, 
        string calldata _description
    ) private pure returns(bytes32) {
        return keccak256(abi.encodePacked(_title, _description, _donor, _beneficiary));
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
        string calldata _imgUrl, 
        uint256 _deadline,
        uint256 _tokenCounts,
        address _beneficiary
    ) public payable { 
        // generate a unique ID for the campaign
        bytes32 campaignId = generateCampaignId(msg.sender, _beneficiary, _title, _description);

        // get a reference to the campaign with the generated Id
        Campaign storage campaign = campaigns[campaignId];

        // require that the campaign is not live yet.
        require(!campaign.isLive, "Campaign already exists");

        // require that the beneficiary is a verified organization
        require(verifiedOrganizations[_beneficiary], "beneficiary is not a verified organization");

        // set the campaign properties
        campaign.title = _title;
        campaign.description = _description;
        campaign.image = _imgUrl;
        campaign.deadline = _deadline;
        campaign.isLive = true;
        campaign.donor = msg.sender;
        campaign.beneficiary = _beneficiary;
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

    function addressToString(address _address) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_address)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(51);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function getDonorMessage(Campaign memory campaign, address sender) public pure returns (string memory) {
        string memory temp = string(abi.encodePacked("Only the donor can view the tokens: ", addressToString(campaign.donor)));
        return string(abi.encodePacked(temp, ". Sender: ", addressToString(sender)));
    }

    // get the tokens of a campaign
    function getCampaignTokens(bytes32 campaignId) public view returns(Token[] memory) {

        Campaign memory campaign = campaigns[campaignId];

        // require that the campaign is live
        require(campaign.isLive, "Campaign does not exist");

        // require that the sender is the donor of the campaign
        require(msg.sender == campaign.donor, getDonorMessage(campaign, msg.sender));

        return campaign.tokens;
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

        // transfer the balance to the beneficiary
        payable(campaign.beneficiary).transfer(campaign.balance);
        payable(msg.sender).transfer(campaign.deposit - campaign.balance);

        emit DonationMade(campaignId, msg.sender, campaign.deposit - campaign.balance, campaign.beneficiary, campaign.balance);
    }

    // returns the details of an active campaign given the campaignId
    function getCampaign(bytes32 campaignId) public view returns(Campaign memory) {
        
        // retrieve a copy of the campaign with the given ID
        Campaign memory campaign = campaigns[campaignId];

        // require that the campaign is live
        require(campaign.isLive, "Campaign does not exist");

        // remove the token array from the campaign before returning it
        // delete campaign.tokens;

        return campaign;
    }

    // allow users to reedem the tokens they bought
    function redeemToken(bytes32 campaignId, bytes32 tokenId) public {

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

                // mark the token as redeemed and change the owner to the beneficiary
                campaign.tokens[i].redeemed = true;
                campaign.balance += campaign.tokens[i].price;

                // emit the TokenRedeemed event
                emit TokenRedeemed(campaignId, tokenId);

                break;
            }
        }
    }
}