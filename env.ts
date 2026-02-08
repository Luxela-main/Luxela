export const env = {
  // Environment
  DATABASE_URL: process.env.DATABASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // URLs
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://theluxela.com',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:3000',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // Email Configuration (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  
  // SMTP Configuration for Listing Notifications
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.resend.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER: process.env.SMTP_USER || 'resend',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || true,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@theluxela.com',
  EMAIL_FROM: process.env.SMTP_FROM || 'noreply@theluxela.com',
  
  // Polling Configuration
  NOTIFICATION_POLL_INTERVAL: parseInt(process.env.NOTIFICATION_POLL_INTERVAL || '5000', 10), // 5 seconds
  NOTIFICATION_RETENTION_DAYS: parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '30', 10),
};