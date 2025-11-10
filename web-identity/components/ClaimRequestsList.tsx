/**
 * Claim Requests List Component
 * 
 * Displays a list of claim requests with their status
 */

'use client';

import { useState, useEffect } from 'react';
import { ClaimRequest } from '@/types/claim-request';

interface ClaimRequestsListProps {
  userAddress: string;
  refreshTrigger: number;
}

export default function ClaimRequestsList({ userAddress, refreshTrigger }: ClaimRequestsListProps) {
  const [requests, setRequests] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, [userAddress, refreshTrigger, filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        requesterAddress: userAddress,
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/claim-requests?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load requests');
      }

      setRequests(result.data);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌',
    };
    
    return icons[status as keyof typeof icons] || '⏳';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Loading claim requests...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          My Claim Requests ({requests.length})
        </h2>
        <button
          onClick={loadRequests}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all'
              ? 'No claim requests yet. Submit your first request above!'
              : `No ${filter} requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <div
              key={request._id || index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(request.status)}`}>
                      {getStatusIcon(request.status)} {request.status.toUpperCase()}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Topic {request.claimTopic}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Issuer Address:
                      </p>
                      <code className="block break-all text-sm text-gray-900 dark:text-white">
                        {request.issuerAddress}
                      </code>
                    </div>
                    
                    {request.message && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Message:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {request.message}
                        </p>
                      </div>
                    )}
                    
                    {request.documentFileId && (
                      <div className="mt-2">
                        <a
                          href={`/api/download/${request.documentFileId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          📎 {request.documentName || 'View Document'}
                          {request.documentSize && (
                            <span className="text-xs text-gray-500">
                              ({(request.documentSize / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {formatDate(request.createdAt)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {formatDate(request.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

