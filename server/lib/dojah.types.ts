/**
 * Dojah ID Verification Types and Interfaces
 */

export type IDType = 'national_id' | 'drivers_license' | 'voters_card' | 'passport';

export type CountryCode = 'NG' | 'KE' | 'GH' | 'ZA' | 'UG' | 'TZ';

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';

/**
 * Personal information extracted from Dojah verification
 */
export interface VerifiedPersonalInfo {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Result of Dojah verification attempt
 */
export interface DojahVerificationResult {
  success: boolean;
  message: string;
  verified?: boolean;
  data?: Record<string, any>;
  personalInfo?: VerifiedPersonalInfo;
}

/**
 * Dojah API Response structure
 */
export interface DojahAPIResponse {
  status: boolean;
  message?: string;
  data?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    dob?: string;
    date_of_birth?: string;
    phone?: string;
    email?: string;
    address?: string;
    gender?: string;
    nationality?: string;
    verified?: boolean;
    [key: string]: any;
  };
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Seller verification record in database
 */
export interface SellerVerificationRecord {
  idType: IDType;
  idNumber: string;
  idVerified: boolean;
  verificationStatus: VerificationStatus;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  verificationCountry?: string | null;
  verificationDate?: Date | null;
  dojahResponse?: Record<string, any> | null;
}