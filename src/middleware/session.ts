import { Context, Next } from "hono";
import { Session, validateSessionToken } from "../auth/session";
import { getCookie } from "hono/cookie";
import { setSessionTokenCookie } from "../auth/cookies";

export const sessionMiddleware = async (c: Context, next: Next) => {
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
};
