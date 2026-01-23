import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/trpc/router';
import { createClient } from '@/utils/supabase/client';

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

export const vanillaTrpc = getVanillaTRPCClient();
export const getTRPCClient = getVanillaTRPCClient;
export { trpc } from '@/app/_trpc/client';