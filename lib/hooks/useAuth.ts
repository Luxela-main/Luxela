import { createClient } from "@/utils/supabase/client";

interface AuthResult {
  success: boolean;
  message?: string;
}

/**
 * All Supabase Auth hooks combined:
 * - signup
 * - signin
 * - resend verification email
 * - signout
 */
export const useAuth = () => {
  const supabase = createClient();

  /**
   * Signup new user
   */
  const signup = async (email: string, password: string, role: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw new Error(error.message);
    return { success: true, message: "Signup successful! Please verify your email." };
  };

  /**
   * Sign in user
   */
  const signin = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Check if user verified
    if (!data.user?.email_confirmed_at) {
      throw new Error("Email not verified. Please check your inbox.");
    }

    return { success: true, message: "Signin successful!" };
  };

  /**
   * Resend verification email
   */
  const resendVerification = async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) throw new Error(error.message);
    return { success: true, message: "Verification email resent successfully!" };
  };

  /**
   * Sign out user
   */
  const signout = async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { success: true, message: "Signed out successfully!" };
  };

  return { signup, signin, resendVerification, signout };
};
