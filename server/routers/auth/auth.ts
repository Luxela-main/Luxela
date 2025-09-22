import { createTRPCRouter, publicProcedure } from '../../trpc';
import { z } from 'zod';
import { findOrCreateUserByEmail, createOtp as createOtpRow, verifyOtp as verifyOtpCode } from './services';
import { signAccessToken } from './jwt';
import { sendOtp } from '../../email';

export const authRouter = createTRPCRouter({
  getAdminData: publicProcedure.query(() => ({ message: 'Admin not enabled in this context' })),

  getSessionStatus: publicProcedure.query(({ ctx }) => ({
    isAuthenticated: !!ctx.user,
    user: ctx.user || null,
    session: ctx.session || null,
  })),

  requestOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await findOrCreateUserByEmail(input.email);
      const { code } = await createOtpRow(input.email);
      await sendOtp(input.email, code);
      return { success: true };
    }),

  verifyOtp: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string().min(4).max(6) }))
    .mutation(async ({ input }) => {
      await verifyOtpCode(input.email, input.code);
      const token = signAccessToken({ sub: input.email, email: input.email });
      return { success: true, token };
    }),
});
