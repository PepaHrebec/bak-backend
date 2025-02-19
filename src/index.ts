import { Hono } from "hono";
import { getTranscribedWord } from "./utils/helpers";
import { cors } from "hono/cors";
import { db } from "./db";
import { repeatedWordsTable, usersTable } from "./db/schema";
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  Session,
  validateSessionToken,
} from "./auth/session";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from "./auth/cookies";
import { and, eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { HonoVariables } from "./utils/types";
import { logger } from "hono/logger";

const app = new Hono<{ Variables: HonoVariables }>();

app.use(logger());

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("*", async (c, next) => {
  // if (c.req.method !== "GET") {
  //   const origin = c.req.header("Origin");
  //   // You can also compare it against the Host or X-Forwarded-Host header.
  //   if (origin === null || origin !== "http://localhost:5173") {
  //     c.status(403);
  //   }
  // }

  let session: Session | null = null;
  const token = getCookie(c, "session");
  if (token !== undefined) {
    session = await validateSessionToken(token);
    if (session) {
      setSessionTokenCookie(c, token, session.expiresAt);
    }
  }

  c.set("session", session);
  await next();
});

// TODO: Add refetch limiter
app.get("/:word?", async (c) => {
  // TODO: Check if the word is "favorite"
  const { word } = c.req.param();
  let transcribed = await getTranscribedWord(word);

  // Fetches a different word in case of a blank transcription
  while (transcribed.array.length === 0) {
    transcribed = await getTranscribedWord();
  }

  return c.json({
    loggedIn: c.get("session") !== null,
    originalWord: transcribed.word,
    transcriptions: transcribed.array,
  });
});

// TODO: Signed-in user shouldn't be able to sign-in again
app.post("/sign-in", async (c) => {
  const body: { name: string; password: string } = await c.req.json();
  const hashedPassword = await Bun.password.hash(body.password);

  const res = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, body.name));

  if (res.length !== 0) {
    c.status(400);
    return c.json({ mess: "User exists" });
  }

  const userId = await db
    .insert(usersTable)
    .values({ name: body.name, password: hashedPassword })
    .$returningId();

  const token = generateSessionToken();
  await createSession(token, userId[0].id);
  setSessionTokenCookie(
    c,
    token,
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  );

  return c.json({
    name: body.name,
    id: userId[0].id,
  });
});

// TODO: Logged-in user shouldn't be able to log-in
app.post("/log-in", async (c) => {
  const body: { name: string; password: string } = await c.req.json();
  const res = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, body.name));

  if (res.length === 0) {
    c.status(400);
    return c.json({ mess: "No user" });
  }

  const isMatch = await Bun.password.verify(body.password, res[0].password);

  if (!isMatch) {
    c.status(400);
    return c.json({ mess: "Wrong password" });
  }

  const token = generateSessionToken();
  await createSession(token, res[0].id);
  setSessionTokenCookie(
    c,
    token,
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  );

  return c.json({
    name: res[0].name,
    id: res[0].id,
  });
});

app.post("/log-out", async (c) => {
  const session = c.get("session");
  if (session) {
    invalidateSession(session.id, session.userId);
    deleteSessionTokenCookie(c);
    c.status(200);
    return c.json({});
  } else {
    c.status(400);
    return c.json({});
  }
});

app.get("/repeat-list", async (c) => {
  const session = c.get("session");
  if (!session) {
    c.status(400);
    return c.json({});
  }

  const repeatedWords = await db
    .select({ word: repeatedWordsTable.word })
    .from(repeatedWordsTable)
    .where(eq(repeatedWordsTable.userId, session.userId));

  return c.json({
    words: repeatedWords,
  });
});

app.get("/repeat-list/:word", async (c) => {
  const { word } = c.req.param();
  const session = c.get("session");

  if (!session) {
    c.status(400);
    return c.json({});
  }

  const res = await db
    .select()
    .from(repeatedWordsTable)
    .where(
      and(
        eq(repeatedWordsTable.word, word),
        eq(repeatedWordsTable.userId, session.userId)
      )
    );

  if (res.length !== 0) {
    c.status(400);
    return c.json({ isListed: true });
  } else {
    return c.json({ isListed: false });
  }
});

app.post("/repeat-list", async (c) => {
  const word: string = await c.req.json();

  const session = c.get("session");
  if (!session) {
    c.status(400);
    return c.json({});
  }

  const res = await db
    .select()
    .from(repeatedWordsTable)
    .where(
      and(
        eq(repeatedWordsTable.word, word),
        eq(repeatedWordsTable.userId, session.userId)
      )
    );
  if (res.length !== 0) {
    c.status(400);
    return c.json({ mess: "Word is already there" });
  }

  await db
    .insert(repeatedWordsTable)
    .values({ userId: session.userId, word: word });

  return c.json({});
});

export default app;
