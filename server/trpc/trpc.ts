import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create();

// PUBLIC PROCEDURE
export const publicProcedure = t.procedure;

// PROTECTED PROCEDURE
export const protectedProcedure = t.procedure.use(async (opts: any) => {
  const ctx = opts.ctx as TRPCContext;
  const next = opts.next as (opts: { ctx: TRPCContext }) => Promise<any>;
  
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this route.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      supabase: ctx.supabase,
    },
  });
});

// ADMIN PROCEDURE
// --------------------------------
export const adminProcedure = t.procedure.use(async (opts: any) => {
  const ctx = opts.ctx as TRPCContext;
  const next = opts.next as (opts: { ctx: TRPCContext }) => Promise<any>;
  
  if (!ctx.user || !ctx.user.admin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this route.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      supabase: ctx.supabase,
    },
  });
});

// ROUTER EXPORT
export const createTRPCRouter = t.router;
export const router = t.router;