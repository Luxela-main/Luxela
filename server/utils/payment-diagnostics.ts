/**
 * Payment Diagnostics Utility
 * 
 * Helps identify and resolve payment provider errors, particularly
 * issues with Tsara API authentication, connectivity, and error handling.
 */

import { diagnoseTsaraConnection, formatErrorDetails } from '../services/tsara';

export interface DiagnosticReport {
  timestamp: string;
  environment: string;
  paymentProvider: {
    name: string;
    configured: boolean;
    credentials: {
      secretKey: boolean;
      publicKey: boolean;
    };
    connectivity: {
      reachable: boolean;
      error?: string;
      baseUrl: string;
    };
  };
  commonIssues: {
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    resolution: string[];
  }[];
  recommendations: string[];
}

/**
 * Generate a comprehensive diagnostic report
 */
export async function generateDiagnosticReport(): Promise<DiagnosticReport> {
  const diagnosis = await diagnoseTsaraConnection();
  
  const commonIssues: DiagnosticReport['commonIssues'] = [];
  const recommendations: string[] = [];

  // Check for missing credentials
  if (!diagnosis.hasSecretKey) {
    commonIssues.push({
      title: 'Missing Tsara Secret Key',
      description: 'The TSARA_SECRET_KEY environment variable is not set or empty.',
      severity: 'critical' as const,
      resolution: [
        '1. Check your .env file for TSARA_SECRET_KEY',
        '2. Ensure the value is not empty or malformed',
        '3. Restart the server after updating .env',
        '4. Contact Tsara support if you don\'t have a secret key',
      ],
    });
  }

  if (!diagnosis.hasPublicKey) {
    commonIssues.push({
      title: 'Missing Tsara Public Key',
      description: 'The TSARA_PUBLIC_KEY environment variable is not set or empty.',
      severity: 'critical' as const,
      resolution: [
        '1. Check your .env file for TSARA_PUBLIC_KEY',
        '2. Ensure the value is not empty or malformed',
        '3. Restart the server after updating .env',
      ],
    });
  }

  // Check connectivity
  if (!diagnosis.canReachApi) {
    commonIssues.push({
      title: 'Cannot Reach Tsara API',
      description: `The server cannot connect to the Tsara API at ${diagnosis.baseUrl}.`,
      severity: 'critical' as const,
      resolution: [
        '1. Check your internet connection',
        '2. Verify the Tsara API is not down: check https://status.tsara.ng',
        '3. Check firewall/VPN settings that might block the connection',
        '4. Verify the API endpoint is correct in your .env',
        `5. Current endpoint: ${diagnosis.baseUrl}`,
      ],
    });
    if (diagnosis.errorDetails) {
      commonIssues[commonIssues.length - 1].resolution.push(`Error: ${diagnosis.errorDetails}`);
    }
  }

  // Generate recommendations
  if (diagnosis.isConfigured && diagnosis.canReachApi) {
    recommendations.push('✓ Tsara API is properly configured and reachable');
  } else {
    recommendations.push('⚠️ Payment provider has configuration issues - see common issues above');
  }

  if (diagnosis.environment === 'production') {
    recommendations.push(
      'You are in PRODUCTION environment - ensure you are using production Tsara credentials'
    );
  } else {
    recommendations.push(
      'You are in DEVELOPMENT environment - ensure you are using sandbox Tsara credentials'
    );
  }

  return {
    timestamp: diagnosis.timestamp,
    environment: diagnosis.environment,
    paymentProvider: {
      name: 'Tsara',
      configured: diagnosis.isConfigured,
      credentials: {
        secretKey: diagnosis.hasSecretKey,
        publicKey: diagnosis.hasPublicKey,
      },
      connectivity: {
        reachable: diagnosis.canReachApi,
        error: diagnosis.errorDetails,
        baseUrl: diagnosis.baseUrl,
      },
    },
    commonIssues,
    recommendations,
  };
}

/**
 * Error classifier for payment errors
 * Helps identify the root cause of payment-related errors
 */
export function classifyPaymentError(error: any): {
  category: 'configuration' | 'connectivity' | 'validation' | 'authentication' | 'unknown';
  description: string;
  isRetryable: boolean;
  suggestedActions: string[];
} {
  const errorStr = JSON.stringify(error).toLowerCase();
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code?.toLowerCase() || '';

  // Configuration errors
  if (
    errorStr.includes('secret') ||
    errorStr.includes('api key') ||
    errorStr.includes('credential') ||
    message.includes('unauthorized') ||
    code.includes('auth')
  ) {
    return {
      category: 'authentication',
      description: 'API authentication failed - likely due to invalid or missing credentials',
      isRetryable: false,
      suggestedActions: [
        'Verify TSARA_SECRET_KEY is correctly set in .env',
        'Ensure no extra whitespace in the key',
        'Restart the server after updating credentials',
        'Contact Tsara support if credentials are correct',
      ],
    };
  }

  // Connectivity errors
  if (
    errorStr.includes('econnrefused') ||
    errorStr.includes('enotfound') ||
    errorStr.includes('timeout') ||
    errorStr.includes('network') ||
    errorStr.includes('connection') ||
    message.includes('failed to fetch') ||
    code.includes('net')
  ) {
    return {
      category: 'connectivity',
      description: 'Cannot connect to payment provider API',
      isRetryable: true,
      suggestedActions: [
        'Check internet connection',
        'Verify Tsara API is reachable',
        'Check firewall/proxy settings',
        'Wait a moment and retry the payment',
      ],
    };
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    code.includes('invalid') ||
    code.includes('bad_request') ||
    errorStr.includes('amount') ||
    errorStr.includes('currency')
  ) {
    return {
      category: 'validation',
      description: 'Payment request validation failed',
      isRetryable: true,
      suggestedActions: [
        'Verify payment amount is valid',
        'Check currency is supported',
        'Ensure all required fields are provided',
        'Check customer information is complete',
      ],
    };
  }

  // Unknown errors
  return {
    category: 'unknown',
    description: `Payment error: ${error?.message || 'Unknown error'}`,
    isRetryable: true,
    suggestedActions: [
      'Check the browser console for detailed error messages',
      'Review server logs for more information',
      'Try the payment again',
      'Contact support with error details',
    ],
  };
}

/**
 * Format a detailed error report for debugging
 */
export function formatErrorReport(error: any, context?: any): string {
  const classification = classifyPaymentError(error);
  const timestamp = new Date().toISOString();
  
  const report = [
    '='.repeat(60),
    'PAYMENT ERROR DIAGNOSTIC REPORT',
    '='.repeat(60),
    `Timestamp: ${timestamp}`,
    `Category: ${classification.category.toUpperCase()}`,
    `Description: ${classification.description}`,
    `Retryable: ${classification.isRetryable ? 'Yes' : 'No'}`,
    '',
    'Error Details:',
    `-`.repeat(40),
    `Message: ${error?.message || 'N/A'}`,
    `Code: ${error?.code || 'N/A'}`,
    `Status: ${error?.status || error?.response?.status || 'N/A'}`,
    formatErrorDetails(error),
    '',
    'Suggested Actions:',
    `-`.repeat(40),
    ...classification.suggestedActions.map(action => `• ${action}`),
  ];

  if (context) {
    report.push('');
    report.push('Context:');
    report.push('-'.repeat(40));
    report.push(JSON.stringify(context, null, 2));
  }

  report.push('');
  report.push('='.repeat(60));
  
  return report.join('\n');
}

/**
 * Log payment error with diagnostic information
 */
export function logPaymentError(error: any, context?: Record<string, any>) {
  const report = formatErrorReport(error, context);
  console.error(report);
  
  // Also send to error tracking service if configured
  if (process.env.SENTRY_DSN) {
    try {
      // This would integrate with Sentry or similar error tracking
      // console.log('Error sent to tracking service');
    } catch (trackingError) {
      console.error('Failed to log error to tracking service:', trackingError);
    }
  }
}