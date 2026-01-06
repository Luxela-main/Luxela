import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from '../../server/trpc/router';
import { createTRPCContext } from '../../server/trpc/context';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default createHTTPHandler({
  router: appRouter,
  createContext: createTRPCContext,
});