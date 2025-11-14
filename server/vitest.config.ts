import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(__dirname, '.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Fallback to .env.local or .env
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000, // Increase timeout for DB operations
    // poolOptions: {
    //   threads: {
    //     singleThread: true, // Run tests sequentially to avoid connection pool issues
    //   },
    // },
    //  threads: false, // ✅ disables worker threads → tests run in a single thread
    // sequence: {
    //   concurrent: false, // ✅ ensures tests run one after another
    // },
  },
});