export const runtime = "nodejs";
export const maxDuration = 60; // Max 60s timeout for serverless functions

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/app/api/lib/db";
import { buyers, sellers, buyerAccountDetails, sellerBusiness } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Timeout helper with retry logic
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Retry helper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTimeout = lastError.message.includes("timeout");
      const isLastAttempt = attempt === maxAttempts;
      
      if (isLastAttempt) {
        throw lastError;
      }
      
      // Only retry on timeouts
      if (!isTimeout) {
        throw lastError;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[Profile Check] Query attempt ${attempt} failed, retrying in ${delayMs}ms:
`,
        lastError.message
      );
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError || new Error("Unknown error");
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthenticated",
          role: null,
          exists: false,
          profileComplete: false,
        },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Get role from Supabase user metadata
    const rawRole = user.user_metadata?.role;
    const role = (typeof rawRole === 'string' ? rawRole.toLowerCase().trim() : rawRole) as "buyer" | "seller" | undefined;

    console.log("[Profile Check] Raw role:", rawRole, "Processed role:", role, "User ID:", userId);

    // If no role is set, user hasn't completed role selection
    if (!role) {
      console.log("[Profile Check] No role found for user", userId);
      return NextResponse.json({
        role: null,
        exists: false,
        profileComplete: false,
        message: "Role not selected",
      });
    }

    // Query database for buyer profile with timeout and retry
    if (role === "buyer") {
      try {
        const buyer = await withRetry(
          () => withTimeout(
            db.query.buyers.findFirst({
              where: eq(buyers.userId, userId),
            }),
            30000 // 30s timeout instead of 10s
          ),
          2 // Max 2 attempts
        );

        if (!buyer) {
          return NextResponse.json({
            role: "buyer",
            exists: false,
            profileComplete: false,
            userId,
            message: "Buyer profile not found",
          });
        }

        // Check if buyer account details exist
        const buyerDetails = await withRetry(
          () => withTimeout(
            db.query.buyerAccountDetails.findFirst({
              where: eq(buyerAccountDetails.buyerId, buyer.id),
            }),
            30000 // 30s timeout instead of 10s
          ),
          2 // Max 2 attempts
        );

        const profileComplete = !!buyerDetails;

        return NextResponse.json({
          role: "buyer",
          exists: true,
          profileComplete,
          buyerId: buyer.id,
          email: buyerDetails?.email || userEmail,
          userId,
        });
      } catch (queryError: any) {
        const errorMsg = queryError.message || String(queryError);
        console.error("[Profile Check] Buyer query error:", errorMsg);
        
        // Return 503 for timeouts or connection issues
        const status = errorMsg.includes("timeout") || errorMsg.includes("ECONNREFUSED") ? 503 : 500;
        
        return NextResponse.json({
          role: "buyer",
          exists: false,
          profileComplete: false,
          userId,
          message: "Could not verify buyer profile (database temporarily unavailable)",
          error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
        }, { status });
      }
    }

    // Query database for seller profile with timeout and retry
    if (role === "seller") {
      try {
        const seller = await withRetry(
          () => withTimeout(
            db.query.sellers.findFirst({
              where: eq(sellers.userId, userId),
            }),
            30000 // 30s timeout instead of 10s
          ),
          2 // Max 2 attempts
        );

        if (!seller) {
          return NextResponse.json({
            role: "seller",
            exists: false,
            profileComplete: false,
            userId,
            message: "Seller profile not found",
          });
        }

        // Check if seller business details exist
        const sellerDetails = await withRetry(
          () => withTimeout(
            db.query.sellerBusiness.findFirst({
              where: eq(sellerBusiness.sellerId, seller.id),
            }),
            30000 // 30s timeout instead of 10s
          ),
          2 // Max 2 attempts
        );

        const profileComplete = !!sellerDetails;

        return NextResponse.json({
          role: "seller",
          exists: true,
          profileComplete,
          sellerId: seller.id,
          storeEmail: sellerDetails?.officialEmail || userEmail,
          userId,
        });
      } catch (queryError: any) {
        const errorMsg = queryError.message || String(queryError);
        console.error("[Profile Check] Seller query error:", errorMsg);
        
        // Return 503 for timeouts or connection issues
        const status = errorMsg.includes("timeout") || errorMsg.includes("ECONNREFUSED") ? 503 : 500;
        
        return NextResponse.json({
          role: "seller",
          exists: false,
          profileComplete: false,
          userId,
          message: "Could not verify seller profile (database temporarily unavailable)",
          error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
        }, { status });
      }
    }

    // Fallback (should never reach here)
    console.error("[Profile Check] Invalid role fallback. Raw role:", rawRole, "Processed:", role);
    return NextResponse.json(
      {
        error: "Invalid role",
        role: role,
        rawRole: rawRole,
        exists: false,
        profileComplete: false,
        debug: `Role '${rawRole}' could not be normalized to 'buyer' or 'seller'`,
      },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Profile Check] Server error:", errorMessage, error);
    return NextResponse.json(
      {
        error: "Server error",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        role: null,
        exists: false,
        profileComplete: false,
      },
      { status: 500 }
    );
  }
}