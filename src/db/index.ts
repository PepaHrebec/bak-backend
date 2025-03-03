import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

// docker.for.mac.localhost
export const db = drizzle(
  process.env.NODE_ENV === "production"
    ? process.env.MYSQL_URL
    : process.env.DATABASE_URL
);

try {
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
} catch (error) {}
