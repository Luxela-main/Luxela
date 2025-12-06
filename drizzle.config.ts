import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "./server/db/schema.ts",

  driver: "pglite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  extensionsFilters: ["postgis"],
  schemaFilter: "public",
  tablesFilter: "*",

  introspect: {
    casing: "camel",
  },

  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },

  breakpoints: true,
  strict: true,
  verbose: true,
});
