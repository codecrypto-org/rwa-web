'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import {
  TOKEN_CLONE_FACTORY_ADDRESS,
  NETWORK_CONFIG,
  GAS_SAVINGS,
} from '@/lib/contracts';
import CreateTokenForm from '@/components/CreateTokenForm';
import TokensList from '@/components/TokensList';

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTokenCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Por favor instala MetaMask para continuar!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setUserAddress(address);
      setConnected(true);
      
      console.log('Wallet conectada:', address);
    } catch (err) {
      console.error('Error conectando wallet:', err);
      alert('Error al conectar la wallet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 font-sans dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            🚀 RWA Token Factory
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Create compliant security tokens with automated investor verification
          </p>
          
          {/* Navigation */}
          <div className="mt-4 flex justify-center gap-4">
            <a
              href="/"
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white"
            >
              🏭 Factory
            </a>
            <a
              href="/marketplace"
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              🏪 Marketplace
            </a>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Status</p>
            {connected ? (
              <p className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                ✓ Connected: {userAddress.slice(0, 10)}...{userAddress.slice(-8)}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Not connected</p>
            )}
          </div>
          {!connected && (
            <button
              onClick={connectWallet}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Gas Savings Info */}
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-900 dark:text-green-100">
            ⚡ Gas Efficiency with EIP-1167 Clone Pattern
          </h3>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
              <p className="text-green-700 dark:text-green-300">Clone Deployment:</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">{GAS_SAVINGS.cloneDeployment}</p>
            </div>
            <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
              <p className="text-green-700 dark:text-green-300">Normal Deployment:</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">{GAS_SAVINGS.fullDeployment}</p>
            </div>
            <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
              <p className="text-green-700 dark:text-green-300">Savings:</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">{GAS_SAVINGS.savings}</p>
            </div>
          </div>
        </div>

        {connected && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create Token Form */}
            <div>
              <CreateTokenForm 
                userAddress={userAddress}
                onSuccess={handleTokenCreated}
              />
            </div>

            {/* Tokens List */}
            <div>
              <TokensList 
                adminAddress={userAddress}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        )}

        {!connected && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-lg text-blue-900 dark:text-blue-300">
              👆 Connect your wallet to start creating RWA tokens
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            💡 About RWA Tokens
          </h4>
          <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
            Create compliant Real World Asset (RWA) tokens using the EIP-1167 Minimal Proxy pattern.
            Each token includes automated compliance checks and investor claim requirements.
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>98.3% gas savings with clone pattern</li>
            <li>Automated compliance verification</li>
            <li>Investor claim requirements (KYC, Accreditation, Jurisdiction)</li>
            <li>Integrates with Compliance Aggregator</li>
            <li>MongoDB storage for easy querying</li>
          </ul>
          <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
            <p>Factory: <code className="font-mono">{TOKEN_CLONE_FACTORY_ADDRESS}</code></p>
            <p>Network: {NETWORK_CONFIG.chainName} (Chain ID: {NETWORK_CONFIG.chainId})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
