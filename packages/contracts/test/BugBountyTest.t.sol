// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {BugBountyEmailProver, BugBountySubmission} from "../src/Prover.sol";
import {BugBountyRegistry} from "../src/BountyRegistry.sol";
import {Proof} from "vlayer-0.1.0/Proof.sol";
import {BadgeInfo} from "../src/BountyRegistry.sol";
import {CallAssumptions} from "vlayer-0.1.0/CallAssumptions.sol";

contract BugBountyTest is Test {
    BugBountyEmailProver public prover;
    BugBountyRegistry public registry;
    address public user = address(0x1);

    function setUp() public {
        // Deploy the prover contract
        prover = new BugBountyEmailProver();
        
        // Deploy the registry contract with the prover address
        registry = new BugBountyRegistry(address(prover));
        
        // Set up the test user
        vm.deal(user, 1 ether);
    }

    function testSuccessfulSubmission() public {
        // Mock email content and headers for a HackerOne submission
        string memory emailContent = "Congratulations! Your bug bounty submission has been accepted and we will give you a reward. This is a critical severity bug from HackerOne.";
        string memory emailHeaders = 
            "From: security@hackerone.com\n"
            "DKIM-Signature: v=1; a=rsa-sha256; d=hackerone.com; s=selector; c=relaxed/relaxed; t=1234567890; bh=base64hash; b=signature\n"
            "Authentication-Results: spf=pass smtp.mailfrom=security@hackerone.com\n";

        // Switch to user context
        vm.startPrank(user);

        // Call the prover
        (Proof memory proof, BugBountySubmission memory submission) = prover.prove(emailContent, emailHeaders);

        // Submit the proof to the registry
        registry.submitBugBountyProof(
            proof,
            submission.platform,
            submission.severity,
            submission.submissionId
        );

        // Verify the submission was recorded
        (uint256 totalMerits, uint256 badgeCount, uint256 criticalCount, uint256 highCount, uint256 mediumCount, uint256 lowCount) = 
            registry.getUserStats(user);

        assertEq(totalMerits, 100, "Should have 100 merits for critical severity");
        assertEq(badgeCount, 1, "Should have 1 badge");
        assertEq(criticalCount, 1, "Should have 1 critical submission");
        assertEq(highCount, 0, "Should have 0 high submissions");
        assertEq(mediumCount, 0, "Should have 0 medium submissions");
        assertEq(lowCount, 0, "Should have 0 low submissions");

        // Verify the badge details
        BadgeInfo[] memory badges = registry.getUserBadges(user);
        assertEq(badges.length, 1, "Should have 1 badge");
        assertEq(badges[0].platform, "HackerOne", "Platform should be HackerOne");
        assertEq(badges[0].severity, "Critical", "Severity should be Critical");
        assertEq(badges[0].merits, 100, "Should have 100 merits");
        assertTrue(badges[0].verified, "Badge should be verified");

        vm.stopPrank();
    }

    function testDuplicateSubmission() public {
        // Mock email content and headers
        string memory emailContent = "Congratulations! Your bug bounty submission has been accepted and we will give you a reward. This is a critical severity bug from HackerOne.";
        string memory emailHeaders = 
            "From: security@hackerone.com\n"
            "DKIM-Signature: v=1; a=rsa-sha256; d=hackerone.com; s=selector; c=relaxed/relaxed; t=1234567890; bh=base64hash; b=signature\n"
            "Authentication-Results: spf=pass smtp.mailfrom=security@hackerone.com\n";

        vm.startPrank(user);

        // First submission
        (Proof memory proof, BugBountySubmission memory submission) = prover.prove(emailContent, emailHeaders);
        registry.submitBugBountyProof(
            proof,
            submission.platform,
            submission.severity,
            submission.submissionId
        );

        // Try to submit the same proof again
        vm.expectRevert("Submission already used");
        registry.submitBugBountyProof(
            proof,
            submission.platform,
            submission.severity,
            submission.submissionId
        );

        vm.stopPrank();
    }

    function testInvalidEmail() public {
        // Mock invalid email content
        string memory emailContent = "Hello, this is not a bug bounty email.";
        string memory emailHeaders = 
            "From: security@hackerone.com\n"
            "DKIM-Signature: v=1; a=rsa-sha256; d=hackerone.com; s=selector; c=relaxed/relaxed; t=1234567890; bh=base64hash; b=signature\n"
            "Authentication-Results: spf=pass smtp.mailfrom=security@hackerone.com\n";

        vm.startPrank(user);

        // Should revert with "Not a valid bug bounty email"
        vm.expectRevert("Not a valid bug bounty email");
        prover.prove(emailContent, emailHeaders);

        vm.stopPrank();
    }

    function testInvalidDomain() public {
        // Mock email with invalid domain
        string memory emailContent = "Congratulations! Your bug bounty submission has been accepted and you will receive a reward. This is a critical severity bug.";
        string memory emailHeaders = 
            "From: security@invalid.com\n"
            "DKIM-Signature: v=1; a=rsa-sha256; d=invalid.com; s=selector; c=relaxed/relaxed; t=1234567890; bh=base64hash; b=signature\n"
            "Authentication-Results: spf=pass smtp.mailfrom=security@invalid.com\n";

        vm.startPrank(user);

        // Should revert with "Unsupported platform domain"
        vm.expectRevert("Unsupported platform domain");
        prover.prove(emailContent, emailHeaders);

        vm.stopPrank();
    }
} 