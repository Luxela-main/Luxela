import dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({ path: ".env" });

const config: Config = {
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  connectionString: process.env.DATABASE_URL!,
};

export default config;