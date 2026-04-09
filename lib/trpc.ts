import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/trpc/router';
import { createClient } from '@/utils/supabase/client';

// API URL resolver
function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  
  if (base) {
    return `${base}/api/trpc`;
  }

  return 'http://localhost:3000/api/trpc';
}

export function getVanillaTRPCClient() {
  const url = getApiUrl();
  
  // Shared fetch wrapper that adds auth headers
  async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit | undefined) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> || {}),
      };
      
      if (session?.access_token) {
        headers.authorization = `Bearer ${session.access_token}`;
      }

      return fetch(input, {
        ...init,
        credentials: 'include',
        headers,
      });
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Fallback to unauthenticated request
      return fetch(input, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers as Record<string, string> || {}),
        },
      });
    }
  }
  
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        fetch: fetchWithAuth,
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