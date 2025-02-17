import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "bun";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
