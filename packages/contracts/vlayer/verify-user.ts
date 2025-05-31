import {
    getConfig,
    createContext,
} from "@vlayer/sdk/config";

import verifierSpec from "../out/BountyRegistry.sol/BugBountyRegistry.json";

// Hardcoded addresses
const VERIFIER_ADDRESS = "0x611236b1276616e497bde86005c9944121a34633";
const JOHN_ADDRESS = "0xB05399c0F4EE747Ce3ee757040f4a306068Ae191";

const config = getConfig();
const { ethClient } = createContext(config);

console.log({ config })

async function readBugBountyStats() {
    try {
        console.log("🎉 Bug bounty badge successfully awarded!");

        // Get user stats after submission
        const userStats = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserStats",
            args: [JOHN_ADDRESS],
        });
        console.log(userStats)

        console.log("Updated user stats:");
        console.log("  - Total Merits:", userStats[0].toString());
        console.log("  - Badge Count:", userStats[1].toString());
        console.log("  - Critical Count:", userStats[2].toString());
        console.log("  - High Count:", userStats[3].toString());
        console.log("  - Medium Count:", userStats[4].toString());
        console.log("  - Low Count:", userStats[5].toString());

        // Get badge details
        const badges = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserBadges",
            args: [JOHN_ADDRESS],
        });

        console.log("\nBadge details:");
        badges.forEach((badge: any, index: number) => {
            console.log(`\nBadge #${index + 1}:`);
            console.log("  - Platform:", badge.platform);
            console.log("  - Severity:", badge.severity);
            console.log("  - Merits:", badge.merits.toString());
            console.log("  - Token ID:", badge.tokenId.toString());
            console.log("  - Verified:", badge.verified);
        });

    } catch (error) {
        console.log("❌ Error reading stats:", error);
    }
}

// Run the stats reader
readBugBountyStats();

// Export useful values for other scripts
export {
    VERIFIER_ADDRESS as verifier,
    JOHN_ADDRESS as account,
    config,
    ethClient,
};
