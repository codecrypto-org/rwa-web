import { ethers } from 'ethers';
import IdentityRegistryABI from '../contracts/IdentityRegistry.abi.json';
import IdentityCloneFactoryABI from '../contracts/IdentityCloneFactory.abi.json';

// Contract addresses from smart_contract.txt
export const IDENTITY_REGISTRY_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512';
export const IDENTITY_FACTORY_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

// Anvil RPC URL 
export const ANVIL_RPC_URL = 'http://127.0.0.1:8545';
export const ANVIL_CHAIN_ID = '0x7a69'; // 31337 in hex

/**
 * Get an ethers provider for the Anvil network
 */
export function getProvider() {
  return new ethers.JsonRpcProvider(ANVIL_RPC_URL);
}

/**
 * Get the preferred wallet provider
 * @internal Used by WalletContext
 */
function getPreferredProvider() {
  if (typeof window === 'undefined') {
    return null;
  }

  // Use window.ethereum (MetaMask or other compatible wallet)
  if (window.ethereum) {
    return window.ethereum;
  }

  return null;
}

/**
 * Add or switch to Anvil network in the connected wallet
 */
export async function setupAnvilNetwork() {
  const provider = getPreferredProvider();
  if (!provider) {
    throw new Error('No crypto wallet detected');
  }

  const walletName = getWalletName();

  try {
    // Try to switch to Anvil network
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ANVIL_CHAIN_ID }],
    });
  } catch (switchError) {
    const error = switchError as { code?: number; message?: string };
    // This error code indicates that the chain has not been added to the wallet
    if (error.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ANVIL_CHAIN_ID,
              chainName: 'Anvil Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [ANVIL_RPC_URL],
            },
          ],
        });
      } catch {
        throw new Error(`Failed to add Anvil network to ${walletName}`);
      }
    } else {
      throw error;
    }
  }
}

/**
 * Detect which wallet is installed
 */
export function getWalletName(): string {
  const provider = getPreferredProvider();
  if (!provider) {
    return 'None';
  }
  if (provider.isMetaMask) {
    return 'MetaMask';
  }
  if (provider.isCoinbaseWallet) {
    return 'Coinbase Wallet';
  }
  return 'Unknown Wallet';
}

/**
 * Debug function to see what wallets are available
 */
export function debugWallets() {
  if (typeof window === 'undefined') {
    return 'Not in browser';
  }
  
  const info: {
    hasEthereum: boolean;
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      hasProviders: boolean;
      providersCount: number;
    };
  } = {
    hasEthereum: !!window.ethereum,
  };

  if (window.ethereum) {
    info.ethereum = {
      isMetaMask: window.ethereum.isMetaMask,
      isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
      hasProviders: !!window.ethereum.providers,
      providersCount: window.ethereum.providers?.length || 0,
    };
  }

  console.log('🔍 Wallet Debug Info:', info);
  return info;
}

/**
 * Get the IdentityRegistry contract instance
 * @param signerOrProvider - Optional signer or provider. If not provided, uses read-only provider
 */
export function getIdentityRegistryContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(
    IDENTITY_REGISTRY_ADDRESS,
    IdentityRegistryABI,
    provider
  );
}

/**
 * Get the IdentityCloneFactory contract instance
 * @param signerOrProvider - Optional signer or provider. If not provided, uses read-only provider
 */
export function getIdentityCloneFactoryContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(
    IDENTITY_FACTORY_ADDRESS,
    IdentityCloneFactoryABI,
    provider
  );
}

/**
 * Check if an address is registered in the IdentityRegistry
 */
export async function isAddressRegistered(address: string): Promise<boolean> {
  try {
    const registry = getIdentityRegistryContract();
    const result = await registry.isRegistered(address);
    return result;
  } catch (error) {
    console.error('Error calling isRegistered:', error);
    // If the contract call fails, assume not registered
    return false;
  }
}

/**
 * Get the identity contract address for a wallet address
 */
export async function getIdentityAddress(walletAddress: string): Promise<string> {
  try {
    const registry = getIdentityRegistryContract();
    const result = await registry.getIdentity(walletAddress);
    return result;
  } catch (error) {
    console.error('Error calling getIdentity:', error);
    return '0x0000000000000000000000000000000000000000';
  }
}

