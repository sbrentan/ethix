// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./Campaign.sol";

contract Charity {
    // Charity contract roles:
    //      - CampaignFactory: create new campaigns
    //      - OrganizationManager: verify and revoke organizations
    //      - CRRManager: manage the Commit Reveal Randomness seed generation and verification

    // ====================================== EVENTS ======================================

    // Charity events
    event OrganizationVerified(address organization, bool status);
    event OrganizationRevoked(address organization, bool status);

    // Campaign events
    event CampaignStarted(bytes32 campaignId, address donor);
    event TokenRedeemed(bytes32 campaignId, bytes32 tokenId);
    event RefundClaimed(bytes32 campaignId, address donor, uint256 amount);
    event DonationClaimed(
        bytes32 campaignId,
        address beneficiary,
        uint256 amount
    );

    // ====================================== VARIABLES ======================================

    address private owner;

    // keep track of all campaigns IDs
    bytes32[] private campaignsIds;

    // keep track of all campaigns
    mapping(bytes32 => Campaign) private campaigns;

    // keep track of verified organizations
    mapping(address => bool) private verifiedOrganizations;

    // ====================================== MODIFIERS ======================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyVerifiedBeneficiary(address beneficiary) {
        require(
            verifiedOrganizations[beneficiary],
            "Beneficiary is not a verified organization"
        );
        _;
    }

    // ====================================== FUNCTIONS ======================================

    constructor() {
        owner = msg.sender;
    }

    // only admin can verify or revoke organizations
    function verifyOrganization(address _organization) external onlyOwner {
        verifiedOrganizations[_organization] = true;
        emit OrganizationVerified(_organization, true);
    }

    function revokeOrganization(address _organization) external onlyOwner {
        verifiedOrganizations[_organization] = false;
        emit OrganizationRevoked(_organization, false);
    }

    // check if an organization is verified
    function isOrganizationVerified(
        address _organization
    ) external view returns (bool) {
        return verifiedOrganizations[_organization];
    }

    // generate a unique ID for a campaign from its title, description and creator address
    function generateCampaignId(
        address _donor,
        address _beneficiary,
        string calldata _title
    ) private view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _donor,
                    _beneficiary,
                    _title,
                    campaignsIds.length
                )
            );
    }

    function campaignExists(bytes32 campaignId) private view returns (bool) {
        return address(campaigns[campaignId]) != address(0);
    }

    // create a new campaign for a verified organization
    function startCampaign(
        string calldata _title,
        uint256 _deadline,
        uint256 _startingDate,
        uint256 _tokensCount,
        address _beneficiary,
        bytes32 _seed
    ) external payable onlyVerifiedBeneficiary(_beneficiary) {
        // generate a unique ID for the campaign
        bytes32 campaignId = generateCampaignId(
            msg.sender,
            _beneficiary,
            _title
        );

        // require that the campaignId doesn't exist in the mapping
        require(!campaignExists(campaignId), "Campaign already exists");

        // create the campaign, add it to the mapping and the list of campaigns IDs
        campaigns[campaignId] = new Campaign(
            campaignId,
            _title,
            _deadline,
            _startingDate,
            msg.sender,
            _beneficiary,
            _tokensCount
        );
        campaignsIds.push(campaignId);

        // start the campaign
        campaigns[campaignId].start{value: msg.value}(_seed);

        emit CampaignStarted(campaignId, msg.sender);
    }

    // returns the IDs of all campaigns
    function getCampaignsIds() external view returns (bytes32[] memory) {
        return campaignsIds;
    }

    // returns the details of an active campaign given the campaignId
    function getCampaign(
        bytes32 campaignId
    ) external view returns (Campaign.CampaignDetails memory) {
        return campaigns[campaignId].getDetails();
    }

    function getCampaignTokens(
        bytes32 campaignId
    ) external view returns (Campaign.Token[] memory) {
        return campaigns[campaignId].getTokens(msg.sender);
    }

    function claimRefund(bytes32 campaignId) external {
        campaigns[campaignId].claimRefund(msg.sender);
        emit RefundClaimed(
            campaignId,
            msg.sender,
            campaigns[campaignId].getDetails().refunds
        );
    }

    function claimDonation(bytes32 campaignId) external {
        campaigns[campaignId].claimDonation(msg.sender);
        emit DonationClaimed(
            campaignId,
            msg.sender,
            campaigns[campaignId].getDetails().donations
        );
    }

    function redeemToken(bytes32 campaignId, bytes32 tokenId) external {
        campaigns[campaignId].redeemToken(tokenId);
        emit TokenRedeemed(campaignId, tokenId);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getCampaignBalance(
        bytes32 campaignId
    ) external view returns (uint256, uint256, uint256) {
        return campaigns[campaignId].getBalance();
    }
}
