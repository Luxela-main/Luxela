import { db } from '../../db';
import { users, emailOtps } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { InferModel } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { addMinutes } from 'date-fns';

export type User = InferModel<typeof users>;

export async function findOrCreateUserByEmail(email: string): Promise<User> {
  if (!email) throw new Error('Email is required');
  const found = await db.select().from(users).where(eq(users.email, email));
  let createdUser = found[0] as User | undefined;
  if (!createdUser) {
    const now = new Date();
    const inserted = await db
      .insert(users)
      .values({ id: randomUUID(), email, createdAt: now, updatedAt: now })
      .returning();
    createdUser = inserted[0] as User | undefined;
  }
  if (!createdUser) throw new Error('Failed to find or create user');
  return createdUser;
}

export async function generateHashedOtp(otp: string): Promise<string> {
  if (!otp) throw new Error('OTP is required');
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);
  return hashedOtp;
}

export async function compareHashedOtp(
  otp: string,
  hashedOtp: string,
): Promise<boolean> {
  if (!otp || !hashedOtp) return false;
  return await bcrypt.compare(otp, hashedOtp);
}

export async function createOtp(email: string, ttlMinutes = 10) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await generateHashedOtp(code);
  const [row] = await db
    .insert(emailOtps)
    .values({ id: randomUUID(), email, codeHash, expiresAt: addMinutes(new Date(), ttlMinutes), consumed: false })
    .returning();
  return { code, row };
}

export async function verifyOtp(email: string, code: string) {
  const rows = await db
    .select()
    .from(emailOtps)
    .where(and(eq(emailOtps.email, email), eq(emailOtps.consumed, false)));
  const latest = rows.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())[0];
  if (!latest) throw new Error('No OTP found');
  if (new Date(latest.expiresAt as any) < new Date()) throw new Error('OTP expired');
  const ok = await compareHashedOtp(code, latest.codeHash);
  if (!ok) throw new Error('Invalid OTP');
  await db.update(emailOtps).set({ consumed: true }).where(eq(emailOtps.id, latest.id));
  return true;
}
