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

    // ALWAYS verify admin password before granting admin role
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Admin password not configured in system. Contact your administrator.",
      };
    }

    if (adminPassword !== ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Invalid admin password. Please check and try again.",
      };
    }

    // Update Supabase Auth user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        admin: true, 
        role: 'admin',
        adminSignupPending: false,
      },
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    console.log('[setAdminRole] Auth metadata updated for user:', currentUser.id);

    // Create or update user record in database with admin role
    const { error: dbError } = await supabase
      .from('users')
      .upsert(
        {
          id: currentUser.id,
          email: currentUser.email,
          role: 'admin',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (dbError) {
      console.warn('[setAdminRole] Warning: Failed to update users table:', dbError.message);
      // Don't fail the entire operation if database update fails
      // The auth metadata is what matters
    } else {
      console.log('[setAdminRole] User record updated in database with admin role');
    }
    
    // Refresh the session to update the JWT with the new admin metadata
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('[setAdminRole] Warning: Failed to refresh session:', refreshError.message);
    } else {
      console.log('[setAdminRole] ✅ Session refreshed with new admin metadata');
    }

    return {
      success: true,
      message: "Admin role has been set successfully.",
      isAdmin: true,
    };
  } catch (error: any) {
    console.error('[setAdminRole] Unexpected error:', error);
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
      user_metadata: { admin: true, role: 'admin' },
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }
    
    // Also update the database role for consistency
    const { error: dbError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', targetUser.id);
      
    if (dbError) {
      console.warn('Warning: Failed to update target user role in database:', dbError.message);
    }

    return {
      success: true,
      message: `Admin role granted to ${targetEmail}. They will see the admin dashboard after their next login or refresh.`,
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

    let isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!userError && userData?.role === 'admin') {
        isAdmin = true;
      }
    }

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

export async function validateAdminPassword(adminPassword: string) {
  try {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Admin password not configured",
      };
    }

    if (adminPassword !== ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Invalid admin password",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to validate admin password",
    };
  }
}