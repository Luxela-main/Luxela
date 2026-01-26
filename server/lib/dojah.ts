import { z } from 'zod';

/**
 * Supported countries and their corresponding Dojah API endpoints
 */
export const COUNTRY_ENDPOINTS: Record<string, string> = {
  NG: 'https://api.dojah.io/api/v1/kyc/nigeria/identity', // Nigeria
  KE: 'https://api.dojah.io/api/v1/kyc/kenya/identity', // Kenya
  GH: 'https://api.dojah.io/api/v1/kyc/ghana/identity', // Ghana
  ZA: 'https://api.dojah.io/api/v1/kyc/southafrica/identity', // South Africa
  UG: 'https://api.dojah.io/api/v1/kyc/uganda/identity', // Uganda
  TZ: 'https://api.dojah.io/api/v1/kyc/tanzania/identity', // Tanzania
};

/**
 * Map user-provided ID types to Dojah API ID types
 */
export const ID_TYPE_MAPPING: Record<string, string> = {
  national_id: 'nin',
  drivers_license: 'dl',
  voters_card: 'pvc',
  passport: 'passport',
};

/**
 * Dojah API Response Schema - Basic validation
 */
export const DojahResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    id: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    dob: z.string().optional(),
    date_of_birth: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    verified: z.boolean().optional(),
  }).optional(),
});

export type DojahResponse = z.infer<typeof DojahResponseSchema>;

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep helper for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
};

/**
 * Verify ID with Dojah API with retry logic and validation
 */
export async function verifyIdWithDojah(
  idType: string,
  idNumber: string,
  countryCode: string = 'NG',
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{
  success: boolean;
  message: string;
  data?: any;
  verified?: boolean;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}> {
  // Validate inputs
  if (!idType || !idNumber) {
    return {
      success: false,
      message: 'ID type and ID number are required',
    };
  }

  // Get API credentials
  const appId = process.env.DOJAH_APP_ID;
  const secretKey = process.env.DOJAH_SECRET_KEY;

  if (!appId || !secretKey) {
    console.error('Dojah API credentials not configured');
    return {
      success: false,
      message: 'ID verification service is not properly configured',
    };
  }

  // Get endpoint for country
  const endpoint = COUNTRY_ENDPOINTS[countryCode];
  if (!endpoint) {
    return {
      success: false,
      message: `ID verification is not supported for country code: ${countryCode}`,
    };
  }

  // Map ID type to Dojah format
  const mappedIdType = ID_TYPE_MAPPING[idType];
  if (!mappedIdType) {
    return {
      success: false,
      message: `Unsupported ID type: ${idType}`,
    };
  }

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, retryConfig);
        console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
        await sleep(delay);
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let validatedResponse: any;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'AppId': appId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_type: mappedIdType,
            id_number: idNumber,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Dojah API returned status ${response.status}: ${response.statusText}`
          );
        }

        const rawData = await response.json();

        // Validate response schema
        validatedResponse = DojahResponseSchema.safeParse(rawData);

        if (!validatedResponse.success) {
          console.error('Invalid Dojah response format:', validatedResponse.error);
          lastError = new Error('Invalid response format from verification service');
          continue;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Verification request timed out. Please try again.');
        } else {
          lastError = error instanceof Error ? error : new Error('Request failed');
        }
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      const data = validatedResponse.data;

      // Check if verification was successful
      if (data.status && data.data) {
        const personalInfo = data.data;

        return {
          success: true,
          message: 'ID verified successfully',
          data: data.data,
          verified: true,
          personalInfo: {
            firstName: personalInfo.first_name,
            lastName: personalInfo.last_name,
            dateOfBirth: personalInfo.dob || personalInfo.date_of_birth,
            phone: personalInfo.phone,
            email: personalInfo.email,
            address: personalInfo.address,
          },
        };
      } else {
        return {
          success: false,
          message: data.message || 'ID verification failed. Please check your details.',
          verified: false,
        };
      }
    } catch (err: any) {
      lastError = err;

      // Check if this is a retryable error
      const isRetryable =
        err.message?.includes('timeout') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENOTFOUND') ||
        (err.statusCode && err.statusCode >= 500); // Server errors are retryable

      if (!isRetryable || attempt === retryConfig.maxRetries) {
        console.error(`Verification failed after ${attempt + 1} attempts:`, err);
        break;
      }
    }
  }

  // All retries exhausted
  console.error('ID verification failed after all retry attempts:', lastError);
  return {
    success: false,
    message: lastError?.message || 'Failed to verify ID. Please try again later.',
  };
}

/**
 * Get country code from country name
 */
export function getCountryCode(countryName: string): string {
  const countryMap: Record<string, string> = {
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Ghana': 'GH',
    'South Africa': 'ZA',
    'Uganda': 'UG',
    'Tanzania': 'TZ',
  };

  return countryMap[countryName] || 'NG'; // Default to Nigeria
}