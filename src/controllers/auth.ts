import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
  setSessionTokenCookie,
  deleteSessionTokenCookie,
} from "../auth/cookies";
import {
  generateSessionToken,
  createSession,
  invalidateSession,
} from "../auth/session";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { sendErrorJson } from "../utils/helpers";
import { HonoVariables } from "../utils/types";

const auth = new Hono<{ Variables: HonoVariables }>();

auth.post("/sign-in", async (c) => {
  if (c.get("session")) {
    return sendErrorJson(c, "You're already logged-in.");
  }

  const body: { name: string; password: string } = await c.req.json();
  const hashedPassword = await Bun.password.hash(body.password);

  const res = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, body.name));

  if (res.length !== 0) {
    return sendErrorJson(c, "This user already exists.");
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

auth.post("/log-in", async (c) => {
  const body: { name: string; password: string } = await c.req.json();
  const res = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, body.name));

  if (res.length === 0) {
    return sendErrorJson(c, "No such user found.");
  }

  const isMatch = await Bun.password.verify(body.password, res[0].password);

  if (!isMatch) {
    return sendErrorJson(c, "Wrong password.");
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

auth.post("/log-out", async (c) => {
  const session = c.get("session");
  if (session) {
    invalidateSession(session.id);
    deleteSessionTokenCookie(c);
    c.status(200);
    return c.json({});
  } else {
    return sendErrorJson(c, "There has been an error logging you out.");
  }
});

export default auth;
