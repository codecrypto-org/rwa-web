/**
 * Create Token Form Component
 * 
 * Form to create a new RWA token with compliance settings
 */

'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { TOKEN_CLONE_FACTORY_ADDRESS, TOKEN_CLONE_FACTORY_ABI } from '@/lib/contracts/TokenCloneFactory';
import { COMPLIANCE_AGGREGATOR_ADDRESS } from '@/lib/contracts/compliance';
import { IDENTITY_REGISTRY_ADDRESS, TRUSTED_ISSUERS_REGISTRY_ADDRESS } from '@/lib/contracts/registries';
import { INVESTMENT_CLAIMS, CLAIM_DESCRIPTIONS } from '@/types/token';

interface CreateTokenFormProps {
  userAddress: string;
  onSuccess: () => void;
}

export default function CreateTokenForm({ userAddress, onSuccess }: CreateTokenFormProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('18');
  const [initialSupply, setInitialSupply] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<number[]>([
    INVESTMENT_CLAIMS.KYC,
    INVESTMENT_CLAIMS.ACCREDITATION,
    INVESTMENT_CLAIMS.JURISDICTION
  ]);
  const [addCompliance, setAddCompliance] = useState(false); // Changed to false by default
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const toggleClaim = (claim: number) => {
    setSelectedClaims(prev =>
      prev.includes(claim)
        ? prev.filter(c => c !== claim)
        : [...prev, claim]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !symbol || !decimals) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedClaims.length === 0) {
      setError('Please select at least one required claim for investors');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      // Step 1: Create token
      setCurrentStep('Creating token on blockchain...');
      console.log('🏭 Creating token with factory...');
      
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not available');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const factory = new ethers.Contract(
        TOKEN_CLONE_FACTORY_ADDRESS,
        TOKEN_CLONE_FACTORY_ABI,
        signer
      );

      // Use createTokenWithRegistries to configure IdentityRegistry and TrustedIssuersRegistry
      // For ClaimTopicsRegistry, we'll set it to address(0) for now (can be configured later per token)
      console.log('📋 Creating token with registries...');
      console.log('  Identity Registry:', IDENTITY_REGISTRY_ADDRESS);
      console.log('  Trusted Issuers Registry:', TRUSTED_ISSUERS_REGISTRY_ADDRESS);
      
      const tx = await factory.createTokenWithRegistries(
        name,
        symbol,
        parseInt(decimals),
        userAddress,
        IDENTITY_REGISTRY_ADDRESS,        // Identity Registry
        TRUSTED_ISSUERS_REGISTRY_ADDRESS, // Trusted Issuers Registry
        '0x0000000000000000000000000000000000000000' // Claim Topics Registry (to be configured later)
      );
      
      console.log('📝 Transaction sent:', tx.hash);
      setCurrentStep('Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Token created! Receipt:', receipt);
      console.log('📊 Total logs in receipt:', receipt?.logs?.length || 0);

      // Method 1: Try to get token address from event logs
      let tokenAddress: string | null = null;
      
      if (receipt && receipt.logs) {
        console.log('🔍 Searching for TokenCreated event in logs...');
        
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          console.log(`Log ${i}:`, {
            address: log.address,
            topics: log.topics,
            data: log.data
          });
          
          try {
            // Try to parse the log
            const parsed = factory.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            
            console.log(`✅ Parsed log ${i}:`, parsed?.name, parsed?.args);
            
            if (parsed && parsed.name === 'TokenCreated') {
              tokenAddress = parsed.args.token;
              console.log('🎉 Token address found from event:', tokenAddress);
              break;
            }
          } catch (error) {
            // This log is not from our contract or not a TokenCreated event
            console.log(`⚠️ Could not parse log ${i}:`, error);
            continue;
          }
        }
      }

      // Method 2: If not found in logs, query the contract directly
      if (!tokenAddress) {
        console.log('⚠️ Event not found in logs, trying to query contract...');
        try {
          const totalTokens = await factory.getTotalTokens();
          console.log('Total tokens in factory:', totalTokens.toString());
          
          if (totalTokens > 0) {
            // Get the last token created (most recent)
            const lastIndex = Number(totalTokens) - 1;
            tokenAddress = await factory.getTokenAt(lastIndex);
            console.log('🎉 Token address from contract query:', tokenAddress);
          }
        } catch (queryError) {
          console.error('❌ Failed to query contract:', queryError);
        }
      }

      if (!tokenAddress) {
        throw new Error('Could not retrieve token address. Please check the transaction on the block explorer.');
      }

      console.log('✅ Token created with registries configured:');
      console.log('  Identity Registry:', IDENTITY_REGISTRY_ADDRESS);
      console.log('  Trusted Issuers Registry:', TRUSTED_ISSUERS_REGISTRY_ADDRESS);

      // Step 2: Configure ClaimTopicsRegistry for this token (if claims are selected)
      // Note: ClaimTopicsRegistry needs to be created and configured manually per token
      if (selectedClaims.length > 0) {
        try {
          setCurrentStep('Creating ClaimTopicsRegistry for token...');
          console.log('📋 Creating ClaimTopicsRegistry with selected claims...');
          
          // For now, we'll set the registry to address(0) and configure it manually later
          // In a full implementation, you would deploy a new ClaimTopicsRegistry here
          // or use a factory to create one
          
          // Note: This requires deploying a ClaimTopicsRegistry contract
          // which is not implemented in the web app yet.
          // The token admin will need to create and configure it manually.
          
          console.log('⚠️ ClaimTopicsRegistry will need to be configured manually after creation');
          console.log('   Selected claims:', selectedClaims.join(', '));
          console.log('   The token admin should:');
          console.log('   1. Deploy a ClaimTopicsRegistry');
          console.log('   2. Add claim topics:', selectedClaims.join(', '));
          console.log('   3. Call token.setClaimTopicsRegistry(registryAddress)');
          
          setCurrentStep('');
        } catch (claimTopicsError) {
          console.warn('⚠️ Could not create ClaimTopicsRegistry:', claimTopicsError);
          console.warn('Token was created successfully. Configure ClaimTopicsRegistry manually.');
          setCurrentStep('');
        }
      }

      // Step 3: Mint initial supply (if specified)
      let mintSuccess = false;
      let mintErrorMsg = '';
      
      if (initialSupply && initialSupply.trim() !== '' && parseFloat(initialSupply) > 0) {
        try {
          setCurrentStep(`Minting ${initialSupply} ${symbol} tokens...`);
          console.log(`💰 Minting initial supply: ${initialSupply} ${symbol}`);
          
          const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');
          const tokenContract = new ethers.Contract(
            tokenAddress,
            TOKEN_CLONEABLE_ABI,
            signer
          );

          // Parse the amount with decimals
          const mintAmount = ethers.parseUnits(initialSupply, parseInt(decimals));
          
          console.log('📝 Sending mint transaction...');
          const mintTx = await tokenContract.mint(userAddress, mintAmount);
          console.log('📝 Mint transaction sent:', mintTx.hash);
          
          setCurrentStep('Waiting for mint confirmation...');
          await mintTx.wait();
          console.log('✅ Initial supply minted successfully!');
          
          mintSuccess = true;
          setCurrentStep('');
        } catch (mintError) {
          const error = mintError as { reason?: string; message?: string };
          console.warn('⚠️ Failed to mint initial supply:', mintError);
          
          // Check if error is due to verification requirement
          if (error.reason?.includes('verified') || error.message?.includes('verified')) {
            mintErrorMsg = 'Mint failed: You need to register your identity first. Mint manually after registering.';
            console.warn('Mint failed because recipient needs to be verified first.');
          } else if (error.reason?.includes('compliant') || error.message?.includes('compliant')) {
            mintErrorMsg = 'Mint failed: Compliance check failed. Configure registries and verify your identity.';
            console.warn('Mint failed due to compliance check.');
          } else {
            mintErrorMsg = `Mint failed: ${error.reason || error.message || 'Unknown error'}.`;
            console.warn('Token was created successfully, but initial mint failed.');
          }
          
          // Don't throw - token was created successfully
          setCurrentStep('');
        }
      }

      // Step 4: Set compliance (if selected)
      let complianceAddress = '';
      if (addCompliance) {
        try {
          setCurrentStep('Setting compliance contract...');
          console.log('🔒 Setting compliance aggregator...');
          
          const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');
          const tokenContract = new ethers.Contract(
            tokenAddress,
            TOKEN_CLONEABLE_ABI,
            signer
          );

          // Check if the function exists and user has permission
          console.log('Checking if addComplianceModule is available...');
          
          const complianceTx = await tokenContract.addComplianceModule(COMPLIANCE_AGGREGATOR_ADDRESS);
          console.log('📝 Compliance transaction sent:', complianceTx.hash);
          
          setCurrentStep('Waiting for compliance confirmation...');
          await complianceTx.wait();
          console.log('✅ Compliance module added!');
          
          complianceAddress = COMPLIANCE_AGGREGATOR_ADDRESS;
        } catch (complianceError) {
          console.warn('⚠️ Failed to add compliance module (this is optional):', complianceError);
          console.warn('Token was created successfully, but compliance was not added.');
          console.warn('You can add it manually later using the button in the token card.');
          // Don't throw - token was created successfully
          complianceAddress = ''; // Clear compliance address since it wasn't set
        }
      }

      // Step 5: Save to MongoDB
      setCurrentStep('Saving to database...');
      console.log('💾 Saving token to MongoDB...');
      
      const saveResponse = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          symbol,
          decimals: parseInt(decimals),
          tokenAddress,
          adminAddress: userAddress,
          complianceAddress: complianceAddress || undefined,
          requiredClaims: selectedClaims,
          description,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
        }),
      });

      const saveResult = await saveResponse.json();
      
      console.log('💾 MongoDB save result:', saveResult);

      if (!saveResult.success) {
        console.error('❌ Failed to save to MongoDB:', saveResult);
        throw new Error(`Token created on blockchain but failed to save to database: ${saveResult.message || saveResult.error}`);
      }

      console.log('✅ Token saved to MongoDB successfully!');
      
      const registriesMessage = `\n✓ Identity Registry configured\n✓ Trusted Issuers Registry configured`;
      
      const complianceMessage = complianceAddress 
        ? '\n✓ Compliance aggregator set' 
        : addCompliance 
          ? '\n⚠ Compliance not set (optional feature)'
          : '';
      
      const mintMessage = mintSuccess 
        ? `\n✓ Initial supply minted: ${initialSupply} ${symbol}` 
        : initialSupply && parseFloat(initialSupply) > 0
          ? `\n⚠ Mint failed: ${mintErrorMsg || 'Unknown error'}`
          : '';
      
      const claimTopicsMessage = selectedClaims.length > 0
        ? `\n⚠ ClaimTopicsRegistry: Configure manually with topics: ${selectedClaims.join(', ')}`
        : '';
      
      alert(`Token "${name}" created successfully!\nAddress: ${tokenAddress}\n\n${registriesMessage}${complianceMessage}${mintMessage}${claimTopicsMessage}\n\n✓ Saved to MongoDB`);
      
      // Reset form
      setName('');
      setSymbol('');
      setDecimals('18');
      setInitialSupply('');
      setDescription('');
      setSelectedClaims([
        INVESTMENT_CLAIMS.KYC,
        INVESTMENT_CLAIMS.ACCREDITATION,
        INVESTMENT_CLAIMS.JURISDICTION
      ]);
      setCurrentStep('');
      
      onSuccess();
    } catch (err) {
      console.error('Error creating token:', err);
      setError(err instanceof Error ? err.message : 'Failed to create token');
      setCurrentStep('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Create RWA Token
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {currentStep && (
        <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            {currentStep}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Real Estate Token"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Token Symbol */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token Symbol *
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="RET"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Decimals */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Decimals *
          </label>
          <input
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            min="0"
            max="18"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Standard is 18 (like ETH)
          </p>
        </div>

        {/* Initial Supply */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Initial Supply (Optional)
          </label>
          <input
            type="text"
            value={initialSupply}
            onChange={(e) => {
              // Allow only numbers and decimal point
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setInitialSupply(value);
            }}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Amount of tokens to mint to your address after creation. Leave empty to mint later.
            {initialSupply && parseFloat(initialSupply) > 0 && (
              <span className="block mt-1 text-blue-600 dark:text-blue-400">
                Will mint: {initialSupply} {symbol || 'tokens'}
              </span>
            )}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your token and what it represents..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Required Claims Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Required Claims for Investors *
          </label>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Select which claims investors must have to hold this token
          </p>
          <div className="space-y-2">
            {Object.entries(CLAIM_DESCRIPTIONS).map(([topicNum, claim]) => {
              const topic = parseInt(topicNum);
              return (
                <label
                  key={topic}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedClaims.includes(topic)}
                    onChange={() => toggleClaim(topic)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {claim.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {claim.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          {selectedClaims.length === 0 && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              At least one claim must be selected
            </p>
          )}
        </div>

        {/* Add Compliance Toggle - Disabled */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            💡 Compliance Modules
          </p>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            You can add compliance modules after creating the token using the &quot;Add Compliance Module&quot; button in the token card.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={creating || selectedClaims.length === 0}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? currentStep || 'Creating...' : 'Create Token'}
        </button>

        {/* Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-xs text-blue-800 dark:text-blue-400">
            💡 The token will be created using the clone pattern for gas efficiency. 
            You will be set as the admin of the token.
          </p>
        </div>
      </form>
    </div>
  );
}

