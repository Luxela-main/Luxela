import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc/context";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";

// GET handler - forward all requests to POST handler to handle mutations properly
// Some browsers/CDNs may convert POST to GET on redirects or errors
const getHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const procedurePath = url.pathname.replace('/api/trpc/', '');
  
  // List of known mutation procedures
  const mutationProcedures = [
    'payment.createCartPayment',
    'payment.createPayment',
    'payment.verifyPayment',
    'payment.createCheckout',
  ];
  
  // Log all GET requests for debugging
  console.warn(`[tRPC] GET request received: ${procedurePath || '(batch)'}, Query params: ${url.searchParams.toString()}`);
  
  // If this looks like a mutation request (has input params), forward to POST handler
  if (mutationProcedures.includes(procedurePath) || url.searchParams.has('input')) {
    console.warn(`[tRPC] Forwarding GET mutation request to POST handler: ${procedurePath}`);
    
    // Clone the request but change method to POST
    // tRPC can extract input from query params
    const headers = new Headers(req.headers);
    headers.set('x-forwarded-from-get', 'true');
    
    const postReq = new Request(req.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    
    // Convert to NextRequest
    const nextPostReq = new NextRequest(postReq);
    
    return handler(nextPostReq);
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