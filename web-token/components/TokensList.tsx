/**
 * Tokens List Component
 * 
 * Displays all created tokens with their information
 */

'use client';

import { useState, useEffect } from 'react';
import { Token } from '@/types/token';
import { CLAIM_DESCRIPTIONS } from '@/types/token';

interface TokensListProps {
  adminAddress?: string;
  onSelectToken?: (token: Token) => void;
  refreshTrigger?: number;
}

export default function TokensList({ adminAddress, onSelectToken, refreshTrigger }: TokensListProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingCompliance, setAddingCompliance] = useState<string | null>(null); // tokenId being updated
  const [removingCompliance, setRemovingCompliance] = useState<string | null>(null);
  const [removingClaim, setRemovingClaim] = useState<string | null>(null); // tokenId_claimTopic
  const [editingPrice, setEditingPrice] = useState<string | null>(null); // tokenId being edited
  const [newPrice, setNewPrice] = useState<string>('');
  const [tokenSupportsCompliance, setTokenSupportsCompliance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTokens();
  }, [adminAddress, refreshTrigger]);

  // Assume all tokens support compliance - let the transaction fail if they don't
  const checkComplianceSupport = async (tokenAddress: string): Promise<boolean> => {
    // Simply return true for all tokens
    // If addComplianceModule doesn't exist, the transaction will fail with a clear error
    return true;
  };

  const loadTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (adminAddress) {
        params.append('adminAddress', adminAddress);
      }

      const response = await fetch(`/api/tokens?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load tokens');
      }

      setTokens(result.data);
      
      // Check compliance support for each token without compliance
      const supportMap: Record<string, boolean> = {};
      for (const token of result.data) {
        if (!token.complianceAddress && token.tokenAddress) {
          supportMap[token.tokenAddress] = await checkComplianceSupport(token.tokenAddress);
        }
      }
      setTokenSupportsCompliance(supportMap);
    } catch (err) {
      console.error('Error loading tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const getClaimBadges = (claimTopics: number[]) => {
    return claimTopics.map((topic) => ({
      topic,
      name: CLAIM_DESCRIPTIONS[topic]?.name || `Claim ${topic}`,
    }));
  };

  const addComplianceToToken = async (token: Token, moduleAddress: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    if (!token._id) {
      setError('Token ID not available');
      return;
    }

    // Ask user for module address if not provided
    let complianceModule = moduleAddress;
    if (!complianceModule) {
      complianceModule = prompt('Enter compliance module address:') || '';
      if (!complianceModule) {
        return;
      }
    }

    try {
      setAddingCompliance(token._id);
      setError(null);

      console.log('🔒 Adding compliance module to token:', token.tokenAddress);
      console.log('📦 Module address:', complianceModule);

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not available');
      }

      // Dynamic import
      const { ethers } = await import('ethers');
      const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Verify we're the admin
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== token.adminAddress.toLowerCase()) {
        throw new Error('Only the token admin can add compliance modules');
      }

      // Call addComplianceModule on token contract
      const tokenContract = new ethers.Contract(
        token.tokenAddress,
        TOKEN_CLONEABLE_ABI,
        signer
      );

      console.log('Calling addComplianceModule...');
      const tx = await tokenContract.addComplianceModule(complianceModule);
      console.log('Transaction sent:', tx.hash);

      await tx.wait();
      console.log('✅ Compliance module added on blockchain!');

      // Update modules array in MongoDB
      const currentModules = token.complianceModules || [];
      const updatedModules = [...currentModules, complianceModule];

      const response = await fetch(`/api/tokens/${token._id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modules: updatedModules,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.warn('Failed to update database, but blockchain transaction succeeded');
      } else {
        console.log('✅ Database updated with', updatedModules.length, 'modules!');
      }

      setError(null);
      alert(`✅ Compliance Module Added!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📦 Module Address:\n${complianceModule}\n\n📊 Total Modules: ${updatedModules.length}\n\n📜 Transaction Hash:\n${tx.hash}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Reload tokens
      await loadTokens();
    } catch (err: any) {
      console.error('Error adding compliance:', err);
      
      let errorMsg = '❌ Failed to Add Compliance Module\n\n';
      
      if (err.message?.includes('execution reverted')) {
        errorMsg += '⚠️ Transaction Reverted\n\nPossible causes:\n• You are not the token owner/admin\n• Module address is invalid\n• Token doesn\'t support compliance modules\n• Gas estimation failed';
      } else if (err.message?.includes('user rejected')) {
        errorMsg += '🚫 Transaction Cancelled\n\nYou rejected the transaction in MetaMask';
      } else if (err.message?.includes('network')) {
        errorMsg += '🌐 Network Error\n\nPlease check your connection to the blockchain';
      } else {
        errorMsg += err.message || 'Unknown error occurred';
      }
      
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setAddingCompliance(null);
    }
  };

  const removeComplianceFromToken = async (token: Token, moduleAddress: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    if (!moduleAddress) {
      setError('Module address not available');
      return;
    }

    const confirmMsg = `⚠️ Remove compliance module from UI?\n\n${moduleAddress}\n\nNOTE: This will ONLY remove the reference from the UI/database.\nThe module will still exist on the blockchain.\n\nThe token contract doesn't support removing modules on-chain.\n\nContinue?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setRemovingCompliance(token._id || '');
      setError(null);

      console.log('🗑️ Removing module reference from UI/MongoDB:', moduleAddress);

      // Just update MongoDB to remove this module from the array
      const currentModules = token.complianceModules || [];
      const updatedModules = currentModules.filter(m => m.toLowerCase() !== moduleAddress.toLowerCase());
      
      const response = await fetch(`/api/tokens/${token._id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modules: updatedModules,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update database');
      }
      
      console.log('✅ UI reference removed! Remaining modules:', updatedModules.length);
      
      setError(null);
      alert(`✅ Module Hidden from UI\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📦 Hidden Module:\n${moduleAddress}\n\n📊 Remaining Modules: ${updatedModules.length}\n\n⚠️ Note: Module still exists on blockchain\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Reload tokens
      await loadTokens();
    } catch (err: any) {
      console.error('❌ Error removing module reference:', err);
      
      const errorMsg = `❌ Failed to Hide Module\n\n⚠️ Database Error\n\n${err instanceof Error ? err.message : 'Failed to remove module'}`;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setRemovingCompliance(null);
    }
  };

  const removeClaimFromToken = async (token: Token, claimTopic: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    if (!token._id) {
      setError('Token ID not available');
      return;
    }

    const claimName = getClaimBadges([claimTopic])[0]?.name || `Claim ${claimTopic}`;
    
    if (!confirm(`Remove required claim?\n\n${claimName} (Topic ${claimTopic})\n\nThis will only update the UI/database.\nThe claim requirement may still be enforced on the blockchain.\n\nContinue?`)) {
      return;
    }

    try {
      setRemovingClaim(`${token._id}_${claimTopic}`);
      setError(null);

      console.log('🗑️ Removing claim from token:', claimTopic);

      // Update MongoDB to remove this claim from the array
      const currentClaims = token.requiredClaims || [];
      const updatedClaims = currentClaims.filter(c => c !== claimTopic);
      
      const response = await fetch(`/api/tokens/${token._id}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claims: updatedClaims,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update database');
      }
      
      console.log('✅ Claim removed! Remaining claims:', updatedClaims.length);
      
      setError(null);
      alert(`✅ Claim Removed from UI\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🏷️ Removed: ${claimName}\n📊 Remaining Claims: ${updatedClaims.length}\n\n⚠️ Note: This only updates the UI.\nOn-chain requirements may still be enforced.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Reload tokens
      await loadTokens();
    } catch (err: any) {
      console.error('❌ Error removing claim:', err);
      
      const errorMsg = `❌ Failed to Remove Claim\n\n⚠️ Database Error\n\n${err instanceof Error ? err.message : 'Failed to remove claim'}`;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setRemovingClaim(null);
    }
  };

  const updateTokenPrice = async (token: Token, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!token._id) {
      return;
    }

    if (editingPrice === token._id) {
      // Save price
      try {
        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue) || priceValue < 0) {
          alert('Invalid price');
          return;
        }

        const response = await fetch(`/api/tokens/${token._id}/price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price: priceValue,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to update price');
        }

        console.log('✅ Price updated:', priceValue, 'ETH');
        
        setError(null);
        alert(`✅ Price Updated!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n💰 New Price: ${priceValue} ETH\n📦 Token: ${token.symbol}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        await loadTokens();
        setEditingPrice(null);
        setNewPrice('');
      } catch (err: any) {
        console.error('Error updating price:', err);
        
        const errorMsg = `❌ Failed to Update Price\n\n⚠️ Database Error\n\n${err instanceof Error ? err.message : 'Failed to update price'}`;
        setError(errorMsg);
        alert(errorMsg);
      }
    } else {
      // Start editing
      setEditingPrice(token._id);
      setNewPrice(token.price?.toString() || '0');
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Loading tokens...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Created Tokens ({tokens.length})
        </h2>
        <button
          onClick={loadTokens}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            No tokens created yet. Create your first RWA token above!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <div
              key={token._id}
              onClick={() => onSelectToken && onSelectToken(token)}
              className={`rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 ${onSelectToken ? 'cursor-pointer' : ''}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {token.name}
                    </h3>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {token.symbol}
                    </span>
                    {token.complianceAddress && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ Compliance Set
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Token Address:
                      </p>
                      <code className="block break-all text-xs text-gray-900 dark:text-white">
                        {token.tokenAddress}
                      </code>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Admin:
                      </p>
                      <code className="block break-all text-xs text-gray-900 dark:text-white">
                        {token.adminAddress}
                      </code>
                    </div>
                    
                    {token.complianceModules && token.complianceModules.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Compliance Modules ({token.complianceModules.length}):
                        </p>
                        <div className="mt-1 space-y-1">
                          {token.complianceModules.map((module, idx) => (
                            <div key={module} className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  #{idx + 1}
                                </span>
                                <code className="break-all text-xs text-gray-900 dark:text-white">
                                  {module}
                                </code>
                              </div>
                              <button
                                onClick={(e) => removeComplianceFromToken(token, module, e)}
                                disabled={removingCompliance === token._id}
                                className="shrink-0 rounded-lg bg-yellow-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Remove from UI (module will remain on blockchain)"
                              >
                                {removingCompliance === token._id ? '...' : '👁️‍🗨️'}
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          💡 Multiple modules work together for compliance verification
                        </p>
                        <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-500">
                          ⚠️ Note: Modules can only be hidden from UI, not removed from blockchain
                        </p>
                      </div>
                    )}
                    
                    {token.description && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Description:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {token.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Required Claims */}
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Required Claims for Investment ({token.requiredClaims.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {getClaimBadges(token.requiredClaims).map((claim, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 pl-3 pr-1 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      title={CLAIM_DESCRIPTIONS[claim.topic]?.description}
                    >
                      {claim.name}
                      <button
                        onClick={(e) => removeClaimFromToken(token, claim.topic, e)}
                        disabled={removingClaim === `${token._id}_${claim.topic}`}
                        className="rounded-full p-0.5 text-purple-600 hover:bg-purple-200 hover:text-purple-900 dark:text-purple-400 dark:hover:bg-purple-800 dark:hover:text-purple-200 transition-colors disabled:opacity-50"
                        title="Remove this claim requirement from UI"
                      >
                        {removingClaim === `${token._id}_${claim.topic}` ? '⏳' : '✕'}
                      </button>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  ⚠️ Removing claims only updates the UI. On-chain requirements may still be enforced.
                </p>
              </div>

              {/* Price */}
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Price per Token:
                    </p>
                    {editingPrice === token._id ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          placeholder="0.00"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">ETH</span>
                      </div>
                    ) : (
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                        {token.price !== undefined ? `${token.price} ETH` : 'Not set'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => updateTokenPrice(token, e)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
                  >
                    {editingPrice === token._id ? '💾 Save' : '✏️ Edit'}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <span>Decimals: {token.decimals}</span>
                <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Add Compliance Button */}
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="mb-2 text-xs font-medium text-blue-900 dark:text-blue-300">
                    📦 Manage Compliance
                  </p>
                  <p className="mb-3 text-xs text-blue-800 dark:text-blue-400">
                    {token.complianceModules && token.complianceModules.length > 0
                      ? 'Add more modules to enhance compliance verification'
                      : 'Add compliance modules to enable automated verification'}
                  </p>
                  <button
                    onClick={(e) => addComplianceToToken(token, '', e)}
                    disabled={addingCompliance === token._id}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingCompliance === token._id ? 'Adding Module...' : '➕ Add Compliance Module'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

