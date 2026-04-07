// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ZkAirdrop {
    using SafeERC20 for IERC20;

    // --- Structs ---
    struct Campaign {
        address sponsor;
        address token;
        uint256 groupId;
        uint256 totalAmount;
        uint256 amountPerClaim;
        uint256 maxClaimants;
        uint256 claimedCount;
        uint256 endTime;
        bool active;
    }

    // --- State ---
    ISemaphore public semaphore;
    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;

    // nullifier => bool (tracks used nullifiers to prevent double claims)
    mapping(uint256 => bool) public usedNullifiers;

    // --- Events ---
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed sponsor,
        address token,
        uint256 totalAmount,
        uint256 amountPerClaim,
        uint256 maxClaimants
    );

    event AirdropClaimed(
        uint256 indexed campaignId,
        address indexed wallet,
        uint256 amount,
        uint256 nullifier
    );

    event CampaignCancelled(uint256 indexed campaignId, uint256 refundedAmount);

    // --- Errors ---
    error CampaignNotActive();
    error CampaignExpired();
    error CampaignNotExpired();
    error AllTokensClaimed();
    error InvalidProof();
    error NullifierAlreadyUsed();
    error NotSponsor();
    error InvalidAmount();
    error InvalidWallet();

    constructor(address _semaphore) {
        semaphore = ISemaphore(_semaphore);
    }

    /// @notice Sponsor creates a new airdrop campaign
    /// @param _token ERC20 token address to distribute
    /// @param _totalAmount Total tokens to distribute
    /// @param _maxClaimants Maximum number of contributors who can claim
    /// @param _duration How long the campaign lasts (seconds)
    function createCampaign(
        address _token,
        uint256 _totalAmount,
        uint256 _maxClaimants,
        uint256 _duration
    ) external returns (uint256 campaignId) {
        if (_totalAmount == 0 || _maxClaimants == 0) revert InvalidAmount();

        // Transfer tokens from sponsor to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _totalAmount);

        // Create Semaphore group for this campaign
        uint256 groupId = semaphore.createGroup();

        campaignId = campaignCount++;

        campaigns[campaignId] = Campaign({
            sponsor: msg.sender,
            token: _token,
            groupId: groupId,
            totalAmount: _totalAmount,
            amountPerClaim: _totalAmount / _maxClaimants,
            maxClaimants: _maxClaimants,
            claimedCount: 0,
            endTime: block.timestamp + _duration,
            active: true
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _token,
            _totalAmount,
            _totalAmount / _maxClaimants,
            _maxClaimants
        );
    }

    /// @notice Backend adds verified contributor's commitment to the campaign group
    /// @param _campaignId Campaign ID
    /// @param _commitment Semaphore identity commitment
    function addMember(uint256 _campaignId, uint256 _commitment) external {
        Campaign storage campaign = campaigns[_campaignId];
        if (!campaign.active) revert CampaignNotActive();

        semaphore.addMember(campaign.groupId, _commitment);
    }

    /// @notice Contributor claims airdrop anonymously with ZK proof
    /// @param _campaignId Campaign ID
    /// @param _wallet Wallet address to receive tokens
    /// @param _merkleTreeDepth Depth of the merkle tree
    /// @param _merkleTreeRoot Root of the merkle tree
    /// @param _nullifier Nullifier hash (prevents double claims)
    /// @param _points Proof points
    function claim(
        uint256 _campaignId,
        address _wallet,
        uint256 _merkleTreeDepth,
        uint256 _merkleTreeRoot,
        uint256 _nullifier,
        uint256[8] calldata _points
    ) external {
        if (_wallet == address(0)) revert InvalidWallet();

        Campaign storage campaign = campaigns[_campaignId];

        if (!campaign.active) revert CampaignNotActive();
        if (block.timestamp > campaign.endTime) revert CampaignExpired();
        if (campaign.claimedCount >= campaign.maxClaimants) revert AllTokensClaimed();
        if (usedNullifiers[_nullifier]) revert NullifierAlreadyUsed();

        // Verify the ZK proof on-chain via Semaphore
        // The message (signal) is the wallet address cast to uint256
        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: _merkleTreeDepth,
            merkleTreeRoot: _merkleTreeRoot,
            nullifier: _nullifier,
            message: uint256(uint160(_wallet)),
            scope: _campaignId,
            points: _points
        });

        semaphore.validateProof(campaign.groupId, proof);

        // Mark nullifier as used
        usedNullifiers[_nullifier] = true;
        campaign.claimedCount++;

        // Transfer tokens to the claimant
        IERC20(campaign.token).safeTransfer(_wallet, campaign.amountPerClaim);

        emit AirdropClaimed(_campaignId, _wallet, campaign.amountPerClaim, _nullifier);
    }

    /// @notice Sponsor cancels campaign and retrieves remaining tokens
    /// @param _campaignId Campaign ID
    function cancelCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];

        if (msg.sender != campaign.sponsor) revert NotSponsor();
        if (block.timestamp <= campaign.endTime) revert CampaignNotExpired();

        campaign.active = false;

        uint256 remaining = (campaign.maxClaimants - campaign.claimedCount) * campaign.amountPerClaim;

        if (remaining > 0) {
            IERC20(campaign.token).safeTransfer(campaign.sponsor, remaining);
        }

        emit CampaignCancelled(_campaignId, remaining);
    }

    // --- View functions ---

    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    function isNullifierUsed(uint256 _nullifier) external view returns (bool) {
        return usedNullifiers[_nullifier];
    }

    function remainingClaims(uint256 _campaignId) external view returns (uint256) {
        Campaign storage campaign = campaigns[_campaignId];
        return campaign.maxClaimants - campaign.claimedCount;
    }
}
