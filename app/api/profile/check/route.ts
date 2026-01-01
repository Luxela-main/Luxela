export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/client";
import { buyers, sellers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();

    // Securely validate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check buyer profile
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, userId),
    });

    if (buyer) {
      return NextResponse.json({
        role: "buyer",
        profileExists: true,
      });
    }

    // Check seller profile
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, userId),
    });

    if (seller) {
      return NextResponse.json({
        role: "seller",
        profileExists: true,
      });
    }

    // Default — no profile yet
    return NextResponse.json({
      role: user.user_metadata.role || null,
      profileExists: false,
    });
  } catch (error) {
    console.error("Profile check error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}