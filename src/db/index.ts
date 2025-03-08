import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

export const db = drizzle(process.env.MYSQL_URL);

try {
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
  console.log("Migration successful!");
} catch (error) {
  console.log("Migration failed!");
  console.log(error);
}
