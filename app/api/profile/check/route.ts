export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/client";
import { buyers, sellers, buyerAccountDetails, sellerBusiness } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from session (browser-agnostic, uses secure tokens)
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

    // Get role from Supabase user metadata (stored server-side)
    const role = user.user_metadata?.role as "buyer" | "seller" | undefined;

    // If no role is set, user hasn't completed role selection
    if (!role) {
      return NextResponse.json({
        role: null,
        exists: false,
        profileComplete: false,
        message: "Role not selected",
      });
    }

    // Query database for buyer profile
    if (role === "buyer") {
      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        return NextResponse.json({
          role: "buyer",
          exists: false,
          profileComplete: false,
          userId,
          message: "Buyer profile not found",
        });
      }

      // Check if buyer account details exist (profile complete)
      const buyerDetails = await db.query.buyerAccountDetails.findFirst({
        where: eq(buyerAccountDetails.buyerId, buyer.id),
      });

      // Profile is complete if the record exists (all required fields are enforced at DB level)
      const profileComplete = !!buyerDetails;

      return NextResponse.json({
        role: "buyer",
        exists: true,
        profileComplete,
        buyerId: buyer.id,
        email: buyerDetails?.email || userEmail,
        userId,
      });
    }

    // Query database for seller profile
    if (role === "seller") {
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        return NextResponse.json({
          role: "seller",
          exists: false,
          profileComplete: false,
          userId,
          message: "Seller profile not found",
        });
      }

      // Check if seller business details exist (profile complete)
      const sellerDetails = await db.query.sellerBusiness.findFirst({
        where: eq(sellerBusiness.sellerId, seller.id),
      });

      // Profile is complete if the record exists (all required fields are enforced at DB level)
      const profileComplete = !!sellerDetails;

      return NextResponse.json({
        role: "seller",
        exists: true,
        profileComplete,
        sellerId: seller.id,
        storeEmail: sellerDetails?.officialEmail || userEmail,
        userId,
      });
    }

    // Fallback (should never reach here)
    return NextResponse.json(
      {
        error: "Invalid role",
        role: null,
        exists: false,
        profileComplete: false,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Profile check error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        role: null,
        exists: false,
        profileComplete: false,
      },
      { status: 500 }
    );
  }
}