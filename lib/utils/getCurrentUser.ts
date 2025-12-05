"use server";

import { createClient } from "@/utils/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || "Unknown User",
    role: user.user_metadata?.role || "buyer",
    avatarUrl: user.user_metadata?.avatar_url || "/placeholder.svg",
  };
}
