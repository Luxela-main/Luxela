import { appRouter } from "@/server/index";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from "@/server/trpc/context";

// Next.js Route Handler for tRPC
export const runtime = 'nodejs';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
  });

export { handler as GET, handler as POST };
