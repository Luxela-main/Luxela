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

    const { data: admins, error: adminCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    const hasExistingAdmin = admins && admins.length > 0;

    if (hasExistingAdmin) {
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      
      if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
        return {
          success: false,
          error: "Invalid admin password. Contact your system administrator.",
        };
      }

      if (currentUser.user_metadata?.role !== "admin") {
        return {
          success: false,
          error: "Only existing admins can grant admin role to others",
        };
      }
    }

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

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    if (currentUser.user_metadata?.role !== "admin") {
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