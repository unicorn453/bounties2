import { createVlayerClient } from "@vlayer/sdk";
import {
    getConfig,
    createContext,
    waitForContractDeploy,
} from "@vlayer/sdk/config";

import proverSpec from "../out/Prover.sol/BugBountyEmailProver.json";
import verifierSpec from "../out/BountyRegistry.sol/BugBountyRegistry.json";

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

// Save deployment addresses for other scripts to use
const deploymentData = {
    proverAddress,
    verifierAddress,
    chainId: chain.id,
    deployer: john.address,
    deployedAt: new Date().toISOString(),
};

// You can save this to a file or export it
console.log("\nDeployment complete!");
console.log("Deployment data:", JSON.stringify(deploymentData, null, 2));

// Export for use in other files
export {
    proverAddress as prover,
    verifierAddress as verifier,
    config,
    ethClient,
    john as account,
    proverSpec,
    verifierSpec,
};
