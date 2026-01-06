import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create();

// PUBLIC PROCEDURE
export const publicProcedure = t.procedure;

// PROTECTED PROCEDURE
// -------------------------------
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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

// ROUTER EXPORT
export const createTRPCRouter = t.router;