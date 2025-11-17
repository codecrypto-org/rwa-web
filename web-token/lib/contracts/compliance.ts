/**
 * Compliance Aggregator Configuration
 * 
 * Address: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
 */

export const COMPLIANCE_AGGREGATOR_ADDRESS = "0x5b73c5498c1e3b4dba84de0f1833c4a029d90519" as const;

// Minimal ABI for ModularCompliance contract interactions
export const MODULAR_COMPLIANCE_ABI = [
  {
    "type": "function",
    "name": "addModule",
    "inputs": [
      {
        "name": "_module",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "bindToken",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unbindToken",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isModuleBound",
    "inputs": [
      {
        "name": "_module",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getModules",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "removeModule",
    "inputs": [
      {
        "name": "_module",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

// Token ABI for setCompliance
export const TOKEN_COMPLIANCE_ABI = [
  {
    "type": "function",
    "name": "setCompliance",
    "inputs": [
      {
        "name": "_compliance",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "compliance",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
] as const;

/**
 * Investment Claim Topics
 * 
 * These claim topics are required for investors to hold and transfer tokens
 */
export const INVESTMENT_CLAIM_TOPICS = {
  KYC: 1,                    // Know Your Customer verification
  ACCREDITATION: 7,          // Accredited investor status
  JURISDICTION: 9,           // Jurisdiction compliance
} as const;

export const CLAIM_TOPIC_NAMES: Record<number, string> = {
  1: "KYC - Know Your Customer",
  7: "Accreditation - Accredited Investor",
  9: "Jurisdiction - Geographic Compliance",
};

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: 31337,
  chainName: "Anvil Local",
  rpcUrl: "http://localhost:8545",
} as const;

