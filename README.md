# RWA Identity Management dApp

A decentralized application for creating and managing on-chain identities for Real World Asset (RWA) tokenization.

## Architecture

This system implements a two-contract architecture:

1. **IdentityCloneFactory** (`0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`)
   - Creates identity contracts using EIP-1167 minimal proxy pattern
   - Anyone can create an identity for themselves
   - Gas-efficient: ~45k gas vs ~800k for full deployment

2. **IdentityRegistry** (`0xa513E6E4b8f2a923D98304ec87F64353C4D5C853`)
   - Centralized registry mapping wallet addresses to identity contracts
   - **Self-registration enabled**: Users can register their own identities
   - Used for tracking and managing identity contracts

## Quick Start

### Prerequisites

1. **Anvil** (local Ethereum node) running on `http://localhost:8545`
2. **CodeCrypto** or **MetaMask** browser extension
3. **Node.js** and **npm** installed

### Setup

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000`

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and authorize CodeCrypto/MetaMask
2. **Create Identity**: Click "Create Identity" to deploy and register your identity
   - This will create two transactions:
     - Transaction 1: Create identity contract (via IdentityCloneFactory)
     - Transaction 2: Register identity in registry (via IdentityRegistry)
3. **Status**: Once completed, your identity will show as "Registered" ✅

## Test Accounts (Anvil Default)

| Role | Address | Private Key |
|------|---------|-------------|
| Admin/Owner | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| User 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| User 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

## Redeploying Contracts

If you restart Anvil, you'll need to redeploy the contracts:

```bash
cd ../56_RWA_SC/sc

# Deploy IdentityCloneFactory
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployIdentityCloneFactory.s.sol:DeployIdentityCloneFactory \
  --rpc-url http://localhost:8545 \
  --broadcast

# Deploy IdentityRegistry
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployIdentityRegistry.s.sol:DeployIdentityRegistry \
  --rpc-url http://localhost:8545 \
  --broadcast
```

Then update the addresses in:
- `smart_contract.txt`
- `web/lib/contracts.ts`

## Contract Addresses

Current deployment on Anvil (Chain ID: 31337):

```
IdentityRegistry=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
IdentityFactory=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Implementation=0x75537828f2ce51be7289709686A69CbFDbB714F1
```

## Troubleshooting

### "Missing revert data" error
- **Cause**: Contracts don't exist at the specified addresses (Anvil was restarted)
- **Solution**: Redeploy contracts (see above) and update addresses

### Wallet won't connect
- **Check**: Anvil is running on `http://localhost:8545`
- **Check**: Add Anvil network in wallet settings (Chain ID: 31337, RPC: http://localhost:8545)
- **Try**: Refresh the page and reconnect

## Architecture Notes

### Why Two Contracts?

**IdentityCloneFactory**:
- Permissionless - anyone can create identities
- Gas-efficient using EIP-1167 clones (~94% gas savings)
- Users maintain full ownership of their identity contracts
- Creates minimal proxy clones pointing to a single implementation

**IdentityRegistry**:
- Central registry mapping wallet addresses to identity contracts
- Self-registration enabled - users can register their own identities
- Provides a lookup service for finding identity contracts
- Can be queried by other contracts or dApps

This design separates **identity creation** (via factory) from **identity tracking** (via registry), providing flexibility and gas efficiency while maintaining a centralized lookup service.

## Technology Stack

- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin, Foundry
- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Blockchain**: Ethereum (local Anvil testnet)
- **Web3**: ethers.js v6
- **Wallet**: CodeCrypto / MetaMask

## License

MIT

