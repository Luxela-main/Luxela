import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createTRPCContext } from "./context";

const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

export const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => {
      return { message: `Hello ${input?.name ?? "world"}!` };
    }),
});

export type AppRouter = typeof appRouter;