import { Hono } from "hono";
import { getTranscribedWord } from "./utils/helpers";
import { cors } from "hono/cors";
import { db } from "./db";
import { usersTable } from "./db/schema";
import {
  createSession,
  generateSessionToken,
  validateSessionToken,
} from "./auth/session";
import { setSessionTokenCookie } from "./auth/cookies";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://localhost:3001/",
    credentials: true,
  })
);

// TODO: Add refetch limiter
app.get("/:word?", async (c) => {
  const { word } = c.req.param();
  let transcribed = await getTranscribedWord(word);

  // Fetches a different word in case of a blank transcription
  while (transcribed.array.length === 0) {
    transcribed = await getTranscribedWord();
  }

  const token = getCookie(c, "session");
  console.log(token);
  if (token !== undefined) {
    const session = await validateSessionToken(token);
    console.log(session?.userId);
  } else {
    console.log("NOOO");
  }

  return c.json({
    originalWord: transcribed.word,
    transcriptions: transcribed.array,
  });
});

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
  });
});

app.post("log-in", async (c) => {
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
    name: body.name,
  });
});

export default app;
