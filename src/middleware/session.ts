import { Context, Next } from "hono";
import { validateSessionToken } from "../auth/session";
import { Session } from "../db/schema";
import { getCookie } from "hono/cookie";
import { setSessionTokenCookie } from "../auth/cookies";

export const sessionMiddleware = async (c: Context, next: Next) => {
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
};
