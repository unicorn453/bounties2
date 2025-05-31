import { createVlayerClient } from "@vlayer/sdk";
import {
    getConfig,
    createContext,
} from "@vlayer/sdk/config";

// Hardcoded addresses from deployment
const PROVER_ADDRESS = "0x88b31c157496dda16062c6dbd169b627fa610be5";
const VERIFIER_ADDRESS = "0x3d316b3f13c3533a2a4f7f516d0b572365f052e8";
import proverSpec from "../out/Prover.sol/BugBountyEmailProver.json";
import verifierSpec from "../out/BountyRegistry.sol/BugBountyRegistry.json";

// Sample email content and headers for testing
const SAMPLE_EMAIL_CONTENT = `
Subject: Congratulations! Your Bug Bounty Reward is Ready

Dear Security Researcher,

Congratulations on your successful bug bounty submission! 

We are pleased to inform you that your critical vulnerability report has been validated and approved for a bounty reward. Your dedication to security research helps make the internet safer for everyone.

Submission Details:
- Severity: Critical
- Platform: HackerOne
- Status: Approved
- Reward: $5,000

Your bounty reward will be processed within the next 5-7 business days.

Thank you for your contribution to our security program!

Best regards,
HackerOne Security Team
`;

const SAMPLE_EMAIL_HEADERS = `
DKIM-Signature: v=1; a=rsa-sha256; d=hackerone.com; s=selector1; c=relaxed/relaxed; h=from:to:subject:date; b=abc123...
Authentication-Results: mx.google.com; spf=pass smtp.mailfrom=hackerone.com
From: security@hackerone.com
To: researcher@example.com
Subject: Congratulations! Your Bug Bounty Reward is Ready
Date: Fri, 30 May 2025 10:00:00 +0000
Message-ID: <12345@hackerone.com>
`;

// Configuration setup
const config = getConfig();
const {
    chain,
    ethClient,
    account: john,
    proverUrl,
    confirmations,
} = createContext(config);

if (!john) {
    throw new Error(
        "No account found make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables",
    );
}

// You need to provide the deployed contract addresses
async function mintBadge() {

    console.log("Generating proof for bug bounty badge...");
    console.log("Using prover at:", PROVER_ADDRESS);
    console.log("Using verifier at:", VERIFIER_ADDRESS);

    const vlayer = createVlayerClient({
        url: proverUrl,
        token: config.token,
    });

    // Generate proof using sample email data
    console.log("Proving...");
    const hash = await vlayer.prove({
        address: PROVER_ADDRESS,
        proverAbi: proverSpec.abi,
        functionName: "prove",
        args: [SAMPLE_EMAIL_CONTENT, SAMPLE_EMAIL_HEADERS],
        chainId: chain.id,
        gasLimit: config.gasLimit,
    });

    console.log("Waiting for proving result...");
    const result = await vlayer.waitForProvingResult({ hash });
    const [proof, submission] = result;

    console.log("Proof generated successfully!");
    console.log("Submission details:");
    console.log("  - Reporter:", submission.reporter);
    console.log("  - Platform:", submission.platform);
    console.log("  - Severity:", submission.severity);
    console.log("  - Merits:", submission.merits.toString());
    console.log("  - Submission ID:", submission.submissionId);
    console.log("  - Timestamp:", submission.timestamp.toString());
    console.log("  - Verified:", submission.verified);
    console.log("  - Token ID:", submission.tokenId.toString());

    console.log("Submitting proof to registry...");

    // Workaround for viem estimating gas with `latest` block causing future block assumptions to fail on slower chains like mainnet/sepolia
    const gas = await ethClient.estimateContractGas({
        address: VERIFIER_ADDRESS,
        abi: verifierSpec.abi,
        functionName: "submitBugBountyProof",
        args: [proof, submission.platform, submission.severity, submission.submissionId],
        account: john,
        blockTag: "pending",
    });

    const verificationHash = await ethClient.writeContract({
        address: VERIFIER_ADDRESS,
        abi: verifierSpec.abi,
        functionName: "submitBugBountyProof",
        args: [proof, submission.platform, submission.severity, submission.submissionId],
        account: john,
        gas,
    });

    console.log("Waiting for transaction confirmation...");
    const receipt = await ethClient.waitForTransactionReceipt({
        hash: verificationHash,
        confirmations,
        retryCount: 60,
        retryDelay: 1000,
    });

    console.log(`Verification result: ${receipt.status}`);

    if (receipt.status === "success") {
        console.log("🎉 Bug bounty badge successfully awarded!");

        // Get user stats after submission
        const userStats = await ethClient.readContract({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            functionName: "getUserStats",
            args: [john.address],
        });

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
            args: [john.address],
        });

        console.log("\nBadge details:");
        badges.forEach((badge, index) => {
            console.log(`\nBadge #${index + 1}:`);
            console.log("  - Platform:", badge.platform);
            console.log("  - Severity:", badge.severity);
            console.log("  - Merits:", badge.merits.toString());
            console.log("  - Token ID:", badge.tokenId.toString());
            console.log("  - Verified:", badge.verified);
        });
    } else {
        console.log("❌ Transaction failed");
    }

    return { proof, submission, receipt };
}

// Example usage - uncomment to run:
mintBadge();

// Export the function for use in other files
export { mintBadge };
