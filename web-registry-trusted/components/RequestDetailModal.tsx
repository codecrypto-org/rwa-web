/**
 * Request Detail Modal Component
 * 
 * Shows detailed information about a request and allows approval/rejection
 */

'use client';

import { useState } from 'react';
import { ClaimRequest } from '@/types/claim-request';

interface RequestDetailModalProps {
  request: ClaimRequest;
  onClose: () => void;
  onUpdate: () => void;
  issuerAddress: string;
}

export default function RequestDetailModal({ request, onClose, onUpdate, issuerAddress }: RequestDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const handleAction = async (status: 'approved' | 'rejected') => {
    // Verify issuer address matches
    if (issuerAddress.toLowerCase() !== request.issuerAddress.toLowerCase()) {
      setError('You are not authorized to review this request');
      return;
    }

    if (request.status !== 'pending') {
      setError('This request has already been reviewed');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/update-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request._id,
          status,
          reviewNote,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update request');
      }

      alert(`Request ${status} successfully!`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating request:', err);
      setError(err instanceof Error ? err.message : 'Failed to update request');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Claim Request Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadge(request.status)}`}>
            {request.status.toUpperCase()}
          </span>
        </div>

        {/* Request Information */}
        <div className="space-y-4">
          {/* Requester Address */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Requester Address
            </p>
            <code className="block break-all text-sm text-gray-900 dark:text-white">
              {request.requesterAddress}
            </code>
          </div>

          {/* Issuer Address */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Issuer Address (You)
            </p>
            <code className="block break-all text-sm text-gray-900 dark:text-white">
              {request.issuerAddress}
            </code>
          </div>

          {/* Claim Topic */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Claim Topic
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Topic {request.claimTopic}
            </p>
          </div>

          {/* Message */}
          {request.message && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Message
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {request.message}
              </p>
            </div>
          )}

          {/* Document */}
          {request.documentFileId && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Attached Document
              </p>
              <a
                href={`/api/download/${request.documentFileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                📎 {request.documentName || 'Download Document'}
                {request.documentSize && (
                  <span className="text-xs">
                    ({(request.documentSize / 1024).toFixed(1)} KB)
                  </span>
                )}
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Timeline
            </p>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>Created: {formatDate(request.createdAt)}</p>
              <p>Updated: {formatDate(request.updatedAt)}</p>
              {request.reviewedAt && (
                <p>Reviewed: {formatDate(request.reviewedAt)}</p>
              )}
            </div>
          </div>

          {/* Review Note (if already reviewed) */}
          {request.reviewNote && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Review Note
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {request.reviewNote}
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions (only for pending requests) */}
        {request.status === 'pending' && (
          <div className="mt-6 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review This Request
            </h3>
            
            {/* Review Note Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Review Note (Optional)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Add any notes or comments about your decision..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleAction('approved')}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processing...' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processing...' : '✕ Reject'}
              </button>
            </div>
          </div>
        )}

        {/* Close Button (for already reviewed requests) */}
        {request.status !== 'pending' && (
          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

