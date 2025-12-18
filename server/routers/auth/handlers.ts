import { Request, Response } from "express";
import { db } from "../../db/client";
import { users } from "@/server/db/schema";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "@/server/utils/admin";

const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* --------------------------------- SIGN UP -------------------------------- */

export async function signupHandler(req: Request, res: Response) {
  const { email, password, role } = req.body as {
    email?: string;
    password?: string;
    role?: "buyer" | "seller";
  };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { data, error } = await supabaseAuth.auth.signUp({ email, password });
    const authUser = data?.user;

    if (error || !authUser) {
      return res
        .status(400)
        .json({ message: error?.message ?? "Signup failed" });
    }

    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email,
        role: role ?? "buyer",
      });

    if (insertError && insertError.code !== "23505") {
      console.error("User insert failed:", insertError);
      return res.status(500).json({ message: "User provisioning failed" });
    }

    return res.status(201).json({
      success: true,
      message: "User created. Check your email to confirm your account.",
      userId: authUser.id,
    });
  } catch (err) {
    console.error("Signup handler error:", err);
    return res.status(500).json({ message: "Server error signing up user" });
  }
}

/* --------------------------------- SIGN IN -------------------------------- */

export async function signinHandler(req: Request, res: Response) {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    const authUser = data?.user;

    if (error || !authUser) {
      return res
        .status(401)
        .json({ message: error?.message ?? "Invalid credentials" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: "User record not found" });
    }

    const { password: _, ...userSafe } = user;

    return res.status(200).json({
      success: true,
      user: userSafe,
      session: data.session ?? null,
    });
  } catch (err) {
    console.error("Signin handler error:", err);
    return res.status(500).json({ message: "Server error signing in" });
  }
}