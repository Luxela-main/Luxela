import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/app/api/lib/trpc/router";
import { createTRPCContext } from "@/app/api/lib/trpc/context";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const contextData = await createTRPCContext({ req });
  
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => contextData,
  });
}

export async function POST(req: Request) {
  const contextData = await createTRPCContext({ req });
  
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => contextData,
  });
}