'use client';

import { useState, useEffect } from 'react';
import { Token } from '@/types/token';
import { CLAIM_DESCRIPTIONS } from '@/types/token';

export default function MarketplacePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string>('');
  const [buying, setBuying] = useState<string | null>(null);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [checkingCompliance, setCheckingCompliance] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
    checkWallet();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('🔄 Account changed:', accounts[0]);
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setError(null);
        } else {
          setAccount('');
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const checkWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          console.log('✅ Wallet connected:', accounts[0]);
        }
      } catch (err) {
        console.error('Error checking wallet:', err);
      }
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setError('❌ MetaMask Not Installed\n\nPlease install the MetaMask extension:\nhttps://metamask.io/download/');
        return;
      }

      console.log('🔗 Requesting wallet connection...');
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setError(null);
        console.log('✅ Wallet connected:', accounts[0]);
        
        alert(`✅ Wallet Connected!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔐 Account:\n${accounts[0]}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      
      if (err.code === 4001) {
        setError('🚫 Connection Cancelled\n\nYou rejected the connection request in MetaMask');
      } else {
        setError(`❌ Failed to Connect Wallet\n\n${err.message || 'Unknown error occurred'}`);
      }
    }
  };

  const switchAccount = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setError('❌ MetaMask Not Installed\n\nPlease install MetaMask extension to use this feature.');
        return;
      }

      console.log('🔄 Requesting account switch...');

      // Request to switch account
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // Get new account (this will trigger accountsChanged event)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setError(null);
        console.log('✅ Switched to:', accounts[0]);
        
        // Show success message
        alert(`✅ Account Switched!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔄 New Account:\n${accounts[0]}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      }
    } catch (err: any) {
      console.error('Error switching account:', err);
      
      if (err.code === 4001) {
        // User rejected
        console.log('User cancelled account switch');
      } else {
        setError(`❌ Failed to Switch Account\n\n${err.message || 'Unknown error occurred'}`);
      }
    }
  };

  const loadTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tokens');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load tokens');
      }

      setTokens(result.data);
    } catch (err) {
      console.error('Error loading tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const buyToken = async (token: Token, amount: string) => {
    if (!token._id || !amount) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('❌ Invalid amount\n\nPlease enter a positive number');
      return;
    }

    if (!token.price) {
      setError(`❌ Price Not Set\n\nThe token "${token.symbol}" doesn't have a price configured.\n\nContact the token admin to set a price.`);
      return;
    }

    const totalPrice = amountNum * token.price;

    try {
      setBuying(token._id);
      setError(null);

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed.\n\nPlease install MetaMask to buy tokens.');
      }

      const { ethers } = await import('ethers');
      const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();

      // Get token contract instances (both for reading and writing)
      const tokenContract = new ethers.Contract(
        token.tokenAddress,
        TOKEN_CLONEABLE_ABI,
        signer
      );
      
      const tokenContractReadOnly = new ethers.Contract(
        token.tokenAddress,
        TOKEN_CLONEABLE_ABI,
        provider
      );

      const purchaseAmount = ethers.parseUnits(amountNum.toString(), token.decimals);

      console.log(`💰 Buying ${amountNum} ${token.symbol} for ${totalPrice} ETH`);
      
      // Pre-flight checks before attempting transaction
      try {
        // Check if token is paused
        const paused = await tokenContractReadOnly.paused();
        if (paused) {
          throw new Error('Token is paused. The admin has temporarily disabled transfers.');
        }

        // Check admin balance
        const adminBalance = await tokenContractReadOnly.balanceOf(token.adminAddress);
        if (adminBalance < purchaseAmount) {
          const adminBalanceFormatted = ethers.formatUnits(adminBalance, token.decimals);
          throw new Error(`Insufficient token supply. Admin has ${adminBalanceFormatted} ${token.symbol}, but you're trying to buy ${amountNum} ${token.symbol}.`);
        }

        // Check if buyer can receive tokens (compliance check)
        try {
          const canTransfer = await tokenContractReadOnly.canTransfer(token.adminAddress, buyerAddress, purchaseAmount);
          if (!canTransfer) {
            throw new Error('Transfer not compliant. You don\'t meet the compliance requirements for this token.');
          }
        } catch (complianceCheckError) {
          // If canTransfer fails, it might mean compliance is blocking
          const errorMsg = complianceCheckError instanceof Error ? complianceCheckError.message : String(complianceCheckError);
          if (errorMsg.includes('compliant') || errorMsg.includes('verified') || errorMsg.includes('Transfer not compliant')) {
            throw new Error('Transfer not compliant');
          }
          // If it's a different error (e.g., function doesn't exist), continue
        }
      } catch (preflightError) {
        // Re-throw preflight errors with better context
        throw preflightError;
      }
      
      // Transfer tokens from admin to buyer
      const tx = await tokenContract.transfer(buyerAddress, purchaseAmount);
      
      await tx.wait();
      
      setError(null);
      alert(`✅ Purchase Successful!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📦 Tokens Received: ${amountNum} ${token.symbol}\n💰 Total Price: ${totalPrice} ETH\n\n📜 Transaction Hash:\n${tx.hash}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    } catch (err) {
      console.error('Error buying token:', err);
      
      const error = err as { reason?: string; message?: string; code?: string; data?: string };
      let errorMsg = '';
      
      // Check for specific error messages (most specific first)
      if (error.reason === 'Transfer not compliant' || error.message?.includes('Transfer not compliant')) {
        errorMsg = '🚫 Compliance Check Failed\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        errorMsg += `You don't meet the compliance requirements for "${token.symbol}".\n\n`;
        errorMsg += '📋 Required Claims:\n';
        
        token.requiredClaims.forEach(topic => {
          const claimName = CLAIM_DESCRIPTIONS[topic]?.name || `Claim ${topic}`;
          errorMsg += `  • ${claimName}\n`;
        });
        
        errorMsg += '\n💡 What to do:\n';
        errorMsg += '  1. Go to Identity app (port 4001)\n';
        errorMsg += '  2. Request required claims from issuers\n';
        errorMsg += '  3. Wait for approval\n';
        errorMsg += '  4. Load claims to your identity contract\n';
        errorMsg += '  5. Try purchasing again\n';
        errorMsg += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━';
      } else if (error.message?.includes('paused')) {
        errorMsg = '⏸️ Token Paused\n\n';
        errorMsg += 'The token admin has temporarily paused transfers.\n\n';
        errorMsg += 'Please contact the token admin or try again later.';
      } else if (error.message?.includes('Insufficient token supply')) {
        errorMsg = '📦 Insufficient Token Supply\n\n';
        errorMsg += error.message.replace('Insufficient token supply. ', '');
        errorMsg += '\n\n💡 Contact the token admin to mint more tokens.';
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
        errorMsg = '💸 Insufficient Funds\n\n';
        errorMsg += 'You don\'t have enough ETH in your wallet to complete this transaction.';
      } else if (error.message?.includes('user rejected') || error.code === 4001) {
        errorMsg = '🚫 Transaction Cancelled\n\n';
        errorMsg += 'You rejected the transaction in MetaMask.';
      } else if (error.message?.includes('execution reverted')) {
        // Try to decode the actual revert reason
        let revertReason = 'Unknown error';
        
        // Check if we have data to decode
        if (error.data && error.data !== '0x') {
          try {
            // Try to decode common error messages
            const contractInterface = new (await import('ethers')).Interface(TOKEN_CLONEABLE_ABI);
            const decoded = contractInterface.parseError(error.data);
            if (decoded) {
              revertReason = decoded.name;
              if (decoded.args && decoded.args.length > 0) {
                revertReason += ': ' + decoded.args.join(', ');
              }
            }
          } catch {
            // If decoding fails, use generic message
            revertReason = 'Contract execution reverted';
          }
        }
        
        errorMsg = '⚠️ Transaction Reverted\n\n';
        errorMsg += `Error: ${revertReason}\n\n`;
        
        // Don't show generic causes if we already have a specific error
        if (!errorMsg.includes('paused') && !errorMsg.includes('compliant') && !errorMsg.includes('Insufficient')) {
          errorMsg += '💡 Common causes:\n';
          errorMsg += '  • Compliance check failed\n';
          errorMsg += '  • Token is paused\n';
          errorMsg += '  • Insufficient balance in admin wallet\n';
          errorMsg += '  • Account is frozen\n';
        }
      } else {
        // Generic error fallback
        errorMsg = '❌ Purchase Failed\n\n';
        errorMsg += error.message || 'Unknown error occurred';
      }
      
      setError(errorMsg);
    } finally {
      setBuying(null);
    }
  };

  const checkCompliance = async (token: Token) => {
    if (!account) {
      setError('❌ No Wallet Connected\n\nPlease connect your wallet first');
      return;
    }

    try {
      setCheckingCompliance(token._id || '');
      setError(null);

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const { ethers } = await import('ethers');
      const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const tokenContract = new ethers.Contract(
        token.tokenAddress,
        TOKEN_CLONEABLE_ABI,
        provider
      );

      console.log('🔍 Checking compliance for:', userAddress);

      let diagnostic = '🔍 Compliance Diagnostic Report\n\n';
      diagnostic += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      diagnostic += `📍 Your Address: ${userAddress}\n`;
      diagnostic += `🪙 Token: ${token.name} (${token.symbol})\n`;
      diagnostic += `📍 Token Address: ${token.tokenAddress}\n\n`;
      diagnostic += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

      // 1. Check if user is verified
      try {
        const isVerified = await tokenContract.isVerified(userAddress);
        diagnostic += `1️⃣ Is Verified: ${isVerified ? '✅ YES' : '❌ NO'}\n`;
        
        if (!isVerified) {
          // Get registries to diagnose
          const identityRegistryAddress = await tokenContract.identityRegistry();
          const claimTopicsRegistryAddress = await tokenContract.claimTopicsRegistry();
          const trustedIssuersRegistryAddress = await tokenContract.trustedIssuersRegistry();

          // Convert to string and normalize
          const identityRegStr = typeof identityRegistryAddress === 'string' 
            ? identityRegistryAddress.toLowerCase() 
            : identityRegistryAddress.toString();
          const claimTopicsRegStr = typeof claimTopicsRegistryAddress === 'string'
            ? claimTopicsRegistryAddress.toLowerCase()
            : claimTopicsRegistryAddress.toString();
          const trustedIssuersRegStr = typeof trustedIssuersRegistryAddress === 'string'
            ? trustedIssuersRegistryAddress.toLowerCase()
            : trustedIssuersRegistryAddress.toString();

          diagnostic += `\n📍 Identity Registry: ${identityRegStr}\n`;
          diagnostic += `📍 Claim Topics Registry: ${claimTopicsRegStr}\n`;
          diagnostic += `📍 Trusted Issuers Registry: ${trustedIssuersRegStr}\n\n`;

          // Check Identity Registry
          if (identityRegStr === '0x0000000000000000000000000000000000000000' || identityRegStr === '0x0') {
            diagnostic += '❌ ERROR: Identity Registry not set on token\n\n';
            diagnostic += '⚠️ This token needs to be configured with compliance registries.\n';
            diagnostic += 'The token admin needs to call:\n';
            diagnostic += '  • token.setIdentityRegistry(<REGISTRY_ADDRESS>)\n';
            diagnostic += '  • token.setClaimTopicsRegistry(<REGISTRY_ADDRESS>)\n';
            diagnostic += '  • token.setTrustedIssuersRegistry(<REGISTRY_ADDRESS>)\n\n';
            diagnostic += 'Without these registries, compliance checks cannot work.\n';
            diagnostic += '\n💡 Contact the token admin to configure these registries.\n';
          } else {
            const IDENTITY_REGISTRY_ABI = [
              "function isRegistered(address) view returns (bool)",
              "function getIdentity(address) view returns (address)"
            ];
            const identityRegistry = new ethers.Contract(
              identityRegStr,
              IDENTITY_REGISTRY_ABI,
              provider
            );

            const isRegistered = await identityRegistry.isRegistered(userAddress);
            diagnostic += `2️⃣ Registered in Identity Registry: ${isRegistered ? '✅ YES' : '❌ NO'}\n`;

            if (!isRegistered) {
              diagnostic += '   ⚠️ You need to register your identity first\n';
            } else {
              const identityAddress = await identityRegistry.getIdentity(userAddress);
              diagnostic += `3️⃣ Identity Contract: ${identityAddress}\n`;

              if (identityAddress === '0x0000000000000000000000000000000000000000') {
                diagnostic += '   ❌ ERROR: Identity contract not found\n';
              } else {
                // Check Claim Topics Registry
                if (claimTopicsRegStr === '0x0000000000000000000000000000000000000000' || claimTopicsRegStr === '0x0') {
                  diagnostic += '4️⃣ Claim Topics Registry: Not set (no claims required)\n';
                } else {
                  const CLAIM_TOPICS_REGISTRY_ABI = [
                    "function getClaimTopics() view returns (uint256[])"
                  ];
                  const claimTopicsRegistry = new ethers.Contract(
                    claimTopicsRegStr,
                    CLAIM_TOPICS_REGISTRY_ABI,
                    provider
                  );

                  const requiredTopics = await claimTopicsRegistry.getClaimTopics();
                  diagnostic += `4️⃣ Required Claim Topics: ${requiredTopics.length > 0 ? requiredTopics.join(', ') : 'None'}\n\n`;

                  // Check Trusted Issuers Registry
                  if (trustedIssuersRegStr === '0x0000000000000000000000000000000000000000' || trustedIssuersRegStr === '0x0') {
                    diagnostic += '❌ ERROR: Trusted Issuers Registry not set\n';
                    diagnostic += '   The token admin needs to call:\n';
                    diagnostic += '   token.setTrustedIssuersRegistry(<REGISTRY_ADDRESS>)\n\n';
                  } else {
                    const TRUSTED_ISSUERS_REGISTRY_ABI = [
                      "function hasClaimTopic(address,uint256) view returns (bool)",
                      "function isTrustedIssuer(address) view returns (bool)",
                      "function getTrustedIssuers() view returns (address[])"
                    ];
                    const trustedIssuersRegistry = new ethers.Contract(
                      trustedIssuersRegStr,
                      TRUSTED_ISSUERS_REGISTRY_ABI,
                      provider
                    );

                    // Check Identity contract for claims
                    const IDENTITY_ABI = [
                      "function getClaimIssuersForTopic(uint256) view returns (address[])"
                    ];
                    const identityContract = new ethers.Contract(
                      identityAddress,
                      IDENTITY_ABI,
                      provider
                    );

                    diagnostic += '📋 Claim Verification:\n';
                    for (const topic of requiredTopics) {
                      const topicNum = Number(topic);
                      const topicName = CLAIM_DESCRIPTIONS[topicNum]?.name || `Claim ${topicNum}`;
                      
                      try {
                        const claimIssuers = await identityContract.getClaimIssuersForTopic(topic);
                        diagnostic += `\n  Topic ${topicNum} (${topicName}):\n`;
                        
                        if (claimIssuers.length === 0) {
                          diagnostic += `    ❌ No claim found in your identity\n`;
                        } else {
                          let hasValidIssuer = false;
                          for (const issuer of claimIssuers) {
                            const isTrusted = await trustedIssuersRegistry.isTrustedIssuer(issuer);
                            const canIssueTopic = await trustedIssuersRegistry.hasClaimTopic(issuer, topic);
                            
                            if (isTrusted && canIssueTopic) {
                              diagnostic += `    ✅ Claim found from trusted issuer: ${issuer.substring(0, 10)}...\n`;
                              hasValidIssuer = true;
                              break;
                            } else {
                              diagnostic += `    ⚠️ Claim found but issuer not trusted: ${issuer.substring(0, 10)}...\n`;
                              diagnostic += `       - Is trusted: ${isTrusted}\n`;
                              diagnostic += `       - Can issue topic ${topicNum}: ${canIssueTopic}\n`;
                            }
                          }
                          if (!hasValidIssuer) {
                            diagnostic += `    ❌ No trusted issuer found for this claim\n`;
                          }
                        }
                      } catch (err) {
                        diagnostic += `    ❌ Error checking claim: ${err instanceof Error ? err.message : 'Unknown'}\n`;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        diagnostic += `\n❌ Error checking verification: ${err instanceof Error ? err.message : 'Unknown'}\n`;
      }

      // 2. Check canTransfer
      try {
        const adminAddress = token.adminAddress;
        const testAmount = ethers.parseUnits('1', token.decimals);
        const canTransfer = await tokenContract.canTransfer(adminAddress, userAddress, testAmount);
        diagnostic += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        diagnostic += `5️⃣ Can Transfer: ${canTransfer ? '✅ YES' : '❌ NO'}\n`;
        if (!canTransfer) {
          // Check if frozen
          const isFrozen = await tokenContract.isFrozen(userAddress);
          if (isFrozen) {
            diagnostic += `   ⚠️ Your account is frozen\n`;
          }
        }
      } catch (err) {
        diagnostic += `\n⚠️ Error checking canTransfer: ${err instanceof Error ? err.message : 'Unknown'}\n`;
      }

      diagnostic += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      setError(diagnostic);
    } catch (err: any) {
      console.error('Error checking compliance:', err);
      setError(`❌ Error Checking Compliance\n\n${err.message || 'Unknown error occurred'}`);
    } finally {
      setCheckingCompliance(null);
    }
  };

  const transferToken = async (token: Token) => {
    const recipient = prompt('Enter recipient address:');
    if (!recipient) {
      return;
    }

    // Validate address format
    const { ethers } = await import('ethers');
    if (!ethers.isAddress(recipient)) {
      setError('❌ Invalid Address\n\nThe address you entered is not a valid Ethereum address.\n\nPlease check and try again.');
      return;
    }

    const amount = prompt('Enter amount to transfer:');
    if (!amount) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('❌ Invalid Amount\n\nPlease enter a positive number');
      return;
    }

    let provider: any;
    let signer: any;
    let tokenContract: any;

    try {
      setTransferring(token._id || '');
      setError(null);

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed.\n\nPlease install MetaMask to transfer tokens.');
      }

      const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');

      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();

      tokenContract = new ethers.Contract(
        token.tokenAddress,
        TOKEN_CLONEABLE_ABI,
        signer
      );

      console.log(`📤 Transferring ${amountNum} ${token.symbol} to ${recipient}`);
      
      const tx = await tokenContract.transfer(recipient, ethers.parseUnits(amountNum.toString(), token.decimals));
      
      await tx.wait();
      
      setError(null);
      alert(`✅ Transfer Successful!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📦 Amount: ${amountNum} ${token.symbol}\n📫 To: ${recipient.substring(0, 10)}...${recipient.substring(recipient.length - 8)}\n\n📜 Transaction Hash:\n${tx.hash}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    } catch (err: any) {
      console.error('Error transferring token:', err);
      
      let errorMsg = '❌ Transfer Failed\n\n';
      
      // Check for specific error messages
      if (err.reason === 'Transfer not compliant' || err.message?.includes('Transfer not compliant')) {
        errorMsg = '🚫 Compliance Check Failed\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        // Do detailed diagnostic
        try {
          // Recreate provider/signer/contract if not available
          if (!provider || !signer || !tokenContract) {
            if (typeof window !== 'undefined' && window.ethereum) {
              const { TOKEN_CLONEABLE_ABI } = await import('@/lib/contracts/TokenCloneable');
              provider = new ethers.BrowserProvider(window.ethereum);
              signer = await provider.getSigner();
              tokenContract = new ethers.Contract(
                token.tokenAddress,
                TOKEN_CLONEABLE_ABI,
                provider
              );
            }
          }

          if (!signer || !tokenContract) {
            throw new Error('Cannot access contracts for diagnostic');
          }

          const userAddress = await signer.getAddress();
          const transferAmount = ethers.parseUnits(amountNum.toString(), token.decimals);
          
          // Check if paused
          const isPaused = await tokenContract.paused();
          if (isPaused) {
            errorMsg += '❌ Token is PAUSED by admin\n\n';
            errorMsg += 'The token contract has been paused. Contact the token admin to unpause.\n';
            errorMsg += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━';
          } else {
            // Check if frozen
            const senderFrozen = await tokenContract.isFrozen(userAddress);
            const recipientFrozen = await tokenContract.isFrozen(recipient);
            
            if (senderFrozen) {
              errorMsg += `❌ YOUR account (${userAddress.substring(0, 10)}...) is FROZEN\n\n`;
              errorMsg += 'Contact the token admin to unfreeze your account.\n';
            } else if (recipientFrozen) {
              errorMsg += `❌ RECIPIENT account (${recipient.substring(0, 10)}...) is FROZEN\n\n`;
              errorMsg += 'The recipient\'s account is frozen. They need to contact the token admin.\n';
            } else {
              // Check verification status
              const senderVerified = await tokenContract.isVerified(userAddress);
              const recipientVerified = await tokenContract.isVerified(recipient);
              
              errorMsg += `📍 Sender (${userAddress.substring(0, 10)}...):\n`;
              errorMsg += `   Verified: ${senderVerified ? '✅ YES' : '❌ NO'}\n\n`;
              
              errorMsg += `📍 Recipient (${recipient.substring(0, 10)}...):\n`;
              errorMsg += `   Verified: ${recipientVerified ? '✅ YES' : '❌ NO'}\n\n`;
              
              if (!senderVerified) {
                errorMsg += '⚠️ YOU need to:\n';
                errorMsg += '  1. Register your identity in Identity app (port 4001)\n';
                errorMsg += '  2. Obtain required claims\n';
                errorMsg += '  3. Load claims to your identity contract\n\n';
              }
              
              if (!recipientVerified) {
                errorMsg += '⚠️ RECIPIENT needs to:\n';
                errorMsg += '  1. Register their identity in Identity app (port 4001)\n';
                errorMsg += '  2. Obtain required claims\n';
                errorMsg += '  3. Load claims to their identity contract\n\n';
              }
              
              // Check compliance modules
              try {
                const complianceModules = await tokenContract.getComplianceModules();
                if (complianceModules.length > 0) {
                  errorMsg += `🔒 Compliance Modules: ${complianceModules.length}\n`;
                  
                  for (let i = 0; i < complianceModules.length; i++) {
                    const moduleAddr = complianceModules[i];
                    errorMsg += `   Module ${i + 1}: ${moduleAddr.substring(0, 10)}...\n`;
                    
                    try {
                      // Try to call canTransfer on each module
                      const COMPLIANCE_ABI = [
                        "function canTransfer(address,address,uint256) view returns (bool)"
                      ];
                      const module = new ethers.Contract(moduleAddr, COMPLIANCE_ABI, provider);
                      const moduleCanTransfer = await module.canTransfer(userAddress, recipient, transferAmount);
                      if (!moduleCanTransfer) {
                        errorMsg += `      ❌ This module is BLOCKING the transfer\n`;
                      }
                    } catch (moduleErr) {
                      errorMsg += `      ⚠️ Could not check module status\n`;
                    }
                  }
                }
              } catch (modulesErr) {
                // Ignore if can't get modules
              }
              
              // Show required claims
              if (token.requiredClaims && token.requiredClaims.length > 0) {
                errorMsg += '\n📋 Required Claims:\n';
        token.requiredClaims.forEach(topic => {
          const claimName = CLAIM_DESCRIPTIONS[topic]?.name || `Claim ${topic}`;
          errorMsg += `  • ${claimName}\n`;
        });
              }
            }
            
            errorMsg += '\n💡 Use "Check Compliance" button for detailed diagnostic\n';
            errorMsg += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━';
          }
        } catch (diagErr) {
          // Fallback to simple message if diagnostic fails
          errorMsg += `Transfer failed compliance check.\n\n`;
          errorMsg += `Possible causes:\n`;
          errorMsg += `  • Token is paused\n`;
          errorMsg += `  • Account(s) are frozen\n`;
          errorMsg += `  • Sender or recipient not verified\n`;
          errorMsg += `  • Compliance module restrictions\n`;
          errorMsg += `\nUse "Check Compliance" button for detailed info.\n`;
        errorMsg += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        }
      } else if (err.message?.includes('insufficient')) {
        errorMsg += '💸 Insufficient Balance\n\nYou don\'t have enough tokens to transfer';
      } else if (err.message?.includes('execution reverted')) {
        errorMsg += '⚠️ Transaction Reverted\n\nPossible causes:\n• Token is paused by admin\n• Transfer restrictions active\n• Invalid recipient address';
      } else if (err.message?.includes('user rejected')) {
        errorMsg += '🚫 Transaction Cancelled\n\nYou rejected the transaction in MetaMask';
      } else {
        errorMsg += err.message || 'Unknown error occurred';
      }
      
      setError(errorMsg);
    } finally {
      setTransferring(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🏪 Token Marketplace
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Buy and transfer RWA tokens
              </p>
              
              {/* Navigation */}
              <div className="mt-3 flex gap-3">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  ← Back to Factory
                </a>
              </div>
            </div>
            
            {/* Wallet Section */}
            <div className="flex items-center gap-3">
              {account ? (
                <>
                  <div className="rounded-lg bg-white px-4 py-2 shadow dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
                    <code className="text-sm font-semibold text-gray-900 dark:text-white">
                      {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </code>
                  </div>
                  <button
                    onClick={switchAccount}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    🔄 Switch Account
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-6 shadow-lg dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <pre className="whitespace-pre-wrap font-sans text-sm text-red-800 dark:text-red-400">
                  {error}
                </pre>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tokens Grid */}
        {loading ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            Loading tokens...
          </div>
        ) : tokens.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No tokens available yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tokens.map((token) => (
              <div
                key={token._id}
                className="rounded-lg bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    💎 {token.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {token.symbol}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Price per Token
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {token.price !== undefined ? `${token.price} ETH` : 'Price not set'}
                  </p>
                </div>

                {/* Token Info */}
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Token Address:
                    </p>
                    <code className="block break-all text-xs text-gray-900 dark:text-white">
                      {token.tokenAddress}
                    </code>
                  </div>

                  {token.description && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Description:
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {token.description}
                      </p>
                    </div>
                  )}

                  {/* Required Claims */}
                  {token.requiredClaims && token.requiredClaims.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Required Claims:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {token.requiredClaims.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          >
                            {CLAIM_DESCRIPTIONS[topic]?.name || `Claim ${topic}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {token.price !== undefined && account && (
                  <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const amount = prompt(`How many ${token.symbol} tokens do you want to buy?\n\nPrice: ${token.price} ETH per token`);
                        if (amount) {
                          buyToken(token, amount);
                        }
                      }}
                      disabled={buying === token._id}
                      className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {buying === token._id ? '💳 Processing...' : '💰 Buy Tokens'}
                    </button>
                    
                    <button
                      onClick={() => checkCompliance(token)}
                      disabled={checkingCompliance === token._id}
                      className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {checkingCompliance === token._id ? '🔍 Checking...' : '🔍 Check Compliance'}
                    </button>
                    
                    <button
                      onClick={() => transferToken(token)}
                      disabled={transferring === token._id}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {transferring === token._id ? '📤 Processing...' : '📤 Transfer Tokens'}
                    </button>
                  </div>
                )}

                {!account && (
                  <div className="mt-4 rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Connect wallet to buy or transfer
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            ℹ️ Marketplace Information
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              • <strong>Buy Tokens:</strong> Purchase RWA tokens at the listed price (requires compliance claims)
            </p>
            <p>
              • <strong>Transfer Tokens:</strong> Send your tokens to another address
            </p>
            <p>
              • <strong>Switch Account:</strong> Change the connected wallet to view different balances
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              ⚠️ Note: Actual token purchases would require payment handling. This is a simplified implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

