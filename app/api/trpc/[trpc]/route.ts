import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc/context";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";

const handler = async (req: NextRequest) => {
  // Implement request timeout to fail fast (280s to leave buffer before Vercel's 300s limit)
  const timeoutId = setTimeout(() => {
    console.error('[tRPC] Request timeout: exceeded 280 seconds');
  }, 280000);

  try {
    // Enhanced logging to diagnose method issues
    const url = new URL(req.url);
    const procedurePath = url.pathname.replace('/api/trpc/', '');
    
    console.log('[tRPC] Incoming request:', {
      method: req.method,
      url: req.url,
      pathname: req.nextUrl.pathname,
      procedurePath: procedurePath || '(batch)',
      searchParams: req.nextUrl.search,
      headers: {
        'content-type': req.headers.get('content-type'),
        'authorization': req.headers.get('authorization') ? 'present' : 'missing',
      },
    });

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      router: appRouter,
      req,
      createContext: async () => {
        return createTRPCContext({ req });
      },
    });

    clearTimeout(timeoutId);
    console.log('[tRPC] Response status:', response.status);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[tRPC] Handler error:', error instanceof Error ? error.message : error);
    
    // Return proper JSON error response
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
// GET handler removed - tRPC doesn't support GET requests for security reasons
// All tRPC requests must use POST method
// export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;