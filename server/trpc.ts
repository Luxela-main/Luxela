import { initTRPC, TRPCError } from '@trpc/server';
import { verifyAccessToken, getBearerToken } from './routers/auth/jwt';

export type Session = { id: string; expiresAt: Date } | null;
export type AuthUser = {
  id: string;
  email?: string;
  role?: 'buyer' | 'seller' | 'ADMIN';
  name?: string;
} | null;

export type Context = {
  req?: any;
  res?: any;
  user: AuthUser;
  session: Session;
};

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const adminOnly = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next();
});

export const adminProcedure = publicProcedure.use(adminOnly);

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  return next({ ctx });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
