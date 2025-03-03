import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? process.env.MYSQL_URL
        : process.env.DATABASE_URL,
  },
});
