import { Request, Response } from "express";
import { db } from "../../db/client";
import { users } from '@/server/db/schema';
import bcrypt from "bcryptjs";
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm';

export async function signupHandler(req: Request, res: Response) {
  const { email, password, role } = req.body;

  try {
    // Check if user already exists
    const existing = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) return res.status(400).json({ message: "User already registered" });

    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ id: nanoid(), email, password: hash, role });

    return res.status(200).json({ message: "User created. Check your email to confirm." });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Database error saving new user" });
  }
}

export async function signinHandler(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];
    if (!user) return res.status(400).json({ message: "Invalid login credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid login credentials" });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error signing in" });
  }
}