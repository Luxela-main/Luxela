import { type Config } from 'drizzle-kit';
import "dotenv/config";

// import { env } from '~/env.local';

export default {
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

} satisfies Config;