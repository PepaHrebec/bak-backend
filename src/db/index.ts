import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

console.log("Hey");
console.log(process.env.NODE_ENV);
console.log(process.env.MYSQL_URL);
console.log(process.env.DATABASE_URL);

// docker.for.mac.localhost
export const db = drizzle(process.env.MYSQL_URL);

try {
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
} catch (error) {}
