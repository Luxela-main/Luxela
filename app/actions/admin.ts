"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";

export async function setAdminRole(email: string, adminPassword: string) {
  try {
    // Create a service role client to update user metadata
    const supabase = await createServerClient();

    // Get the current user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if there are any existing admins in the system
    const { data: admins, error: adminCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    const hasExistingAdmin = admins && admins.length > 0;

    // If there are existing admins, require admin password
    if (hasExistingAdmin) {
      // Admin password should be set in environment variables
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      
      if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
        return {
          success: false,
          error: "Invalid admin password. Contact your system administrator.",
        };
      }

      // Also verify that the user requesting is already an admin
      if (currentUser.user_metadata?.role !== "admin") {
        return {
          success: false,
          error: "Only existing admins can grant admin role to others",
        };
      }
    }

    // Update the current user's metadata to make them admin
    const { error: updateError } = await supabase.auth.updateUser({
      data: { role: "admin" },
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      message: "Admin role has been set successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to set admin role",
    };
  }
}

export async function grantAdminRole(targetEmail: string, adminPassword: string) {
  try {
    const supabase = await createServerClient();

    // Get the current user (who is granting the role)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify the current user is an admin
    if (currentUser.user_metadata?.role !== "admin") {
      return {
        success: false,
        error: "Only admins can grant admin role to others",
      };
    }

    // Verify admin password
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Invalid admin password",
      };
    }

    // Get the target user by email using admin API
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return {
        success: false,
        error: "Failed to find user. Make sure the email exists in the system.",
      };
    }

    const targetUser = users?.find((u: any) => u.email === targetEmail);

    if (!targetUser) {
      return {
        success: false,
        error: `User with email ${targetEmail} not found. They must sign up first.`,
      };
    }

    // Update the target user's metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
      user_metadata: { role: "admin" },
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      message: `Admin role granted to ${targetEmail}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to grant admin role",
    };
  }
}

export async function checkAdminStatus() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, isAdmin: false, error: "Not authenticated" };
    }

    const isAdmin = user.user_metadata?.role === "admin";

    return {
      success: true,
      isAdmin,
      userEmail: user.email,
      role: user.user_metadata?.role,
    };
  } catch (error: any) {
    return {
      success: false,
      isAdmin: false,
      error: error?.message || "Failed to check admin status",
    };
  }
}