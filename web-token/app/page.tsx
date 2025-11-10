'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import {
  TOKEN_CLONE_FACTORY_ADDRESS,
  TOKEN_CLONE_FACTORY_ABI,
  NETWORK_CONFIG,
  GAS_SAVINGS,
} from '@/lib/contracts';

interface CreatedToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  txHash: string;
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTokens, setCreatedTokens] = useState<CreatedToken[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: '18',
    admin: '',
  });

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
      setFormData(prev => ({ ...prev, admin: address }));
      
      console.log('Wallet conectada:', address);
    } catch (err) {
      console.error('Error conectando wallet:', err);
      alert('Error al conectar la wallet');
    }
  };

  const createToken = async () => {
    if (!formData.name || !formData.symbol || !formData.admin) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!window.ethereum) {
      alert('Por favor instala MetaMask!');
      return;
    }

    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(
        TOKEN_CLONE_FACTORY_ADDRESS,
        TOKEN_CLONE_FACTORY_ABI,
        signer
      );

      console.log('Creando token...');
      const tx = await factory.createToken(
        formData.name,
        formData.symbol,
        parseInt(formData.decimals),
        formData.admin
      );

      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Token creado!', receipt);

      // Buscar el evento TokenCreated
      const event = receipt.logs.find((log: ethers.Log | ethers.EventLog) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === 'TokenCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);
        const newToken: CreatedToken = {
          address: parsed?.args.token,
          name: formData.name,
          symbol: formData.symbol,
          decimals: parseInt(formData.decimals),
          admin: formData.admin,
          txHash: tx.hash,
        };
        
        setCreatedTokens(prev => [newToken, ...prev]);
        
        alert(`¡Token creado exitosamente! 🎉\n\nDirección: ${newToken.address}\n\nAhorraste ~2.95M gas (98.3%)`);
      }

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        decimals: '18',
        admin: userAddress,
      });
    } catch (err) {
      console.error('Error creando token:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      alert('Error al crear token: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-12 px-4 font-sans dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            🚀 Token Clone Factory
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Crea tokens con 98.3% de ahorro en gas usando EIP-1167
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Estado de Wallet</p>
            {connected ? (
              <p className="font-mono text-sm text-green-600 dark:text-green-400">
                ✓ {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
            ) : (
              <p className="text-sm text-gray-500">No conectada</p>
            )}
          </div>
          {!connected && (
            <button
              onClick={connectWallet}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Conectar Wallet
            </button>
          )}
        </div>

        {/* Gas Savings Info */}
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <h3 className="mb-2 flex items-center font-semibold text-green-900 dark:text-green-100">
            ⚡ Ahorro de Gas
          </h3>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <div>
              <p className="text-green-700 dark:text-green-300">Despliegue Clone:</p>
              <p className="font-bold text-green-900 dark:text-green-100">{GAS_SAVINGS.cloneDeployment}</p>
            </div>
            <div>
              <p className="text-green-700 dark:text-green-300">Despliegue Normal:</p>
              <p className="font-bold text-green-900 dark:text-green-100">{GAS_SAVINGS.fullDeployment}</p>
            </div>
            <div>
              <p className="text-green-700 dark:text-green-300">Ahorro Total:</p>
              <p className="font-bold text-green-900 dark:text-green-100">{GAS_SAVINGS.savings}</p>
            </div>
          </div>
        </div>

        {/* Create Token Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Crear Nuevo Token
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Token *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Mi Security Token"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Símbolo del Token *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="ej: MST"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Decimales
              </label>
              <input
                type="number"
                value={formData.decimals}
                onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                min="0"
                max="18"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección del Admin *
              </label>
              <input
                type="text"
                value={formData.admin}
                onChange={(e) => setFormData({ ...formData, admin: e.target.value })}
                placeholder="0x..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={createToken}
            disabled={loading || !connected}
            className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold text-white transition ${
              loading || !connected
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {loading ? 'Creando Token...' : connected ? 'Crear Token 🚀' : 'Conecta tu Wallet primero'}
          </button>

          {!connected && (
            <p className="mt-2 text-center text-xs text-gray-500">
              * Necesitas conectar MetaMask para crear tokens
            </p>
          )}
        </div>

        {/* Created Tokens List */}
        {createdTokens.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Tokens Creados ({createdTokens.length})
            </h2>
            
            <div className="space-y-3">
              {createdTokens.map((token, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {token.name} ({token.symbol})
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Decimales: {token.decimals}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-100">
                      ✓ Creado
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Dirección: </span>
                      <code className="font-mono text-xs text-gray-900 dark:text-white">{token.address}</code>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Admin: </span>
                      <code className="font-mono text-xs text-gray-900 dark:text-white">{token.admin}</code>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">TX: </span>
                      <code className="font-mono text-xs text-gray-900 dark:text-white">{token.txHash}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            💡 Información
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Este factory crea clones de tokens usando el patrón EIP-1167 Minimal Proxy,
            ahorrando ~98.3% de gas comparado con despliegues completos. Cada token es un
            contrato separado con su propio admin y configuración.
          </p>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            <p>Factory: <code className="font-mono">{TOKEN_CLONE_FACTORY_ADDRESS}</code></p>
            <p>Red: {NETWORK_CONFIG.chainName} (Chain ID: {NETWORK_CONFIG.chainId})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
