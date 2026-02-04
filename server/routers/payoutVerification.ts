import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { sellers, sellerBusiness, sellerPayoutMethods } from '../db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { sendPayoutVerificationEmail } from '../services/emailService';
 
// In-memory OTP storage (consider using Redis for production)
const otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();
const MAX_OTP_ATTEMPTS = 3;
 
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
 
const getEmailForMethod = (method: any, methodType: string): string => {
  if (methodType === 'bank') {
    return method.email || 'your registered email';
  } else if (methodType === 'paypal') {
    return method.email || 'your PayPal email';
  } else if (methodType === 'wise') {
    return method.email || 'your Wise email';
  } else if (methodType === 'stripe') {
    return method.email || 'your Stripe email';
  } else if (methodType === 'flutterwave') {
    return method.email || 'your Flutterwave email';
  } else if (methodType === 'tsara') {
    return method.email || 'your Tsara email';
  } else if (methodType === 'mobile_money') {
    return method.phoneNumber || 'your phone number';
  } else if (methodType === 'other') {
    return method.email || method.phoneNumber || 'your email';
  }
  return 'your email';
};
 
const mapMethodTypeToEmailType = (methodType: string): 'bank' | 'paypal' | 'stripe' | 'wise' | 'mobile_money' | 'flutterwave' | 'tsara' | 'other' => {
  if (methodType === 'bank') {
    return 'bank';
  } else if (methodType === 'paypal') {
    return 'paypal';
  } else if (methodType === 'stripe') {
    return 'stripe';
  } else if (methodType === 'wise') {
    return 'wise';
  } else if (methodType === 'mobile_money') {
    return 'mobile_money';
  } else if (methodType === 'flutterwave') {
    return 'flutterwave';
  } else if (methodType === 'tsara') {
    return 'tsara';
  } else if (methodType === 'other') {
    return 'other';
  }
  // Default to other for unmapped types
  return 'other';
};

const formatMethodDetails = (method: any, methodType: string): string => {
  let details = '';
  
  if (methodType === 'bank') {
    const bankCode = method.bankCode ? ` | Code: ${method.bankCode}` : '';
    const accountType = method.accountType ? ` | Type: ${method.accountType}` : '';
    details = `Bank: ${method.bankName || 'N/A'} | Account: ****${method.accountNumber?.slice(-4) || 'N/A'}${bankCode}${accountType}`;
  } else if (methodType === 'paypal') {
    details = `PayPal: ${method.email || 'N/A'}`;
  } else if (methodType === 'wise') {
    details = `Wise: ${method.email || method.accountNumber || 'N/A'}`;
  } else if (methodType === 'stripe') {
    details = `Stripe: ${method.email || 'N/A'}`;
  } else if (methodType === 'flutterwave') {
    details = `Flutterwave: ${method.email || method.accountNumber || 'N/A'}`;
  } else if (methodType === 'tsara') {
    details = `Tsara: ${method.email || method.accountNumber || 'N/A'}`;
  } else if (methodType === 'mobile_money') {
    details = `Mobile Money: ${method.phoneNumber || 'N/A'} (${method.mobileMoneyProvider || 'N/A'})`;
  } else if (methodType === 'other') {
    const displayValue = method.email || method.accountNumber || method.phoneNumber || 'N/A';
    details = `Other: ${displayValue}`;
  }
  
  return details;
};
 
export const payoutVerificationRouter = createTRPCRouter({
  verifyPayoutMethod: protectedProcedure
    .input(
      z.object({
        methodId: z.string(),
        verificationCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
 
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
 
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });
 
        // Fetch payout method from database
        const methodRow = await db
          .select()
          .from(sellerPayoutMethods)
          .where(eq(sellerPayoutMethods.id, input.methodId));
 
        const method = methodRow[0];
 
        if (!method) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payout method not found',
          });
        }
 
        if (method.sellerId !== seller.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This payout method does not belong to you',
          });
        }
 
        if (method.isVerified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payout method is already verified',
          });
        }
 
        const otpKey = `${seller.id}-${input.methodId}`;
        const storedOtp = otpStore.get(otpKey);
 
        if (!storedOtp) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No verification code found. Please request a new code.',
          });
        }
 
        if (new Date() > storedOtp.expiresAt) {
          otpStore.delete(otpKey);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verification code has expired. Please request a new code.',
          });
        }
 
        // Check attempt limit
        if (storedOtp.attempts >= MAX_OTP_ATTEMPTS) {
          otpStore.delete(otpKey);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Too many failed attempts. Please request a new code.',
          });
        }
 
        if (storedOtp.otp !== input.verificationCode) {
          storedOtp.attempts++;
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid verification code. ${MAX_OTP_ATTEMPTS - storedOtp.attempts} attempt(s) remaining.`,
          });
        }
 
        // Clear OTP and mark as verified
        otpStore.delete(otpKey);
        await db
          .update(sellerPayoutMethods)
          .set({ isVerified: true })
          .where(eq(sellerPayoutMethods.id, input.methodId));
 
        await createPayoutVerificationNotification(seller.id, method);
 
        return {
          success: true,
          message: 'Payout method verified successfully',
          methodType: method.methodType,
          methodId: method.id,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to verify payout method',
        });
      }
    }),
 
  sendVerificationCode: protectedProcedure
    .input(
      z.object({
        methodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
 
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
 
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });
 
        // Fetch seller business details to get brand name
        const sellerBusinessRow = await db
          .select()
          .from(sellerBusiness)
          .where(eq(sellerBusiness.sellerId, seller.id));
 
        const businessDetails = sellerBusinessRow[0];
        const businessName = businessDetails?.brandName || 'Seller';
 
        // Fetch payout method from database - supports all payout method types
        const methodRow = await db
          .select()
          .from(sellerPayoutMethods)
          .where(eq(sellerPayoutMethods.id, input.methodId));
 
        const method = methodRow[0];
 
        if (!method) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payout method not found',
          });
        }
 
        if (method.sellerId !== seller.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This payout method does not belong to you',
          });
        }
 
        if (method.isVerified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payout method is already verified',
          });
        }
 
        const otp = generateOTP();
        const otpKey = `${seller.id}-${input.methodId}`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        otpStore.set(otpKey, { otp, expiresAt, attempts: 0 });
 
        // Format method details for email based on method type
        const detailsText = formatMethodDetails(method, method.methodType);
        const emailForMethod = getEmailForMethod(method, method.methodType);
        const mappedMethodType = mapMethodTypeToEmailType(method.methodType);
 
        // Send verification email
        await sendPayoutVerificationEmail({
          recipientEmail: ctx.user.email || '',
          recipientName: businessName,
          sellerId: seller.id,
          methodId: method.id,
          verificationCode: otp,
          methodType: mappedMethodType,
          accountDetails: detailsText,
        });
        
        await createPayoutVerificationSentNotification(seller.id, method);
 
        return {
          success: true,
          message: 'Verification code sent to your email',
          methodType: method.methodType,
          emailSentTo: emailForMethod,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to send verification code',
        });
      }
    }),
 
  getVerificationStatus: protectedProcedure
    .input(
      z.object({
        methodId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
 
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
 
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });
 
        const methodRow = await db
          .select()
          .from(sellerPayoutMethods)
          .where(eq(sellerPayoutMethods.id, input.methodId));
 
        const method = methodRow[0];
 
        if (!method) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payout method not found',
          });
        }
 
        if (method.sellerId !== seller.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This payout method does not belong to you',
          });
        }
 
        return {
          methodId: method.id,
          type: method.methodType,
          isVerified: method.isVerified,
          updatedAt: method.updatedAt,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to get verification status',
        });
      }
    }),
});
 
async function createPayoutVerificationNotification(sellerId: string, method: any) {
  try {
    // TODO: Create notification in notifications table
    console.log(`[PayoutVerification] Method verified: ${method.id} (${method.methodType})`);
  } catch (err) {
    console.error('Failed to create verification notification:', err);
  }
}
 
async function createPayoutVerificationSentNotification(sellerId: string, method: any) {
  try {
    // TODO: Create notification in notifications table
    console.log(`[PayoutVerification] Code sent for method: ${method.id} (${method.methodType})`);
  } catch (err) {
    console.error('Failed to create verification sent notification:', err);
  }
}