"use server";

import { createClient } from "@/utils/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: "buyer" | "seller";
  avatarUrl: string;
};

/**
 * Fetch current user with option to force refresh from Supabase
 * @param forceRefresh - Force refresh user data from Supabase (ignores cache)
 */
export async function getCurrentUser(forceRefresh: boolean = false): Promise<CurrentUser | null> {
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

    let userToUse = user;
    // Refresh user session if forceRefresh is true to ensure metadata is up-to-date
    if (forceRefresh) {
      try {
        const { data, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && data?.user) {
          // Use the refreshed user data with latest metadata
          userToUse = data.user;
        } else if (refreshErr) {
          console.warn("Could not refresh session:", refreshErr);
          // Continue with current user data
        }
      } catch (refreshErr) {
        console.warn("Could not refresh session:", refreshErr);
        // Continue anyway, use current user data
      }
    }

    // Use avatar_url from user metadata (updated during seller setup)
    // Fallback to default sparkles icon if no avatar is set
    const avatarUrl = userToUse.user_metadata?.avatar_url || "/images/seller/sparkles.svg";

    // Return the current user object with properly extracted fields
    const currentUser: CurrentUser = {
      id: userToUse.id,
      email: userToUse.email ?? null,
      fullName: userToUse.user_metadata?.full_name || userToUse.email || "User",
      role: (userToUse.user_metadata?.role as "buyer" | "seller") || "buyer",
      avatarUrl: avatarUrl,
    };

    return currentUser;
  } catch (err) {
    console.error("Unexpected error in getCurrentUser:", err);
    return null;
  }
}