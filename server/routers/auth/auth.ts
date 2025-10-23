import { createTRPCRouter, publicProcedure } from "../../trpc";

export const authRouter = createTRPCRouter({
  getAdminData: publicProcedure.query(() => ({
    message: "Admin not enabled in this context",
  })),

  getSessionStatus: publicProcedure.query(({ ctx }) => ({
    isAuthenticated: !!ctx.user,
    user: ctx.user || null,
    session: ctx.session || null,
  })),

  getAdminStatus: publicProcedure.query(({ ctx }) => {
    if (!ctx.user || ctx.user.role !== "ADMIN") {
      return { isAdmin: false };
    }
    return { isAdmin: true, user: ctx.user };
  }),
});
