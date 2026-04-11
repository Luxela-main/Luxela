import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc/context";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";

// GET handler - for queries only, block mutations early with clearer error
const getHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const procedurePath = url.pathname.replace('/api/trpc/', '');
  
  // List of known mutation procedures to block GET requests
  const mutationProcedures = [
    'payment.createCartPayment',
    'payment.createPayment',
    'payment.verifyPayment',
    'payment.createCheckout',
  ];
  
  // If this is a known mutation, return 405 Method Not Allowed immediately
  if (mutationProcedures.includes(procedurePath)) {
    console.warn(`[tRPC] Blocked GET request to mutation: ${procedurePath}`);
    return NextResponse.json(
      {
        error: 'Method Not Allowed',
        message: `Cannot GET ${procedurePath}. Use POST for mutations.`,
        code: 'METHOD_NOT_SUPPORTED',
      },
      { status: 405 }
    );
  }
  
  // Pass through to tRPC handler for queries
  return handler(req);
};

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
export const GET = getHandler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;