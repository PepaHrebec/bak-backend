import { Context } from "hono";
import { validateSessionToken } from "./session";
import { getCookie } from "hono/cookie";

export function setSessionTokenCookie(
  c: Context,
  token: string,
  expiresAt: Date
): void {
  c.header(
    "Set-Cookie",
    `session=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/`
  );
}

export function deleteSessionTokenCookie(c: Context): void {
  c.header("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/");
}

async function handleRequest(c: Context): Promise<void> {
  // csrf protection
  if (c.req.method !== "GET") {
    const origin = c.req.header("Origin");
    // You can also compare it against the Host or X-Forwarded-Host header.
    if (origin === null || origin !== process.env.FRONTEND) {
      c.status(403);
      return;
    }
  }

  // session validation
  const token = getCookie(c, "session");
  if (token === undefined) {
    c.status(401);
    return;
  }

  const session = await validateSessionToken(token);
  if (session === null) {
    deleteSessionTokenCookie(c);
    c.status(401);
    return;
  }
  setSessionTokenCookie(c, token, session.expiresAt);
}
