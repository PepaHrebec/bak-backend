// import { redis } from "./redis";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { db } from "../db";
import { sessionTable, usersTable, Session } from "../db/schema";
import { eq } from "drizzle-orm";

// export interface Session {
//   id: string;
//   userId: number;
//   expiresAt: Date;
// }

// interface UnderlinedSession {
//   id: string;
//   user_id: number;
//   expires_at: Date;
// }

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function createSession(
  token: string,
  userId: number
): Promise<Session> {
  // const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  // const session: Session = {
  //   id: sessionId,
  //   userId,
  //   expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  // };
  // await redis.set(
  //   `session:${session.id}`,
  //   JSON.stringify({
  //     id: session.id,
  //     user_id: session.userId,
  //     expires_at: Math.floor(session.expiresAt.getTime() / 1000),
  //   }),
  //   {
  //     EXAT: Math.floor(session.expiresAt.getTime() / 1000),
  //   }
  // );
  // await redis.sAdd(`user_sessions:${userId}`, sessionId);

  // return session;

  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };
  await db.insert(sessionTable).values(session);
  return session;
}

export async function validateSessionToken(
  token: string
): Promise<Session | null> {
  // const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  // const item = await redis.get(`session:${sessionId}`);
  // if (item === null) {
  //   return null;
  // }

  // const result: UnderlinedSession = JSON.parse(item);
  // const session: Session = {
  //   id: result.id,
  //   userId: result.user_id,
  //   expiresAt: new Date(new Date(result.expires_at).getTime() * 1000),
  // };
  // if (Date.now() >= session.expiresAt.getTime()) {
  //   await redis.del(`session:${sessionId}`);
  //   await redis.sRem(`user_sessions:${session.userId}`, sessionId);
  //   return null;
  // }
  // if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
  //   session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  //   await redis.set(
  //     `session:${session.id}`,
  //     JSON.stringify({
  //       id: session.id,
  //       user_id: session.userId,
  //       expires_at: Math.floor(session.expiresAt.getTime() / 1000),
  //     }),
  //     {
  //       EXAT: Math.floor(session.expiresAt.getTime() / 1000),
  //     }
  //   );
  // }
  // return session;

  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await db
    .select({ user: usersTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(usersTable, eq(sessionTable.userId, usersTable.id))
    .where(eq(sessionTable.id, sessionId));
  if (result.length < 1) {
    return null;
  }
  const { session } = result[0];
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
    return null;
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(sessionTable)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(sessionTable.id, session.id));
  }
  return session;
}

export async function invalidateSession(sessionId: string): Promise<void> {
  // await redis.del(`session:${sessionId}`);
  // await redis.sRem(`user_sessions:${userId}`, sessionId);
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function invalidateAllSessions(userId: number): Promise<void> {
  // const sessionIds = await redis.sMembers(`user_sessions:${userId}`);
  // if (sessionIds.length < 1) {
  //   return;
  // }

  // const pipeline = redis.multi();

  // for (const sessionId of sessionIds) {
  //   pipeline.unlink(`session:${sessionId}`);
  // }
  // pipeline.unlink(`user_sessions:${userId}`);

  // await pipeline.exec();
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}
