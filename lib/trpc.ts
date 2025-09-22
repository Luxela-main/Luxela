import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server';

export const api = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({ url: 'http://localhost:4000' }),
	],
});

