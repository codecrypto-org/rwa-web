/**
 * Registry Contract Addresses
 * 
 * Shared registry contracts used across all tokens
 * These are deployed once and shared by all tokens
 */

// Identity Registry - Shared across all tokens
export const IDENTITY_REGISTRY_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' as const;

// Trusted Issuers Registry - Shared across all tokens
export const TRUSTED_ISSUERS_REGISTRY_ADDRESS = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0' as const;

// Identity Clone Factory
export const IDENTITY_CLONE_FACTORY_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3' as const;

/**
 * ClaimTopicsRegistry ABI for creating new registries per token
 */
export const CLAIM_TOPICS_REGISTRY_ABI = [
  {
    "type": "function",
    "name": "addClaimTopic",
    "inputs": [
      {
        "name": "_claimTopic",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getClaimTopics",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  }
] as const;

