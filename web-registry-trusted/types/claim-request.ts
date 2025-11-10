/**
 * Types for Claim Requests
 */

export interface ClaimRequest {
  _id?: string;
  requesterAddress: string;
  issuerAddress: string;
  claimTopic: string;
  message?: string;
  documentFileId?: string;
  documentName?: string;
  documentContentType?: string;
  documentSize?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewNote?: string;
}

export interface UpdateRequestStatusDto {
  requestId: string;
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

