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

// Your deployed verifier contract address from the prove.ts output
const VERIFIER_ADDRESS = "0xa7be55e6774497b8581f4f5fe9684a5513c333c0";

// Function to verify a specific user's badges
export async function verifyUserBadges(userAddress: string) {
    console.log(`🔍 Verifying badges for user: ${userAddress}`);
    console.log("=".repeat(50));

    try {
        // Get user stats
        const userStats = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserStats",
            args: [userAddress],
        });

        console.log("📊 User Statistics:");
        console.log(`  - Total Merits: ${userStats[0].toString()}`);
        console.log(`  - Badge Count: ${userStats[1].toString()}`);
        console.log(`  - Critical Badges: ${userStats[2].toString()}`);
        console.log(`  - High Badges: ${userStats[3].toString()}`);
        console.log(`  - Medium Badges: ${userStats[4].toString()}`);
        console.log(`  - Low Badges: ${userStats[5].toString()}`);

        // Get all user badges
        const badges = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserBadges",
            args: [userAddress],
        });

        console.log(`\n🏆 Individual Badges (${badges.length}):`);

        if (badges.length === 0) {
            console.log("  No badges found for this user.");
            return { userStats, badges: [] };
        }

        badges.forEach((badge: any, index: number) => {
            console.log(`\n  Badge #${index + 1}:`);
            console.log(`    - Platform: ${badge.platform}`);
            console.log(`    - Severity: ${badge.severity}`);
            console.log(`    - Merits: ${badge.merits.toString()}`);
            console.log(`    - Submission ID: ${badge.submissionId}`);
            console.log(`    - Timestamp: ${new Date(Number(badge.timestamp) * 1000).toLocaleString()}`);
            console.log(`    - Verified: ${badge.verified ? '✅ Yes' : '❌ No'}`);
        });

        return { userStats, badges };

    } catch (error) {
        console.error("❌ Error verifying user badges:", error);
        throw error;
    }
}

// Function to verify a specific submission ID
export async function verifySubmissionId(submissionId: string) {
    console.log(`🔍 Verifying submission ID: ${submissionId}`);
    console.log("=".repeat(50));

    try {
        const isUsed = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "usedSubmissionIds",
            args: [submissionId],
        });

        if (isUsed) {
            console.log("✅ Submission ID is VALID and has been used");
            console.log("   This bounty has been successfully claimed on-chain");
        } else {
            console.log("❌ Submission ID is NOT FOUND");
            console.log("   This bounty has not been claimed or doesn't exist");
        }

        return isUsed;

    } catch (error) {
        console.error("❌ Error verifying submission ID:", error);
        throw error;
    }
}

// Function to get contract statistics
export async function getContractStats() {
    console.log("📈 Contract Statistics");
    console.log("=".repeat(50));

    try {
        const totalSubmissions = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "totalSubmissions",
            args: [],
        });

        console.log(`  - Total Submissions: ${totalSubmissions.toString()}`);
        console.log(`  - Contract Address: ${VERIFIER_ADDRESS}`);

        return { totalSubmissions };

    } catch (error) {
        console.error("❌ Error getting contract stats:", error);
        throw error;
    }
}

// Function to verify merit calculation
export async function verifyMeritCalculation(severity: string) {
    console.log(`🧮 Verifying merit calculation for severity: ${severity}`);

    try {
        const merits = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "calculateMerits",
            args: [severity],
        });

        console.log(`  - ${severity} severity awards: ${merits.toString()} merits`);
        return merits;

    } catch (error) {
        console.error("❌ Error verifying merit calculation:", error);
        throw error;
    }
}

// Main verification function
export async function main() {
    try {
        console.log("🎯 Bug Bounty Badge Verification Tool");
        console.log("=====================================\n");

        // Get contract stats
        await getContractStats();
        console.log();

        // Verify your own account (from the prove.ts run)
        if (john) {
            await verifyUserBadges(john.address);
            console.log();
        }

        // Verify the specific submission ID from your prove.ts output
        const submissionId = "SUB_faf303b1a7a1c3f19f5995f4da5540702277a32e3867c5c154ba5f5ee651e60c";
        await verifySubmissionId(submissionId);
        console.log();

        // Verify merit calculations
        console.log("💰 Merit System Verification:");
        await verifyMeritCalculation("Critical");
        await verifyMeritCalculation("High");
        await verifyMeritCalculation("Medium");
        await verifyMeritCalculation("Low");
        await verifyMeritCalculation("Unknown");

    } catch (error) {
        console.error("💥 Verification failed:", error);
        process.exit(1);
    }
}

// Command line interface
export async function verifySpecificUser(address: string) {
    console.log("🎯 Bug Bounty Badge Verification");
    console.log("=================================\n");
    await verifyUserBadges(address);
}

export async function verifySpecificSubmission(submissionId: string) {
    console.log("🎯 Bug Bounty Submission Verification");
    console.log("=====================================\n");
    await verifySubmissionId(submissionId);
}

// Run if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Run full verification
        main().then(() => {
            console.log("\n✨ Verification completed!");
            process.exit(0);
        }).catch((error) => {
            console.error("💥 Verification failed:", error);
            process.exit(1);
        });
    } else if (args[0] === "--user" && args[1]) {
        // Verify specific user
        verifySpecificUser(args[1]).then(() => {
            process.exit(0);
        }).catch((error) => {
            console.error("💥 User verification failed:", error);
            process.exit(1);
        });
    } else if (args[0] === "--submission" && args[1]) {
        // Verify specific submission
        verifySpecificSubmission(args[1]).then(() => {
            process.exit(0);
        }).catch((error) => {
            console.error("💥 Submission verification failed:", error);
            process.exit(1);
        });
    } else {
        console.log("Usage:");
        console.log("  bun run verify.ts                           # Full verification");
        console.log("  bun run verify.ts --user <address>          # Verify specific user");
        console.log("  bun run verify.ts --submission <id>         # Verify specific submission");
    }
}
