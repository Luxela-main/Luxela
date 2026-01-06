export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/client";
import { buyers, sellers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
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
    const role = user.user_metadata?.role as "buyer" | "seller" | undefined;

    // If no role is set yet, do NOT try to find a profile
    if (!role) {
      return NextResponse.json({
        role: null,
        exists: false,
      });
    }

    // Query based on the assigned role only
    if (role === "buyer") {
      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      return NextResponse.json({
        role: "buyer",
        exists: !!buyer,
      });
    }

    if (role === "seller") {
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      return NextResponse.json({
        role: "seller",
        exists: !!seller,
      });
    }

    // Fallback (should never happen)
    return NextResponse.json({
      role: null,
      exists: false,
    });
  } catch (error) {
    console.error("Profile check error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}