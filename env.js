import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const parsed = envSchema.safeParse(process.env);

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    RESEND_API_KEY: z.string(),
    EMAIL_FROM: z.string(),
  },
  runtimeEnv: parsed.data,
});