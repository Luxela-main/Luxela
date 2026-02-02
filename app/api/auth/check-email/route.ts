export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/client";
import { buyerAccountDetails, sellerBusiness } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await createClient();
    const {
      data: { users },
      error: authError,
    } = await supabase.auth.admin.listUsers();

    if (!authError && users) {
      const existingAuthUser = users.find(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );

      if (existingAuthUser) {
        const role = existingAuthUser.user_metadata?.role as
          | "buyer"
          | "seller"
          | undefined;

        return NextResponse.json({
          exists: true,
          role: role || "unknown",
          message: `This email is already registered as a ${role || "user"}. Please sign in instead.`,
        });
      }
    }

    const buyerWithEmail = await db.query.buyerAccountDetails.findFirst({
      where: eq(buyerAccountDetails.email, normalizedEmail),
    });

    if (buyerWithEmail) {
      return NextResponse.json({
        exists: true,
        role: "buyer",
        message: "This email is already registered as a buyer. Please sign in instead.",
      });
    }

    const sellerWithEmail = await db.query.sellerBusiness.findFirst({
      where: eq(sellerBusiness.officialEmail, normalizedEmail),
    });

    if (sellerWithEmail) {
      return NextResponse.json({
        exists: true,
        role: "seller",
        message: "This email is already registered as a seller. Please sign in instead.",
      });
    }

    return NextResponse.json({
      exists: false,
      message: "Email is available for registration",
    });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check email",
        exists: null,
      },
      { status: 500 }
    );
  }
}