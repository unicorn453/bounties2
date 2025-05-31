import {
    getConfig,
    createContext,
} from "@vlayer/sdk/config";
import verifierSpec from "../out/BountyRegistry.sol/BugBountyRegistry.json";

const config = getConfig();
const {
    ethClient,
    account: john,
} = createContext(config);

// Your deployed verifier contract address
const VERIFIER_ADDRESS = "0x17deb0c92eca8a255de83dd677d35f5675b26f7d";

// Interface for badge information (matches your prover output)
interface BadgeInfo {
    reporter: string;
    platform: string;
    severity: string;
    merits: bigint;
    submissionId: string;
    timestamp: bigint;
    verified: boolean;
    tokenId: bigint;
}

interface ProverSubmission {
    reporter: string;
    platform: string;
    severity: string;
    merits: bigint;
    submissionId: string;
    timestamp: bigint;
    verified: boolean;
    tokenId: bigint;
}

// Display complete badge information with all details
async function displayCompleteBadgeInfo(badge: BadgeInfo, ownerAddress: string, submissionId?: string): Promise<any> {
    console.log(`\n🏆 COMPLETE BADGE INFORMATION`);
    console.log("=".repeat(50));

    // Basic Badge Info
    console.log(`\n📋 BASIC INFORMATION:`);
    console.log(`   ├─ Badge Owner: ${ownerAddress}`);
    console.log(`   ├─ Platform: ${badge.platform}`);
    console.log(`   ├─ Severity Level: ${badge.severity}`);
    console.log(`   ├─ Merit Points: ${badge.merits.toString()}`);
    console.log(`   ├─ NFT Token ID: #${badge.tokenId.toString()}`);
    console.log(`   └─ Verification Status: ${badge.verified ? '✅ VERIFIED' : '❌ UNVERIFIED'}`);

    // Submission Details
    console.log(`\n📄 SUBMISSION DETAILS:`);
    console.log(`   ├─ Submission ID: ${badge.submissionId}`);
    console.log(`   ├─ Reporter Address: ${badge.reporter}`);
    console.log(`   ├─ Submission Date: ${new Date(Number(badge.timestamp) * 1000).toLocaleString()}`);
    console.log(`   └─ Unix Timestamp: ${badge.timestamp.toString()}`);

    // Validation Details
    console.log(`\n🔐 CRYPTOGRAPHIC VALIDATION:`);

    // Check if submission is registered
    const isRegistered = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: verifierSpec.abi,
        functionName: "usedSubmissionIds",
        args: [badge.submissionId],
    });

    // Validate merit calculation
    const expectedMerits = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: verifierSpec.abi,
        functionName: "calculateMerits",
        args: [badge.severity],
    });

    const meritValid = Number(badge.merits) === Number(expectedMerits);

    console.log(`   ├─ On-Chain Registration: ${isRegistered ? '✅ CONFIRMED' : '❌ NOT FOUND'}`);
    console.log(`   ├─ Merit Calculation: ${meritValid ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`   ├─ Expected Merits: ${expectedMerits.toString()}`);
    console.log(`   ├─ Actual Merits: ${badge.merits.toString()}`);
    console.log(`   └─ ZK Proof Status: ${badge.verified ? '✅ CRYPTOGRAPHICALLY PROVEN' : '❌ NOT PROVEN'}`);

    // Blockchain Information
    console.log(`\n⛓️  BLOCKCHAIN INFORMATION:`);
    console.log(`   ├─ Contract Address: ${VERIFIER_ADDRESS}`);
    console.log(`   ├─ Network: ${config.chain?.name || 'Unknown'}`);
    console.log(`   ├─ Token Standard: ERC-721 (NFT)`);
    console.log(`   └─ Anti-Replay Protection: ✅ ENABLED`);

    // Merit System Context
    const severityMerits = {
        'Critical': 100,
        'High': 50,
        'Medium': 25,
        'Low': 10
    };

    console.log(`\n💰 MERIT SYSTEM CONTEXT:`);
    console.log(`   ├─ Critical Severity: 100 merits`);
    console.log(`   ├─ High Severity: 50 merits`);
    console.log(`   ├─ Medium Severity: 25 merits`);
    console.log(`   ├─ Low Severity: 10 merits`);
    console.log(`   └─ This Badge Value: ${badge.merits.toString()} merits (${badge.severity})`);

    // Owner Statistics
    console.log(`\n👤 OWNER STATISTICS:`);
    const userStats = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: verifierSpec.abi,
        functionName: "getUserStats",
        args: [ownerAddress],
    });

    const [totalMerits, badgeCount, criticalCount, highCount, mediumCount, lowCount] = userStats;

    console.log(`   ├─ Total Badges: ${badgeCount.toString()}`);
    console.log(`   ├─ Total Merits: ${totalMerits.toString()}`);
    console.log(`   ├─ Critical Badges: ${criticalCount.toString()}`);
    console.log(`   ├─ High Badges: ${highCount.toString()}`);
    console.log(`   ├─ Medium Badges: ${mediumCount.toString()}`);
    console.log(`   └─ Low Badges: ${lowCount.toString()}`);

    // Researcher Tier
    let tier = "Bronze";
    if (Number(totalMerits) >= 2000) tier = "Platinum";
    else if (Number(totalMerits) >= 1000) tier = "Gold";
    else if (Number(totalMerits) >= 500) tier = "Silver";

    console.log(`\n🎖️  RESEARCHER TIER: ${tier}`);

    // Technical Details
    console.log(`\n🔧 TECHNICAL DETAILS:`);
    console.log(`   ├─ Prover Contract: BugBountyEmailProver`);
    console.log(`   ├─ Verifier Contract: BugBountyRegistry`);
    console.log(`   ├─ ZK Technology: vlayer SDK`);
    console.log(`   ├─ Email Verification: DKIM + Regex parsing`);
    console.log(`   └─ Storage: On-chain (Ethereum-compatible)`);

    const result = {
        badge,
        owner: ownerAddress,
        validation: {
            isRegistered,
            meritValid,
            expectedMerits: Number(expectedMerits),
            actualMerits: Number(badge.merits),
            isFullyValid: isRegistered && meritValid && badge.verified
        },
        ownerStats: {
            totalMerits: Number(totalMerits),
            badgeCount: Number(badgeCount),
            tier
        },
        technical: {
            contractAddress: VERIFIER_ADDRESS,
            network: config.chain?.name || 'Unknown',
            tokenStandard: 'ERC-721'
        }
    };

    console.log(`\n✨ BADGE INFORMATION RETRIEVAL COMPLETE`);

    return result;
}

// Retrieve badge by submission ID (from prover output)
async function getBadgeBySubmissionId(submissionId: string) {
    console.log(`🔍 RETRIEVING BADGE INFORMATION`);
    console.log(`📄 Submission ID: ${submissionId}`);
    console.log("=".repeat(60));

    try {
        // First, check if submission exists
        const isUsed = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "usedSubmissionIds",
            args: [submissionId],
        });

        if (!isUsed) {
            console.log(`❌ SUBMISSION NOT FOUND`);
            console.log(`   └─ Submission ID "${submissionId}" has not been registered on-chain`);
            return null;
        }

        console.log(`✅ SUBMISSION FOUND - Retrieving badge details...`);

        // Get total submissions to iterate through
        const totalSubmissions = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "totalSubmissions",
            args: [],
        });

        // Find the badge by iterating through submissions
        // Note: This is a simplified approach. In production, you'd want indexed events
        let foundBadge: BadgeInfo | null = null;
        let ownerAddress: string | null = null;

        // We'll need to check recent transactions or use events
        // For now, let's check if the current account has this badge
        if (john) {
            const userBadges = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "getUserBadges",
                args: [john.address],
            });

            foundBadge = userBadges.find((badge: BadgeInfo) => badge.submissionId === submissionId);
            if (foundBadge) {
                ownerAddress = john.address;
            }
        }

        if (!foundBadge) {
            console.log(`⚠️  BADGE OWNERSHIP UNKNOWN`);
            console.log(`   └─ Badge exists but owner address not provided. Use --owner parameter.`);
            return { exists: true, submissionId, owner: null, badge: null };
        }

        return await displayCompleteBadgeInfo(foundBadge, ownerAddress, submissionId);

    } catch (error) {
        console.error(`❌ Error retrieving badge:`, error);
        throw error;
    }
}

// Retrieve badge by owner address and submission ID
async function getBadgeByOwnerAndSubmission(ownerAddress: string, submissionId: string) {
    console.log(`🔍 RETRIEVING BADGE BY OWNER & SUBMISSION`);
    console.log(`👤 Owner: ${ownerAddress}`);
    console.log(`📄 Submission ID: ${submissionId}`);
    console.log("=".repeat(60));

    try {
        const userBadges = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserBadges",
            args: [ownerAddress],
        });

        const foundBadge = userBadges.find((badge: BadgeInfo) => badge.submissionId === submissionId);

        if (!foundBadge) {
            console.log(`❌ BADGE NOT FOUND`);
            console.log(`   └─ No badge with submission ID "${submissionId}" found for address ${ownerAddress}`);
            return null;
        }

        return await displayCompleteBadgeInfo(foundBadge, ownerAddress, submissionId);

    } catch (error) {
        console.error(`❌ Error retrieving badge:`, error);
        throw error;
    }
}

// Retrieve badge by Token ID
async function getBadgeByTokenId(tokenId: string, ownerAddress?: string) {
    console.log(`🔍 RETRIEVING BADGE BY TOKEN ID`);
    console.log(`🎫 Token ID: #${tokenId}`);
    if (ownerAddress) console.log(`👤 Owner: ${ownerAddress}`);
    console.log("=".repeat(60));

    try {
        if (ownerAddress) {
            const userBadges = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "getUserBadges",
                args: [ownerAddress],
            });

            const foundBadge = userBadges.find((badge: BadgeInfo) => badge.tokenId.toString() === tokenId);

            if (!foundBadge) {
                console.log(`❌ BADGE NOT FOUND`);
                console.log(`   └─ No badge with Token ID #${tokenId} found for address ${ownerAddress}`);
                return null;
            }

            return await displayCompleteBadgeInfo(foundBadge, ownerAddress);
        } else {
            console.log(`⚠️  OWNER ADDRESS REQUIRED`);
            console.log(`   └─ Please provide owner address to retrieve badge by Token ID`);
            return null;
        }

    } catch (error) {
        console.error(`❌ Error retrieving badge:`, error);
        throw error;
    }
}

// Search for badges by multiple criteria
async function searchBadges(criteria: {
    owner?: string;
    platform?: string;
    severity?: string;
    minMerits?: number;
    maxMerits?: number;
    startDate?: Date;
    endDate?: Date;
}) {
    console.log(`🔍 SEARCHING BADGES WITH CRITERIA`);
    console.log("=".repeat(40));

    if (criteria.owner) console.log(`👤 Owner: ${criteria.owner}`);
    if (criteria.platform) console.log(`🏢 Platform: ${criteria.platform}`);
    if (criteria.severity) console.log(`⚠️  Severity: ${criteria.severity}`);
    if (criteria.minMerits) console.log(`📈 Min Merits: ${criteria.minMerits}`);
    if (criteria.maxMerits) console.log(`📉 Max Merits: ${criteria.maxMerits}`);
    if (criteria.startDate) console.log(`📅 After: ${criteria.startDate.toLocaleDateString()}`);
    if (criteria.endDate) console.log(`📅 Before: ${criteria.endDate.toLocaleDateString()}`);

    try {
        if (!criteria.owner) {
            console.log(`❌ OWNER ADDRESS REQUIRED`);
            console.log(`   └─ Please provide owner address for badge search`);
            return [];
        }

        const userBadges = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserBadges",
            args: [criteria.owner],
        });

        let filteredBadges = userBadges.filter((badge: BadgeInfo) => {
            // Platform filter
            if (criteria.platform && badge.platform !== criteria.platform) return false;

            // Severity filter
            if (criteria.severity && badge.severity !== criteria.severity) return false;

            // Merit filters
            if (criteria.minMerits && Number(badge.merits) < criteria.minMerits) return false;
            if (criteria.maxMerits && Number(badge.merits) > criteria.maxMerits) return false;

            // Date filters
            const badgeDate = new Date(Number(badge.timestamp) * 1000);
            if (criteria.startDate && badgeDate < criteria.startDate) return false;
            if (criteria.endDate && badgeDate > criteria.endDate) return false;

            return true;
        });

        console.log(`\n📊 SEARCH RESULTS: ${filteredBadges.length} badges found`);

        filteredBadges.forEach((badge: BadgeInfo, index: number) => {
            console.log(`\n🏅 Badge #${index + 1}:`);
            console.log(`   ├─ Platform: ${badge.platform}`);
            console.log(`   ├─ Severity: ${badge.severity}`);
            console.log(`   ├─ Merits: ${badge.merits.toString()}`);
            console.log(`   ├─ Token ID: #${badge.tokenId.toString()}`);
            console.log(`   └─ Date: ${new Date(Number(badge.timestamp) * 1000).toLocaleDateString()}`);
        });

        return filteredBadges;

    } catch (error) {
        console.error(`❌ Error searching badges:`, error);
        throw error;
    }
}

// Utility function to get badge from prover submission data
async function getBadgeFromProverData(proverSubmission: ProverSubmission, ownerAddress: string) {
    console.log(`🔍 RETRIEVING BADGE FROM PROVER DATA`);
    console.log("=".repeat(50));

    return await getBadgeByOwnerAndSubmission(ownerAddress, proverSubmission.submissionId);
}

// Main CLI function
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("🎯 BUG BOUNTY BADGE RETRIEVER");
        console.log("Usage:");
        console.log("  --submission <id>                    # Get badge by submission ID");
        console.log("  --owner <address> --submission <id>  # Get badge by owner + submission");
        console.log("  --token <id> --owner <address>       # Get badge by token ID");
        console.log("  --search --owner <address>           # Search all badges for owner");
        console.log("  --search --owner <address> --platform <name>  # Search with filters");
        return;
    }

    try {
        if (args.includes("--submission") && !args.includes("--owner")) {
            const submissionIndex = args.indexOf("--submission") + 1;
            const submissionId = args[submissionIndex];
            await getBadgeBySubmissionId(submissionId);
        }
        else if (args.includes("--owner") && args.includes("--submission")) {
            const ownerIndex = args.indexOf("--owner") + 1;
            const submissionIndex = args.indexOf("--submission") + 1;
            const ownerAddress = args[ownerIndex];
            const submissionId = args[submissionIndex];
            await getBadgeByOwnerAndSubmission(ownerAddress, submissionId);
        }
        else if (args.includes("--token") && args.includes("--owner")) {
            const tokenIndex = args.indexOf("--token") + 1;
            const ownerIndex = args.indexOf("--owner") + 1;
            const tokenId = args[tokenIndex];
            const ownerAddress = args[ownerIndex];
            await getBadgeByTokenId(tokenId, ownerAddress);
        }
        else if (args.includes("--search") && args.includes("--owner")) {
            const ownerIndex = args.indexOf("--owner") + 1;
            const ownerAddress = args[ownerIndex];

            const criteria: any = { owner: ownerAddress };

            if (args.includes("--platform")) {
                const platformIndex = args.indexOf("--platform") + 1;
                criteria.platform = args[platformIndex];
            }

            if (args.includes("--severity")) {
                const severityIndex = args.indexOf("--severity") + 1;
                criteria.severity = args[severityIndex];
            }

            await searchBadges(criteria);
        }
        else {
            console.log("❌ Invalid arguments. Use --help for usage information.");
        }

    } catch (error) {
        console.error("💥 Badge retrieval failed:", error);
        process.exit(1);
    }
}

// Export all functions
export {
    getBadgeBySubmissionId,
    getBadgeByOwnerAndSubmission,
    getBadgeByTokenId,
    searchBadges,
    getBadgeFromProverData,
    main
};

// Run if executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error("💥 Application error:", error);
        process.exit(1);
    });
}
