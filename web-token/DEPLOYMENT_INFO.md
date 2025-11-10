# TokenCloneFactory - Deployment Information

## ✅ Deployment Status: SUCCESS

---

## 📋 Contract Details

| Property | Value |
|----------|-------|
| **Contract Name** | TokenCloneFactory |
| **Factory Address** | `0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519` |
| **Implementation Address** | `0xC7f2Cf4845C6db0e1a1e91ED41Bcd0FcC1b0E141` |
| **Network** | Anvil Local (Chain ID: 31337) |
| **RPC URL** | http://localhost:8545 |
| **Owner** | `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38` |

---

## ⚡ Gas Savings (EIP-1167 Minimal Proxy)

| Metric | Value |
|--------|-------|
| **Clone Deployment** | ~50,000 gas |
| **Full Deployment** | ~3,000,000 gas |
| **Gas Saved** | ~2,950,000 gas |
| **Savings Percentage** | **98.3%** 🎉 |

This means you can deploy **60 token clones** for the cost of **1 full token deployment**!

---

## 👤 Owner Information

| Property | Value |
|----------|-------|
| **Owner Address** | `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38` |
| **Note** | This is Foundry's default sender (Anvil) |

> ⚠️ **WARNING**: This is a development account. Never use in production!

---

## 📦 Files Created in Web Application

```
web-token/
├── lib/
│   ├── contracts/
│   │   ├── TokenCloneFactory.ts         ✅ Contract ABI & Addresses
│   │   ├── index.ts                     ✅ Central exports
│   │   └── README.md                    ✅ Contract documentation
│   └── examples/
│       └── TokenFactoryExample.tsx      ✅ React component example
├── DEPLOYMENT_INFO.md                   ✅ This file
└── README.md                            ✅ Updated with contract info
```

---

## 🔗 Contract ABI Location

The complete ABI is available in:
```
lib/contracts/TokenCloneFactory.ts
```

To import in your code:
```typescript
import { 
  TOKEN_CLONE_FACTORY_ADDRESS,
  TOKEN_IMPLEMENTATION_ADDRESS,
  TOKEN_CLONE_FACTORY_ABI,
  NETWORK_CONFIG,
  FACTORY_OWNER,
  GAS_SAVINGS,
} from '@/lib/contracts';
```

---

## 🎯 Available Contract Functions

### Write Functions (Public - Anyone Can Call)

```solidity
// Create a basic token clone
function createToken(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    address admin
) external returns (address token)

// Create a token clone with registries pre-configured
function createTokenWithRegistries(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    address admin,
    address identityRegistry,
    address trustedIssuersRegistry,
    address claimTopicsRegistry
) external returns (address token)
```

### Write Functions (Owner Only)

```solidity
// Transfer factory ownership
function transferOwnership(address newOwner) external

// Renounce ownership
function renounceOwnership() external
```

### Read Functions (Public - No Gas)

```solidity
// Get total number of tokens created
function getTotalTokens() external view returns (uint256)

// Get all tokens created by a specific admin
function getTokensByAdmin(address admin) external view returns (address[])

// Get token at specific index
function getTokenAt(uint256 index) external view returns (address)

// Get implementation contract address
function implementation() external view returns (address)

// Get factory owner
function owner() external view returns (address)

// Get gas savings information
function getGasSavingsInfo() external pure returns (string memory)

// Get token from admin's array
function adminTokens(address admin, uint256 index) external view returns (address)

// Get token from global array
function allTokens(uint256 index) external view returns (address)
```

---

## 🎪 Events

The contract emits the following events:

```solidity
// Emitted when a new token is created
event TokenCreated(
    address indexed token,
    address indexed admin,
    string name,
    string symbol,
    uint8 decimals
)

// Emitted when factory ownership is transferred
event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
)
```

---

## 🚀 Quick Usage Examples

### Example 1: Get All Tokens

```typescript
import { ethers } from 'ethers';
import { TOKEN_CLONE_FACTORY_ADDRESS, TOKEN_CLONE_FACTORY_ABI } from '@/lib/contracts';

const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const factory = new ethers.Contract(
  TOKEN_CLONE_FACTORY_ADDRESS,
  TOKEN_CLONE_FACTORY_ABI,
  provider
);

const totalTokens = await factory.getTotalTokens();
console.log('Total tokens created:', totalTokens.toString());

// Get all token addresses
for (let i = 0; i < totalTokens; i++) {
  const tokenAddress = await factory.getTokenAt(i);
  console.log(`Token #${i + 1}:`, tokenAddress);
}
```

### Example 2: Create a New Token

```typescript
import { ethers } from 'ethers';
import { TOKEN_CLONE_FACTORY_ADDRESS, TOKEN_CLONE_FACTORY_ABI } from '@/lib/contracts';

// Connect with MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const factory = new ethers.Contract(
  TOKEN_CLONE_FACTORY_ADDRESS,
  TOKEN_CLONE_FACTORY_ABI,
  signer
);

// Create token
const tx = await factory.createToken(
  "My Security Token",      // name
  "MST",                    // symbol
  18,                       // decimals
  await signer.getAddress() // admin
);

console.log('Transaction hash:', tx.hash);
const receipt = await tx.wait();
console.log('Token created!');

// Get the new token address from the event
const event = receipt.logs.find(log => {
  try {
    return factory.interface.parseLog(log)?.name === 'TokenCreated';
  } catch {
    return false;
  }
});

if (event) {
  const parsed = factory.interface.parseLog(event);
  console.log('New token address:', parsed.args.token);
}
```

### Example 3: Get Tokens by Admin

```typescript
const adminAddress = '0x...';
const adminTokens = await factory.getTokensByAdmin(adminAddress);
console.log('Tokens created by admin:', adminTokens);
```

### Example 4: Listen to Token Creation Events

```typescript
factory.on('TokenCreated', (token, admin, name, symbol, decimals, event) => {
  console.log('New token created!');
  console.log('Token address:', token);
  console.log('Admin:', admin);
  console.log('Name:', name);
  console.log('Symbol:', symbol);
  console.log('Decimals:', decimals);
});
```

---

## 🔐 Understanding the Clone Pattern

### What is EIP-1167?

EIP-1167 (Minimal Proxy) is a standard for creating contract clones:

1. **Implementation Contract**: Deployed once, contains all the logic
2. **Clone Contracts**: Lightweight proxies that delegate calls to the implementation
3. **Separate State**: Each clone has its own storage and admin

### Benefits

- ✅ **98.3% gas savings** on deployment
- ✅ **Same functionality** as full contracts
- ✅ **Independent operation** - each token is separate
- ✅ **Audited code** - all tokens use the same implementation
- ✅ **Upgradeable** (if implementation is upgradeable)

### How It Works

```
┌─────────────────────────┐
│  Implementation         │  ← Deployed once
│  (TokenCloneable)       │  ← Contains all logic
│  0xC7f2Cf...           │
└─────────────────────────┘
           ↑
           │ delegatecall
           │
┌──────────┴──────────┬─────────────────┬─────────────────┐
│  Clone #1           │  Clone #2       │  Clone #3       │
│  Token A            │  Token B        │  Token C        │
│  0x1234...          │  0x5678...      │  0x9abc...      │
│  ~50k gas           │  ~50k gas       │  ~50k gas       │
└─────────────────────┴─────────────────┴─────────────────┘
```

---

## 📊 Deployment Script Location

The deployment script is located at:
```
../56_RWA_SC/sc/script/DeployTokenCloneFactory.s.sol
```

To redeploy:
```bash
cd ../56_RWA_SC/sc
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployTokenCloneFactory.s.sol:DeployTokenCloneFactory \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

## 🧪 Testing the Integration

### Step 1: Verify Factory is Deployed

```bash
cast call 0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519 \
  "owner()(address)" \
  --rpc-url http://localhost:8545
```

Expected output: `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38`

### Step 2: Check Implementation Address

```bash
cast call 0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519 \
  "implementation()(address)" \
  --rpc-url http://localhost:8545
```

Expected output: `0xC7f2Cf4845C6db0e1a1e91ED41Bcd0FcC1b0E141`

### Step 3: Get Total Tokens

```bash
cast call 0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519 \
  "getTotalTokens()(uint256)" \
  --rpc-url http://localhost:8545
```

### Step 4: Create a Test Token

```bash
cast send 0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519 \
  "createToken(string,string,uint8,address)(address)" \
  "Test Token" "TST" 18 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

---

## 📝 Next Steps

1. ✅ Factory deployed successfully
2. ✅ ABI and addresses configured in web app
3. ✅ Example component created
4. ⏭️ Install dependencies: `npm install && npm install ethers`
5. ⏭️ Start development server: `npm run dev`
6. ⏭️ Connect MetaMask to Anvil network
7. ⏭️ Create your first token!
8. ⏭️ Build your custom UI

---

## 📚 Documentation References

- **Contract Documentation**: `lib/contracts/README.md`
- **Example Component**: `lib/examples/TokenFactoryExample.tsx`
- **Main README**: `README.md`
- **EIP-1167 Standard**: https://eips.ethereum.org/EIPS/eip-1167

---

## 🆘 Support & Troubleshooting

### Common Issues

1. **Cannot connect to contract**
   - Ensure Anvil is running: `anvil`
   - Check the RPC URL: `http://localhost:8545`
   - Verify contract address is correct

2. **MetaMask not connecting**
   - Add Anvil network to MetaMask (Chain ID: 31337)
   - Use RPC URL: http://localhost:8545
   - Import an Anvil test account

3. **Transaction fails**
   - Check you have enough ETH for gas
   - Verify all parameters are correct
   - Ensure admin address is valid

4. **Created tokens not showing**
   - Wait for transaction confirmation
   - Refresh the page
   - Check transaction was successful

---

## ✨ Summary

The TokenCloneFactory contract has been successfully deployed and integrated into your web application. All necessary files have been created with:

- ✅ Complete ABI and contract addresses
- ✅ TypeScript configuration with full type safety
- ✅ Example React component with UI
- ✅ Comprehensive documentation
- ✅ Usage examples for multiple scenarios
- ✅ Gas optimization information

You're ready to start creating tokens with 98.3% gas savings! 🎉

---

**Deployment Date**: November 10, 2025  
**Deployed by**: Smart Contract Deployment System  
**Environment**: Development (Anvil Local)  
**Pattern**: EIP-1167 Minimal Proxy / Clone Factory

