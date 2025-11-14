import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createTRPCRouter, publicProcedure } from "../../trpc/trpc";
import { prisma } from "../../lib/prisma";
import { sendVerificationEmail } from "../../utils/email";
import crypto from "crypto";

// Helper: generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "luxela_secret", {
    expiresIn: "7d",
  });
};

export const authRouter = createTRPCRouter({
  // --- SIGN UP ---
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["buyer", "seller"]),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password, role } = input;

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error("User already registered");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          verified: false,
        },
      });

      // Send verification email
      try {
       const verificationToken = crypto.randomUUID?.() ?? crypto.randomBytes(16).toString("hex");
        await sendVerificationEmail(email, verificationToken);
      } catch (err) {
        console.warn("Email sending failed (skipped in dev)");
      }

      return {
        message: "User created successfully. Please verify your email.",
        user: { id: user.id, email: user.email, role: user.role },
      };
    }),

  // --- SIGN IN ---
  signin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid login credentials");

      const valid = await bcrypt.compare(password, user.password || "");
      if (!valid) throw new Error("Invalid login credentials");

      if (!user.verified)
        throw new Error("Email not confirmed. Please check your inbox.");

      const token = generateToken(user.id);

      return {
        message: "Signin successful",
        token,
        user: { id: user.id, email: user.email, role: user.role },
      };
    }),

  // --- GOOGLE SIGNIN / SIGNUP ---
  googleSignin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        avatar: z.string().optional(),
        googleId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, name, avatar, googleId } = input;

      // Check if user exists
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatar,
            googleId,
            verified: true,
            role: "buyer",
          },
        });
      }

      const token = generateToken(user.id);

      return {
        message: "Google authentication successful",
        token,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }),

  // --- RESEND VERIFICATION EMAIL ---
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("User not found");

      if (user.verified) {
        return { message: "User already verified." };
      }
      const verificationToken = crypto.randomUUID?.() ?? crypto.randomBytes(16).toString("hex");
      await sendVerificationEmail(email, verificationToken);

      return { message: "Verification email resent successfully." };
    }),

  // --- SIGNOUT ---
  signout: publicProcedure.mutation(async () => {
    return { message: "Signed out successfully." };
  }),

  // --- SESSION STATUS ---
  getSessionStatus: publicProcedure.query(({ ctx }) => ({
    isAuthenticated: !!ctx.user,
    user: ctx.user || null,
    session: ctx.session || null,
  })),

  // --- ADMIN STATUS ---
  getAdminStatus: publicProcedure.query(({ ctx }) => {
    if (!ctx.user || ctx.user.role !== "ADMIN") {
      return { isAdmin: false };
    }
    return { isAdmin: true, user: ctx.user };
  }),

  // --- ADMIN PLACEHOLDER ---
  getAdminData: publicProcedure.query(() => ({
    message: "Admin not enabled in this context",
  })),
});