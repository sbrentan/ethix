// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./Campaign.sol";
import "hardhat/console.sol";

contract Charity {
    // Charity contract roles:
    //      - CampaignFactory: create new campaigns
    //      - OrganizationManager: verify and revoke organizations
    //      - CRRManager: manage the Commit Reveal Randomness seed generation and verification

    // ====================================== EVENTS ======================================

    // Charity events
    event OrganizationVerified();
    event OrganizationRevoked();

    // Campaign events
    event CampaignStarted(bytes32 campaignId); // useless since it's an input parameter of the startCampaign function
    event CampaignCreated(bytes32 campaignId);
    event RefundClaimed(uint256 amount);
    event DonationClaimed(uint256 amount);

    // ====================================== STRUCTS ======================================

    // Commit struct used to store the hash of the seed and the block number
    // Used to generate a secure blockchain-level seed using the Commit Reveal Randomness (CRR) technique
    struct Commit {
        bytes32 commitHash;
        uint256 blockNumber;
    }

    // ====================================== VARIABLES ======================================

    address private owner;

    // keep track of all campaigns IDs
    bytes32[] private campaignsIds;

    // keep track of all campaigns
    mapping(bytes32 => Campaign) private campaigns;

    // keep track of verified organizations
    mapping(address => bool) private verifiedOrganizations;

    // keep track of all commits for each campaign
    mapping(bytes32 => Commit) public commits;

    // ====================================== MODIFIERS ======================================

    modifier onlyOwner() {
        /*console.log("msg.sender: ", msg.sender);
        console.log("owner: ", owner);
        console.log("msg.sender == owner: ", msg.sender == owner);*/
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

    modifier onlyExistingCampaign(bytes32 campaignId) {
        require(campaignExists(campaignId), "Campaign does not exist");
        _;
    }

    // ====================================== FUNCTIONS ======================================

    constructor() {
        owner = msg.sender;
    }

    // only admin can verify or revoke organizations
    function verifyOrganization(address _organization) external onlyOwner {
        verifiedOrganizations[_organization] = true;
        emit OrganizationVerified();
    }

    function revokeOrganization(address _organization) external onlyOwner {
        verifiedOrganizations[_organization] = false;
        emit OrganizationRevoked();
    }

    // check if an organization is verified
    function isOrganizationVerified(
        address _organization
    ) external view returns (bool) {
        return verifiedOrganizations[_organization];
    }

    function campaignExists(bytes32 _campaignId) private view returns (bool) {
        return address(campaigns[_campaignId]) != address(0);
    }

    // create a new campaign for a verified organization
    // (corresponds to the `commit` method in the CRR process)
    function createCampaign(
        string calldata _title,
        uint256 _startingDate,
        uint256 _deadline,
        uint256 _tokensCount,
        uint256 _maxTokensCount,
        address _beneficiary,
        bytes32 _commitHash, // is the hash of the seed
        Campaign.Signature calldata _signature
    ) external onlyVerifiedBeneficiary(_beneficiary) {

        // generate a unique ID for the campaign
        bytes32 campaignId = _generateCampaignId(
            msg.sender,
            _beneficiary,
            _title
        );

        // require that the campaignId doesn't already exist in the mapping
        require(!campaignExists(campaignId), "Campaign already exists");

        /*console.log("creation starting date: ");
        console.log(_startingDate);
        console.log("creation block.timestamp: ");
        console.log(block.timestamp);*/
        require(
            _startingDate < _deadline,
            "Starting date must be before the deadline"
        );

        require(
            _startingDate >= block.timestamp,
            "Starting date must be in the future"
        );
        require(
            _maxTokensCount >= _tokensCount,
            "Max tokens count must be greater than or equal to tokens count"
        );

        // verify the signature, checking if the owner generated the seed
        require(
            _signatureVerified(_commitHash, _signature, owner),
            "Invalid signature"
        );

        // save the commit hash and the block number for future CRR `reveal` verification
        commits[campaignId] = Commit(_commitHash, block.number);
        /*console.log("block number on creation: ");
        console.log(block.number);*/

        // create the campaign, add it to the mapping and the list of campaigns IDs
        campaigns[campaignId] = new Campaign(
            campaignId,
            _title,
            _startingDate,
            _deadline,
            msg.sender,
            _beneficiary,
            _tokensCount,
            _maxTokensCount
        );
        campaignsIds.push(campaignId);

        emit CampaignCreated(campaignId);
    }

    // fund and start an existing campaign
    // (corresponds to the `reveal` method in the CRR process)
    function startCampaign(
        bytes32 _campaignId,
        bytes32 _seed,
        address _campaignWallet,
        Campaign.Signature calldata _signature
    ) external payable onlyExistingCampaign(_campaignId) {
        Campaign campaign = campaigns[_campaignId];

        /*console.log("block number on funding: ");
        console.log(block.number);*/


        // require that a commit exists for the campaign
        require(
            commits[_campaignId].commitHash != 0,
            "Campaign has already been started"
        );
        Commit memory commitData = commits[_campaignId];

        /*console.log("commit block number: ");
        console.log(commitData.blockNumber);*/

        // require that the seed matches the commit
        require(
            commitData.commitHash == keccak256(abi.encodePacked(_seed)),
            "Seed hash does not match the previously sent commit hash"
        );

        // require that the block number is at least 1 block after the commit block number
        require(
            block.number > commitData.blockNumber,
            "Must wait at least 1 block after the commit block"
        );

        // verify the signature, checking if the owner started the campaign
        require(
            _signatureVerified(
                keccak256(abi.encodePacked(_campaignWallet, _campaignId)),
                _signature,
                owner
            ),
            "Invalid signature"
        );

        // generate the seed
        bytes32 randomSeed = keccak256(
            abi.encodePacked(_seed, blockhash(block.number))
        );

        // start the campaign
        campaign.start{value: msg.value}(
            randomSeed,
            _campaignWallet,
            msg.sender
        );

        emit CampaignStarted(_campaignId);
    }

    // returns the IDs of all campaigns
    function getCampaignsIds() external view returns (bytes32[] memory) {
        return campaignsIds;
    }

    // returns the details of an active campaign given the campaignId
    function getCampaign(
        bytes32 _campaignId
    )
        external
        view
        onlyExistingCampaign(_campaignId)
        returns (Campaign.CampaignDetails memory)
    {
        return campaigns[_campaignId].getDetails();
    }

    // claim a refund for an ended campaign
    function claimRefund(
        bytes32 _campaignId
    ) external onlyExistingCampaign(_campaignId) {
        campaigns[_campaignId].claimRefund(msg.sender);
        emit RefundClaimed(campaigns[_campaignId].getDetails().refunds);
    }

    // claim a donation for an ended campaign
    function claimDonation(
        bytes32 _campaignId
    ) external onlyExistingCampaign(_campaignId) {
        campaigns[_campaignId].claimDonation(msg.sender);
        emit DonationClaimed(campaigns[_campaignId].getDetails().donations);
    }

    // redeem a batch of tokens
    function redeemTokensBatch(
        bytes32 _campaignId,
        bytes32[] calldata _tokens,
        Campaign.Signature[] calldata _signatures
    ) external onlyExistingCampaign(_campaignId) onlyOwner {
        campaigns[_campaignId].redeemTokensBatch(_tokens, _signatures);
    }

    // function to check if a token is valid
    function isTokenValid(
        bytes32 _campaignId,
        bytes32 _tokenId,
        Campaign.Signature calldata _signature
    ) external view returns (bool) {
        if (!campaignExists(_campaignId) || msg.sender != owner) {
            return false;
        }

        return campaigns[_campaignId].isTokenValid(_tokenId, _signature);
    }

    function generateTokenHashes(
        bytes32 _campaignId,
        bytes32[] calldata _tokensT1
    )
        external
        view
        onlyExistingCampaign(_campaignId)
        onlyOwner
        returns (bytes32[] memory)
    {
        bytes32[] memory t2_tokens = new bytes32[](_tokensT1.length);

        for (uint i = 0; i < _tokensT1.length; i++) {
            t2_tokens[i] = campaigns[_campaignId].generateTokenHash(_tokensT1[i]);
        }

        return t2_tokens;
    }

    // ====================================== UTILS FUNCTIONS ======================================

    // generate a unique ID for a campaign from its title, description and creator address
    function _generateCampaignId(
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
                    block.timestamp,
                    campaignsIds.length
                )
            );
    }

    function _signatureVerified(
        bytes32 _commitHash,
        Campaign.Signature calldata _signature,
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
