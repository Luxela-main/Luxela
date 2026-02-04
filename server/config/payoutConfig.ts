export const payoutConfig = {
  payout: {
    minAmountCents: parseInt(process.env.PAYOUT_MIN_AMOUNT || '10000'),
    maxAmountCents: parseInt(process.env.PAYOUT_MAX_AMOUNT || '500000000'),
    processingFeePersent: parseFloat(process.env.PAYOUT_PROCESSING_FEE_PERCENT || '0'),
    processingTimeoutMs: 30000,
    retryConfig: {
      maxAttempts: 3,
      initialDelayMs: 300000, // 5 minutes
      delayMultiplier: 3, // Exponential backoff
      maxDelayMs: 3600000, // 1 hour
    },
  },

  escrow: {
    holdDurationDays: parseInt(process.env.ESCROW_HOLD_DURATION_DAYS || '30'),
    releaseOnDelivery: process.env.ESCROW_RELEASE_ON_DELIVERY === 'true',
    immediateReleaseForRecurring: process.env.ESCROW_IMMEDIATE_RELEASE_FOR_RECURRING === 'true',
    feePercent: 0,
  },

  tsara: {
    apiUrl: process.env.TSARA_API_URL || 'https://api.tsara.io/v1',
    secretKey: process.env.TSARA_SECRET_KEY || '',
    webhookSecret: process.env.TSARA_WEBHOOK_SECRET || '',
    enabledFor: {
      immediate: false,
      scheduled: false,
      recurring: true
    },
    
    settings: {
      useEscrowForRecurring: true,
      apiTimeoutMs: 30000,
      retryFailedRequests: true,
      maxRetries: 3,
    },
  },

  fallback: {
    paystack: {
      enabled: !!process.env.PAYSTACK_SECRET_KEY,
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      apiUrl: 'https://api.paystack.co',
      timeoutMs: 30000,
      supportedMethods: ['bank_transfer', 'mobile_money'],
    },
    
    wise: {
      enabled: !!process.env.WISE_API_TOKEN,
      apiToken: process.env.WISE_API_TOKEN || '',
      apiUrl: 'https://api.wise.com',
      timeoutMs: 30000,
      supportedMethods: ['bank_transfer', 'international'],
    },
    
    flutterwave: {
      enabled: !!process.env.FLUTTERWAVE_SECRET_KEY,
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
      apiUrl: 'https://api.flutterwave.com/v3',
      timeoutMs: 30000,
      supportedMethods: ['bank_transfer', 'mobile_money'],
    },
    
    crypto: {
      enabled: !!process.env.CRYPTO_PROCESSOR_API_KEY,
      apiKey: process.env.CRYPTO_PROCESSOR_API_KEY || '',
      apiUrl: process.env.CRYPTO_PROCESSOR_URL || '',
      timeoutMs: 60000, // Longer timeout for blockchain
      supportedMethods: ['crypto'],
      networkFeePercent: 1,
    },
  },

  methodFiltering: {
    availableMethods: {
      immediate: ['bank_transfer', 'paypal', 'crypto', 'wise'],
      scheduled: ['bank_transfer', 'paypal', 'crypto', 'wise'],
      daily: ['bank_transfer', 'paypal', 'crypto', 'wise', 'tsara'],
      weekly: ['bank_transfer', 'paypal', 'crypto', 'wise', 'tsara'],
      bi_weekly: ['bank_transfer', 'paypal', 'crypto', 'wise', 'tsara'],
      monthly: ['bank_transfer', 'paypal', 'crypto', 'wise', 'tsara'],
    },
    
    recommended: {
      immediate: 'bank_transfer',
      scheduled: 'paypal',
      daily: 'tsara',
      weekly: 'tsara',
      bi_weekly: 'tsara',
      monthly: 'paypal',
    },
  },

  cron: {
    schedules: {
      production: '*/5 * * * *',
      staging: '*/2 * * * *',
      development: '* * * * *'
    },
    
    getSchedule(): string {
      const env = process.env.NODE_ENV || 'development';
      return this.schedules[env as keyof typeof this.schedules] || this.schedules.development;
    },
    
    executionTimeoutMs: 30000,
    maxConcurrentPayouts: 10,
    enabled: process.env.PAYOUT_CRON_ENABLED !== 'false',
  },

  notifications: {
    onCompletion: true,
    onFailure: true,
    errorWebhookUrl: process.env.PAYOUT_ERROR_WEBHOOK_URL || '',
    emailNotifications: {
      enabled: true,
      from: 'payouts@yourplatform.com',
      templates: {
        success: 'payout-success',
        failed: 'payout-failed',
        pending: 'payout-pending',
      },
    },
  },

  monitoring: {
    detailedLogging: process.env.NODE_ENV !== 'production',
    logApiCalls: true,
    sentryDsn: process.env.SENTRY_DSN || '',
    enablePerformanceMonitoring: true,
    metricsPrefix: 'payout_',
  },

  security: {
    requireIpWhitelist: true,
    validateWebhookSignatures: true,
    encryptSensitiveData: true,
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 10
    },
  },

  validation: {
    requireVerifiedMethods: true,
    requireKyc: true,
    dailyLimitCents: 100000000,
    weeklyLimitCents: 500000000,
    monthlyLimitCents: 1000000000
  },

  getEnabledProcessors(): string[] {
    const enabled: string[] = [];
    
    if (this.tsara.settings.useEscrowForRecurring) enabled.push('tsara');
    if (this.fallback.paystack.enabled) enabled.push('paystack');
    if (this.fallback.wise.enabled) enabled.push('wise');
    if (this.fallback.flutterwave.enabled) enabled.push('flutterwave');
    if (this.fallback.crypto.enabled) enabled.push('crypto');
    
    return enabled;
  },

  isProcessorEnabled(processorName: string): boolean {
    switch (processorName.toLowerCase()) {
      case 'tsara':
        return !!this.tsara.secretKey;
      case 'paystack':
        return this.fallback.paystack.enabled;
      case 'wise':
        return this.fallback.wise.enabled;
      case 'flutterwave':
        return this.fallback.flutterwave.enabled;
      case 'crypto':
        return this.fallback.crypto.enabled;
      default:
        return false;
    }
  },

  getCronSchedule(): string {
    return this.cron.getSchedule();
  },

  isValidPayoutAmount(amountCents: number): boolean {
    return (
      amountCents >= this.payout.minAmountCents &&
      amountCents <= this.payout.maxAmountCents
    );
  },

  getAvailableMethodsForSchedule(scheduleType: string): string[] {
    return (
      this.methodFiltering.availableMethods[
        scheduleType as keyof typeof this.methodFiltering.availableMethods
      ] || []
    );
  },

  getRecommendedMethodForSchedule(scheduleType: string): string | null {
    return (
      this.methodFiltering.recommended[
        scheduleType as keyof typeof this.methodFiltering.recommended
      ] || null
    );
  },
};

export type PayoutConfig = typeof payoutConfig;