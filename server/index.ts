import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth/auth';
import { sellerRouter } from './routers/seller';
import { listingRouter } from './routers/listing';
import { salesRouter } from './routers/sales';
import { cartRouter } from './routers/cart';
import { notificationRouter } from './routers/notification';
import { reviewRouter } from './routers/review';
import { paymentRouter } from './routers/payment';
import {buyerRouter} from './routers/buyer';
console.log('Buyer router imported:', buyerRouter); 
console.log('Buyer router keys:', Object.keys(buyerRouter._def.procedures)); 

import { createTRPCContext } from './trpc/context'; 

export const appRouter = createTRPCRouter({
  auth: authRouter,
  seller: sellerRouter,
  listing: listingRouter,
  sales: salesRouter,
  cart: cartRouter,
  notification: notificationRouter,
  review :reviewRouter,
  payment :paymentRouter,
  buyer: buyerRouter,

});

export type AppRouter = typeof appRouter;

createHTTPServer({
  router: appRouter,
  createContext: createTRPCContext,
}).listen(5000);

console.log('tRPC server listening on http://localhost:5000');


