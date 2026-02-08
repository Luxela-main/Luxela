"use server";

import { createClient as createServerClient, createAdminClient } from "@/utils/supabase/server";

export async function setAdminRole(email: string, adminPassword: string) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if there are existing admins in the system
    const { data: adminUsers, error: adminCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    const hasExistingAdmin = adminUsers && adminUsers.length > 0;

    if (hasExistingAdmin) {
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      
      if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
        return {
          success: false,
          error: "Invalid admin password. Contact your system administrator.",
        };
      }

      if (currentUser.user_metadata?.admin !== true) {
        return {
          success: false,
          error: "Only existing admins can grant admin role to others",
        };
      }
    }

    // Update user metadata with admin flag
    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: { admin: true },
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Get a fresh session to ensure JWT is updated
    const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError) {
      console.warn("Session refresh warning:", sessionError.message);
      // Don't fail - the metadata was updated, session will refresh on next request
    }

    // Verify the update was successful by fetching the updated user
    const { data: verifyUser, error: verifyError } = await supabase.auth.getUser();
    
    if (verifyError) {
      console.error("Error verifying admin role:", verifyError);
    }

    return {
      success: true,
      message: "Admin role has been set successfully",
      isAdmin: verifyUser?.user?.user_metadata?.admin === true,
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

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    if (currentUser.user_metadata?.admin !== true) {
      return {
        success: false,
        error: "Only admins can grant admin role to others",
      };
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Invalid admin password",
      };
    }

    const adminClient = createAdminClient();
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

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

    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
      user_metadata: { admin: true },
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

    const isAdmin = user.user_metadata?.admin === true;

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