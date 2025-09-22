import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/index';

export const api = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({ 
			// url: 'http://localhost:3000' 
			url: 'http://localhost:3000/api/trpc',
		}),
	],
});

