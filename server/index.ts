import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
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

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Add tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

// Add REST API routes for compatibility
app.get('/sales', (req, res) => {
  res.json([]);
});

app.get('/listings/me', (req, res) => {
  res.json([]);
});

app.get('/seller/profile', (req, res) => {
  res.json({});
});

app.get('/notifications', (req, res) => {
  res.json([]);
});

app.listen(5000, () => {
  console.log('Server listening on http://localhost:5000');
});


