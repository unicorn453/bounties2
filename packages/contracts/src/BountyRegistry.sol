// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";

struct BadgeInfo {
    string platform;
    string severity;
    uint256 merits;
    uint256 timestamp;
    string submissionId;
    bool verified;
}

contract BugBountyRegistry is Verifier {
    mapping(address => BadgeInfo[]) public userBadges;
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
        string submissionId
    );

    constructor(address _proverContract) {
        proverContract = _proverContract;
    }

    function submitBugBountyProof(
        Proof calldata proof,
        string calldata platform,
        string calldata severity,
        string calldata submissionId
    ) external {

        // Ensure submission ID hasn't been used
        require(!usedSubmissionIds[submissionId], "Submission already used");
        
        // Mark submission as used
        usedSubmissionIds[submissionId] = true;
        
        // Calculate merits based on severity
        uint256 merits = calculateMerits(severity);
        
        // Create badge info
        BadgeInfo memory badge = BadgeInfo({
            platform: platform,
            severity: severity,
            merits: merits,
            timestamp: block.timestamp,
            submissionId: submissionId,
            verified: true
        });
        
        // Add to user's badges
        userBadges[msg.sender].push(badge);
        userTotalMerits[msg.sender] += merits;
        userSeverityCounts[msg.sender][severity]++;
        totalSubmissions++;
        
        emit BadgeAwarded(
            msg.sender,
            platform,
            severity,
            merits,
            submissionId
        );
    }

    function calculateMerits(string calldata severity) 
        public 
        pure 
        returns (uint256) 
    {
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
            return 10; // Unknown severity gets base points
        }
    }

    function getUserBadges(address user) external view returns (BadgeInfo[] memory) {
        return userBadges[user];
    }

    function getUserMerits(address user) external view returns (uint256) {
        return userTotalMerits[user];
    }

    function getBadgeCount(address user) external view returns (uint256) {
        return userBadges[user].length;
    }

    function getUserStats(address user) external view returns (
        uint256 totalMerits,
        uint256 badgeCount,
        uint256 criticalCount,
        uint256 highCount,
        uint256 mediumCount,
        uint256 lowCount
    ) {
        BadgeInfo[] memory badges = userBadges[user];
        totalMerits = userTotalMerits[user];
        badgeCount = badges.length;
        
        criticalCount = userSeverityCounts[user]["Critical"];
        highCount = userSeverityCounts[user]["High"];
        mediumCount = userSeverityCounts[user]["Medium"];
        lowCount = userSeverityCounts[user]["Low"];
    }
}
