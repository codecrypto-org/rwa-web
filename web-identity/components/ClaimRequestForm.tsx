/**
 * Claim Request Form Component
 * 
 * Form to request a claim from a trusted issuer
 */

'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  TRUSTED_ISSUERS_REGISTRY_ADDRESS,
  TRUSTED_ISSUERS_REGISTRY_ABI,
  NETWORK_CONFIG,
} from '@/contracts/TrustedIssuersRegistry';

interface Issuer {
  address: string;
  claimTopics: bigint[];
}

interface ClaimRequestFormProps {
  userAddress: string;
  onSuccess: () => void;
}

export default function ClaimRequestForm({ userAddress, onSuccess }: ClaimRequestFormProps) {
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<string>('');
  const [availableTopics, setAvailableTopics] = useState<bigint[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingIssuers, setLoadingIssuers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIssuers();
  }, []);

  useEffect(() => {
    if (selectedIssuer) {
      const issuer = issuers.find(i => i.address === selectedIssuer);
      if (issuer) {
        setAvailableTopics(issuer.claimTopics);
        setSelectedTopic('');
      }
    } else {
      setAvailableTopics([]);
      setSelectedTopic('');
    }
  }, [selectedIssuer, issuers]);

  const loadIssuers = async () => {
    try {
      setLoadingIssuers(true);
      setError(null);

      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const contract = new ethers.Contract(
        TRUSTED_ISSUERS_REGISTRY_ADDRESS,
        TRUSTED_ISSUERS_REGISTRY_ABI,
        provider
      );

      const issuerAddresses = await contract.getTrustedIssuers();
      
      const issuersData = await Promise.all(
        issuerAddresses.map(async (address: string) => {
          const claimTopics = await contract.getIssuerClaimTopics(address);
          return {
            address,
            claimTopics,
          };
        })
      );

      setIssuers(issuersData);
    } catch (err) {
      console.error('Error loading issuers:', err);
      setError('Failed to load trusted issuers');
    } finally {
      setLoadingIssuers(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (): Promise<{
    fileId: string;
    filename: string;
    contentType: string;
    size: number;
  } | null> => {
    if (!file) return null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to upload file');
      }

      return {
        fileId: result.data.fileId,
        filename: result.data.filename,
        contentType: result.data.contentType,
        size: result.data.size,
      };
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIssuer || !selectedTopic) {
      setError('Please select an issuer and claim topic');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload file if exists
      let documentData: {
        fileId: string;
        filename: string;
        contentType: string;
        size: number;
      } | null = null;
      if (file) {
        documentData = await uploadFile();
      }

      // Create claim request
      const requestBody = {
        requesterAddress: userAddress,
        issuerAddress: selectedIssuer,
        claimTopic: selectedTopic,
        message,
        documentFileId: documentData?.fileId,
        documentName: documentData?.filename,
        documentContentType: documentData?.contentType,
        documentSize: documentData?.size,
      };

      const response = await fetch('/api/claim-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create claim request');
      }

      // Reset form
      setSelectedIssuer('');
      setSelectedTopic('');
      setMessage('');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      alert('Claim request submitted successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error submitting claim request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit claim request');
    } finally {
      setLoading(false);
    }
  };

  if (loadingIssuers) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Loading trusted issuers...
        </p>
      </div>
    );
  }

  if (issuers.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Request Claim
        </h2>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            No trusted issuers available. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Request Claim
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Issuer Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Issuer *
          </label>
          <select
            value={selectedIssuer}
            onChange={(e) => setSelectedIssuer(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">-- Select an issuer --</option>
            {issuers.map((issuer) => (
              <option key={issuer.address} value={issuer.address}>
                {issuer.address}
              </option>
            ))}
          </select>
        </div>

        {/* Claim Topic Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Claim Topic *
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            disabled={!selectedIssuer}
          >
            <option value="">-- Select a claim topic --</option>
            {availableTopics.map((topic) => (
              <option key={topic.toString()} value={topic.toString()}>
                Topic {topic.toString()}
              </option>
            ))}
          </select>
          {!selectedIssuer && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Please select an issuer first
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Additional information about your claim request..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Attach Document (Optional)
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          {file && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max file size: 10MB. Supported formats: PDF, DOC, DOCX, JPG, PNG
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? uploading
              ? 'Uploading file...'
              : 'Submitting...'
            : 'Submit Claim Request'}
        </button>
      </form>
    </div>
  );
}

