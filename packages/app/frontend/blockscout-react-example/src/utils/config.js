import { getConfig, createContext } from "@vlayer/sdk/config";

// Sepolia testnet configuration
export const VERIFIER_ADDRESS = "0x17deb0c92eca8a255de83dd677d35f5675b26f7d";
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia chain ID
  name: 'Sepolia',
  rpcUrl: 'https://rpc.sepolia.org',
};

// Initialize configuration
export const initializeConfig = () => {
  const config = getConfig();
  const context = createContext(config);
  return {
    ethClient: context.ethClient,
    account: context.account,
  };
};

// ABI will be imported from your contract JSON
export const CONTRACT_ABI = {
  // We'll need to import this from your contract JSON
  // For now, we'll define the methods we need
  "abi": [
    {
      "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
      "name": "getUserStats",
      "outputs": [
        {"internalType": "uint256", "name": "totalMerits", "type": "uint256"},
        {"internalType": "uint256", "name": "badgeCount", "type": "uint256"},
        {"internalType": "uint256", "name": "criticalBadges", "type": "uint256"},
        {"internalType": "uint256", "name": "highBadges", "type": "uint256"},
        {"internalType": "uint256", "name": "mediumBadges", "type": "uint256"},
        {"internalType": "uint256", "name": "lowBadges", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
      "name": "getUserBadges",
      "outputs": [
        {
          "components": [
            {"internalType": "string", "name": "platform", "type": "string"},
            {"internalType": "string", "name": "severity", "type": "string"},
            {"internalType": "uint256", "name": "merits", "type": "uint256"},
            {"internalType": "string", "name": "submissionId", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "bool", "name": "verified", "type": "bool"}
          ],
          "internalType": "struct BugBountyRegistry.Badge[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "submissionId", "type": "string"}],
      "name": "usedSubmissionIds",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSubmissions",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "severity", "type": "string"}],
      "name": "calculateMerits",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
}; 