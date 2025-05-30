// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";
import {ERC721} from "openzeppelin-contracts/token/ERC721/ERC721.sol";
import {Strings} from "openzeppelin-contracts/utils/Strings.sol";
import {Base64} from "openzeppelin-contracts/utils/Base64.sol";


struct BadgeInfo {
    string platform;
    string severity;
    uint256 merits;
    uint256 timestamp;
    string submissionId;
    bool verified;
    uint256 tokenId;
}

contract BugBountyRegistry is Verifier, ERC721 {
    using Strings for uint256;

    // Token management
    uint256 public nextTokenId = 1;
    mapping(uint256 => BadgeInfo) public tokenIdToBadge;
    mapping(string => string) public platformImageUrls;
    
    // Existing bounty tracking
    mapping(address => uint256[]) public userTokenIds;
    mapping(address => uint256) public userTotalMerits;
    mapping(address => mapping(string => uint256)) public userSeverityCounts;
    mapping(string => bool) public usedSubmissionIds;
    
    address public proverContract;
    uint256 public totalSubmissions;

    event BadgeAwarded(
        address indexed user,
        string platform,
        string severity,
        uint256 merits,
        string submissionId,
        uint256 tokenId
    );

    constructor(address _proverContract) 
        ERC721("BugBountyBadges", "BOUNTY") 
    {
        proverContract = _proverContract;
        
        // Pre-set platform image URLs
        platformImageUrls["HackerOne"] = "https://pipedream.com/s.v0/app_JQh7AW/logo/orig";
        platformImageUrls["Bugcrowd"] = "https://pipedream.com/s.v0/app_JQh7AW/logo/orig";
        platformImageUrls["Immunefi"] = "https://pipedream.com/s.v0/app_JQh7AW/logo/orig";
        platformImageUrls["Intigriti"] = "https://pipedream.com/s.v0/app_JQh7AW/logo/orig";
        platformImageUrls["gmail"] = "https://pipedream.com/s.v0/app_JQh7AW/logo/orig";
    }

    function submitBugBountyProof(
        Proof calldata proof,
        string calldata platform,
        string calldata severity,
        string calldata submissionId
    ) external {
        // Verify the proof came from our prover contract
        require(proof.callAssumptions.proverContractAddress == proverContract, "Invalid prover");
        
        // Ensure submission ID hasn't been used
        require(!usedSubmissionIds[submissionId], "Submission already used");
        usedSubmissionIds[submissionId] = true;
        
        // Calculate merits based on severity
        uint256 merits = calculateMerits(severity);
        
        // Mint NFT badge
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        // Create badge info
        BadgeInfo memory badge = BadgeInfo({
            platform: platform,
            severity: severity,
            merits: merits,
            timestamp: block.timestamp,
            submissionId: submissionId,
            verified: true,
            tokenId: tokenId
        });
        
        // Store badge data
        tokenIdToBadge[tokenId] = badge;
        userTokenIds[msg.sender].push(tokenId);
        
        // Update user stats
        userTotalMerits[msg.sender] += merits;
        userSeverityCounts[msg.sender][severity]++;
        totalSubmissions++;
        
        emit BadgeAwarded(
            msg.sender,
            platform,
            severity,
            merits,
            submissionId,
            tokenId
        );
    }

    // Existing functions modified for NFT support
    function getUserBadges(address user) external view returns (BadgeInfo[] memory) {
        uint256[] storage tokenIds = userTokenIds[user];
        BadgeInfo[] memory badges = new BadgeInfo[](tokenIds.length);
        
        for (uint i = 0; i < tokenIds.length; i++) {
            badges[i] = tokenIdToBadge[tokenIds[i]];
        }
        return badges;
    }

    function getBadgeCount(address user) external view returns (uint256) {
        return userTokenIds[user].length;
    }

    // Metadata function for Blockscout
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        BadgeInfo memory badge = tokenIdToBadge[tokenId];
        
        string memory imageUrl = platformImageUrls[badge.platform];
        if (bytes(imageUrl).length == 0) {
            imageUrl = "https://example.com/default-badge.png";
        }
        
        // Break down the JSON construction into smaller parts
        string memory name = string(abi.encodePacked('{"name": "', badge.platform, ' Bounty Badge",'));
        string memory description = string(abi.encodePacked('"description": "Verified bug bounty submission on ', badge.platform, '",'));
        string memory image = string(abi.encodePacked('"image": "', imageUrl, '",'));
        
        string memory attributes = string(abi.encodePacked(
            '"attributes": [',
            '{"trait_type": "Severity", "value": "', badge.severity, '"},',
            '{"trait_type": "Merits", "value": ', badge.merits.toString(), '},',
            '{"trait_type": "Submission ID", "value": "', badge.submissionId, '"}',
            ']}'
        ));
        
        string memory json = string(abi.encodePacked(name, description, image, attributes));
        
        return string(
            abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(bytes(json))
            )
        );
    }

    // Set custom image URL for a platform
    function setPlatformImage(string calldata platform, string calldata imageUrl) external {
        platformImageUrls[platform] = imageUrl;
    }

    // Existing unchanged functions
    function calculateMerits(string calldata severity) public pure returns (uint256) {
        bytes32 severityHash = keccak256(bytes(severity));
        
        if (severityHash == keccak256(bytes("Critical"))) {
            return 100;
        } else if (severityHash == keccak256(bytes("High"))) {
            return 70;
        } else if (severityHash == keccak256(bytes("Medium"))) {
            return 40;
        } else if (severityHash == keccak256(bytes("Low"))) {
            return 20;
        } else {
            return 10;
        }
    }

    function getUserMerits(address user) external view returns (uint256) {
        return userTotalMerits[user];
    }

    function getUserStats(address user) external view returns (
        uint256 totalMerits,
        uint256 badgeCount,
        uint256 criticalCount,
        uint256 highCount,
        uint256 mediumCount,
        uint256 lowCount
    ) {
        totalMerits = userTotalMerits[user];
        badgeCount = userTokenIds[user].length;
        
        criticalCount = userSeverityCounts[user]["Critical"];
        highCount = userSeverityCounts[user]["High"];
        mediumCount = userSeverityCounts[user]["Medium"];
        lowCount = userSeverityCounts[user]["Low"];
    }
}
