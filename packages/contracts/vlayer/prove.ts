import { createVlayerClient } from "@vlayer/sdk";
import {
  getConfig,
  createContext,
  deployVlayerContracts,
  waitForContractDeploy,
} from "@vlayer/sdk/config";

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

console.log("Deploying vlayer contracts...");

// First deploy the prover contract
console.log("Deploying prover contract...");
const proverDeployHash = await ethClient.deployContract({
  abi: proverSpec.abi,
  bytecode: proverSpec.bytecode.object,
  account: john,
  args: [], // BugBountyEmailProver doesn't need constructor args
});

const proverAddress = await waitForContractDeploy({
  client: ethClient,
  hash: proverDeployHash,
});

console.log("Prover deployed at:", proverAddress);

// Then deploy the verifier contract with the prover address
console.log("Deploying verifier contract...");
const verifierDeployHash = await ethClient.deployContract({
  abi: verifierSpec.abi,
  bytecode: verifierSpec.bytecode.object,
  account: john,
  args: [proverAddress], // BugBountyRegistry needs the prover address
});

const verifierAddress = await waitForContractDeploy({
  client: ethClient,
  hash: verifierDeployHash,
});

console.log("Verifier deployed at:", verifierAddress);

console.log("Proving...");
const vlayer = createVlayerClient({
  url: proverUrl,
  token: config.token,
});

// Generate proof using sample email data
const hash = await vlayer.prove({
  address: proverAddress,
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
console.log("  - Platform:", submission.platform);
console.log("  - Severity:", submission.severity);
console.log("  - Submission ID:", submission.submissionId);
console.log("  - Timestamp:", submission.timestamp.toString());
console.log("  - Is Valid:", submission.isValid);

console.log("Submitting proof to registry...");

// Workaround for viem estimating gas with `latest` block causing future block assumptions to fail on slower chains like mainnet/sepolia
const gas = await ethClient.estimateContractGas({
  address: verifierAddress,
  abi: verifierSpec.abi,
  functionName: "submitBugBountyProof",
  args: [proof, submission.platform, submission.severity, submission.submissionId],
  account: john,
  blockTag: "pending",
});

const verificationHash = await ethClient.writeContract({
  address: verifierAddress,
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
    address: verifierAddress,
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
} else {
  console.log("❌ Transaction failed");
}

// Export useful values for other scripts
export {
  proverAddress as prover,
  verifierAddress as verifier,
  proof,
  submission,
  config,
  ethClient,
  john as account,
};
