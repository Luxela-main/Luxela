import { createClient } from "../../utils/supabase/client";

export async function verifyOtp(email: string, otp: string) {
  const supabase = createClient();

  const isPasswordReset = sessionStorage.getItem("isPasswordReset") == "true";

  const { data, error } = await supabase.auth.verifyOtp({
    token: otp,
    email,
    type: isPasswordReset ? "recovery" : "signup",
  });

  if (error) throw error;

  return data;
}

export async function signin(email: string, password: string) {

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return { data, error };
}

// export async function signin(email: string, password: string) {
//   try {
//     const res = await fetch(
//       `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signin`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//         credentials: "include"
//       }
//     );

//     const json = await res.json();

//     if (!res.ok) {
//       return {
//         data: null,
//         error: new Error(json?.message || "Invalid email or password"),
//       };
//     }

//     return { data: json, error: null };
//   } catch (err) {
//     return {
//       data: null,
//       error: err instanceof Error ? err : new Error("Unexpected error"),
//     };
//   }
// }

export async function updatePassword(password: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
}
