import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc/context";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const handler = async (req: NextRequest) => {
  try {
    const pathname = req.nextUrl.pathname;
    const searchParams = req.nextUrl.search;
    
    console.log('[tRPC Root] Incoming request:', {
      method: req.method,
      pathname,
      searchParams,
      url: req.url,
    });

    // Route all requests through tRPC
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      router: appRouter,
      req,
      createContext: async () => {
        return createTRPCContext({ req });
      },
    });

    console.log('[tRPC Root] Response status:', response.status);
    return response;
  } catch (error) {
    console.error('[tRPC Root] Handler error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};

export const POST = handler;
export const GET = handler;