import { int, mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable("users_table", {
  id: int().autoincrement().notNull().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
});

export const repeatedWordsTable = mysqlTable("repeated_words_table", {
  id: serial().primaryKey(),
  userId: int()
    .references(() => usersTable.id)
    .notNull(),
  word: varchar({ length: 255 }).notNull(),
  transcription: varchar({ length: 255 }).notNull(),
});
