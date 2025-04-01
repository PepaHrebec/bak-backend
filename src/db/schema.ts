import { InferSelectModel } from "drizzle-orm";
import {
  datetime,
  int,
  mysqlTable,
  serial,
  varchar,
} from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable("users_table", {
  id: int().autoincrement().notNull().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
});

export const listsTable = mysqlTable("lists_table", {
  id: int().autoincrement().notNull().primaryKey(),
  userId: int()
    .references(() => usersTable.id)
    .notNull(),
  wordId: int()
    .references(() => wordsTable.id)
    .notNull(),
});

export const wordsTable = mysqlTable("words_table", {
  id: int().autoincrement().notNull().primaryKey(),
  word: varchar({ length: 255 }).notNull(),
});

export const transcriptionsTable = mysqlTable("transcriptions_table", {
  id: int().autoincrement().notNull().primaryKey(),
  wordId: int()
    .references(() => wordsTable.id)
    .notNull(),
  transcription: varchar({ length: 255 }).notNull(),
});

export const sessionTable = mysqlTable("session", {
  id: varchar("id", {
    length: 255,
  }).primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id),
  expiresAt: datetime("expires_at").notNull(),
});

export type User = InferSelectModel<typeof usersTable>;
export type Session = InferSelectModel<typeof sessionTable>;
