// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Proof, ProofLib} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {CallAssumptions} from "vlayer-0.1.0/CallAssumptions.sol";
import {Seal, ProofMode} from "vlayer-0.1.0/Seal.sol";

struct BugBountySubmission {
    address reporter;
    string platform;
    string severity;
    uint256 merits;
    uint256 timestamp;
    string submissionId;
    bool verified;
    uint256 tokenId;  // This will be set by the registry
}

contract BugBountyEmailProver is Prover {
    // Helper function to convert string to lowercase
    function toLowerCase(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Convert uppercase to lowercase
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    // Helper function to check if a string contains another string (case-insensitive)
    function stringContains(string memory source, string memory search) internal pure returns (bool) {
        string memory sourceLower = toLowerCase(source);
        string memory searchLower = toLowerCase(search);
        
        bytes memory sourceBytes = bytes(sourceLower);
        bytes memory searchBytes = bytes(searchLower);
        
        if (searchBytes.length > sourceBytes.length) {
            return false;
        }
        
        for (uint i = 0; i <= sourceBytes.length - searchBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < searchBytes.length; j++) {
                if (sourceBytes[i + j] != searchBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        return false;
    }

    // Helper function to extract header value
    function getHeaderValue(string memory headers, string memory headerName) internal pure returns (string memory) {
        bytes memory headersBytes = bytes(headers);
        bytes memory headerNameBytes = bytes(headerName);
        
        // Find the header
        for (uint i = 0; i < headersBytes.length - headerNameBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < headerNameBytes.length; j++) {
                if (headersBytes[i + j] != headerNameBytes[j]) {
                    found = false;
                    break;
                }
            }
            
            if (found) {
                // Skip the header name and colon
                uint start = i + headerNameBytes.length + 1;
                // Skip whitespace
                while (start < headersBytes.length && (headersBytes[start] == ' ' || headersBytes[start] == '\t')) {
                    start++;
                }
                
                // Find the end of the value (next newline)
                uint end = start;
                while (end < headersBytes.length && headersBytes[end] != '\n') {
                    end++;
                }
                
                // Convert to string
                bytes memory value = new bytes(end - start);
                for (uint j = 0; j < end - start; j++) {
                    value[j] = headersBytes[start + j];
                }
                return string(value);
            }
        }
        return "";
    }

    function prove(
        string calldata emailContent,
        string calldata emailHeaders
    ) public view returns (Proof memory, BugBountySubmission memory) {
        // Basic validation - check if this looks like a bug bounty email
        require(
            stringContains(emailContent, "congratulations") && 
            stringContains(emailContent, "reward") && 
            stringContains(emailContent, "bounty"),
            "Not a valid bug bounty email"
        );

        // Validate email headers
        string memory dkimSignature = getHeaderValue(emailHeaders, "DKIM-Signature");
        string memory spfResult = getHeaderValue(emailHeaders, "Authentication-Results");
        string memory fromHeader = getHeaderValue(emailHeaders, "From");
        
        // Check if email is properly authenticated
        require(bytes(dkimSignature).length > 0, "Missing DKIM signature");
        require(stringContains(spfResult, "spf=pass"), "SPF check failed");
        
        // Validate sender domain
        if (stringContains(fromHeader, "hackerone.com")) {
            require(stringContains(dkimSignature, "d=hackerone.com"), "Invalid DKIM domain for HackerOne");
        } else if (stringContains(fromHeader, "bugcrowd.com")) {
            require(stringContains(dkimSignature, "d=bugcrowd.com"), "Invalid DKIM domain for Bugcrowd");
        } else if (stringContains(fromHeader, "immunefi.com")) {
            require(stringContains(dkimSignature, "d=immunefi.com"), "Invalid DKIM domain for Immunefi");
        } else if (stringContains(fromHeader, "intigriti.com")) {
            require(stringContains(dkimSignature, "d=intigriti.com"), "Invalid DKIM domain for Intigriti");
        } else if (stringContains(fromHeader, "gmail.com")) {
            require(stringContains(dkimSignature, "d=gmail.com"), "Invalid DKIM domain for Intigriti");
        } else {
            revert("Unsupported platform domain");
        }

        BugBountySubmission memory submission = parseEmailContent(emailContent);
        submission.reporter = msg.sender;
        submission.timestamp = block.timestamp;
        submission.verified = true;
        submission.tokenId = 0;  // This will be set by the registry

        // Create a proof that can be verified by the registry
        Proof memory proof = ProofLib.emptyProof();
        
        // Initialize seal with fake proof mode for now
        bytes32[8] memory emptySeal;
        proof.seal = Seal({
            verifierSelector: bytes4(0), // In a real implementation, this would be the actual selector
            seal: emptySeal,
            mode: ProofMode.FAKE
        });
        
        proof.callGuestId = bytes32(0); // In a real implementation, this would be the actual guest ID
        proof.length = abi.encode(submission).length;
        
        // Initialize call assumptions
        proof.callAssumptions = CallAssumptions({
            proverContractAddress: address(this),
            functionSelector: this.prove.selector,
            settleChainId: block.chainid,
            settleBlockNumber: block.number,
            settleBlockHash: blockhash(block.number - 1)
        });

        return (proof, submission);
    }

    function parseEmailContent(string calldata content) 
        internal 
        pure 
        returns (BugBountySubmission memory) 
    {
        BugBountySubmission memory submission;
        string memory contentLower = toLowerCase(content);
        
        // Extract platform
        if (stringContains(contentLower, "hackerone")) {
            submission.platform = "HackerOne";
        } else if (stringContains(contentLower, "bugcrowd")) {
            submission.platform = "Bugcrowd";
        } else if (stringContains(contentLower, "immunefi")) {
            submission.platform = "Immunefi";
        } else if (stringContains(contentLower, "intigriti")) {
            submission.platform = "Intigriti";
        } else {
            submission.platform = "Other";
        }
        
        // Extract severity
        if (stringContains(contentLower, "critical")) {
            submission.severity = "Critical";
            submission.merits = 100;
        } else if (stringContains(contentLower, "high")) {
            submission.severity = "High";
            submission.merits = 70;
        } else if (stringContains(contentLower, "medium")) {
            submission.severity = "Medium";
            submission.merits = 40;
        } else if (stringContains(contentLower, "low")) {
            submission.severity = "Low";
            submission.merits = 20;
        } else {
            submission.severity = "Unknown";
            submission.merits = 10;
        }
        
        // Generate a simple submission ID based on content hash
        submission.submissionId = generateSubmissionId(content);
        submission.verified = true;
        submission.tokenId = 0;  // This will be set by the registry
        
        return submission;
    }

    function generateSubmissionId(string calldata content) 
        internal 
        pure 
        returns (string memory) 
    {
        // Simple hash-based ID generation
        bytes32 hash = keccak256(bytes(content));
        return string(abi.encodePacked("SUB_", toHexString(uint256(hash))));
    }

    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 16;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 16)));
            if (uint256(value % 16) > 9) {
                buffer[digits] = bytes1(uint8(87 + uint256(value % 16)));
            }
            value /= 16;
        }
        
        return string(buffer);
    }
}
