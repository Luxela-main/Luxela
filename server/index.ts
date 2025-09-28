import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth/auth';
import { sellerRouter } from './routers/seller';
import { listingRouter } from './routers/listing';
import { salesRouter } from './routers/sales';
import { cartRouter } from './routers/cart';
import { getBearerToken, verifyAccessToken } from './routers/auth/jwt';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  seller: sellerRouter,
  listing: listingRouter,
  sales: salesRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;

createHTTPServer({
  router: appRouter,
  createContext: ({ req, res }) => {
    const authHeader = req.headers?.authorization as string | undefined;
    const token = getBearerToken(authHeader);
    let user = null;
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        user = { id: payload.sub, email: payload.email, role: payload.role };
      } catch {}
    }
    const session = null;
    return { req, res, user, session };
  },
}).listen(4000);

console.log('tRPC server listening on http://localhost:3000');
