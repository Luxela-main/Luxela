import { initTRPC } from '@trpc/server';
import type { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create();

// Public procedure (anyone can access)
export const publicProcedure = t.procedure;

// Protected procedure (requires user)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized: You must be signed in to access this route.');
  }
  return next({
    ctx: {
      user: ctx.user,
      supabase: ctx.supabase,
    },
  });
});

// Create a router
export const createTRPCRouter = t.router;
