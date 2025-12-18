"use server";

import { createClient } from "@/utils/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: "buyer" | "seller";
  avatarUrl: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error fetching current user:", error);
      return null;
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      fullName: user.user_metadata?.full_name || "Unknown User",
      role: (user.user_metadata?.role as "buyer" | "seller") || "buyer",
      avatarUrl: user.user_metadata?.avatar_url || "/placeholder.svg",
    };
  } catch (err) {
    console.error("Unexpected error in getCurrentUser:", err);
    return null;
  }
}