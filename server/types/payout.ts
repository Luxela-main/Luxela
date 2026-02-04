export type PayoutSchedule = 'immediate' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'scheduled';

export type PayoutMethodType = 'bank_transfer' | 'paypal' | 'crypto' | 'wise' | 'tsara';

export interface PayoutMethod {
  id: string;
  type: PayoutMethodType;
  accountDetails?: Record<string, any>;
  isVerified: boolean;
  createdAt: Date;
}

export interface ScheduledPayoutRecord {
  id: string;
  sellerId: string;
  amountCents: number;
  currency: string;
  schedule: PayoutSchedule;
  payoutMethodId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  nextScheduledAt?: Date;
  lastProcessedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutExecutionResult {
  success: boolean;
  payoutId: string;
  status: 'completed' | 'processing' | 'failed';
  message: string;
  transactionRef?: string;
  error?: string;
  timestamp: Date;
}

export interface PayoutBalance {
  available: number;
  processing: number;
  total: number;
  currency: string;
  lastUpdated: Date;
}

export interface PayoutRequest {
  sellerId: string;
  amountCents: number;
  currency: string;
  methodId: string;
  methodType: PayoutMethodType;
  accountDetails?: Record<string, any>;
  reference: string;
  description?: string;
}