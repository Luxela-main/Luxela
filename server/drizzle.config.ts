import { type Config } from 'drizzle-kit';

// import { env } from '~/env.local';

export default {
  schema: './server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

} satisfies Config;