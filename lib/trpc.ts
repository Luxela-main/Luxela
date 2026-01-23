import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/trpc/router';
import { createClient } from '@/utils/supabase/client';

// API URL resolver
function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  
  if (base) {
    return `${base}/api/trpc`;
  }

  return 'http://localhost:5000/api/trpc';
}

export function getVanillaTRPCClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getApiUrl(),
        
        // Async fetch function to get the current session token
        async fetch(input, init) {
          try {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();

            return fetch(input, {
              ...init,
              credentials: 'include',
              headers: {
                ...(init?.headers || {}),
                authorization: session?.access_token
                  ? `Bearer ${session.access_token}`
                  : '',
                'Content-Type': 'application/json',
              },
            });
          } catch (error) {
            console.error('Error getting auth token:', error);
            // Fallback to unauthenticated request
            return fetch(input, {
              ...init,
              credentials: 'include',
              headers: {
                ...(init?.headers || {}),
                'Content-Type': 'application/json',
              },
            });
          }
        },
      }),
    ],
  });
}

// Create a vanilla TRPC client instance for non-React contexts
export const vanillaTrpc = getVanillaTRPCClient();

// Alias for backwards compatibility
export const getTRPCClient = getVanillaTRPCClient;

// Re-export the React tRPC client for provider setup
export { trpc } from '@/app/_trpc/client';