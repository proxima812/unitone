import { getSession } from "@/lib/auth/session";

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0, must-revalidate",
      ...extraHeaders,
    },
  });
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: message }, 401);
}

export function forbidden(message = "Forbidden") {
  return json({ error: message }, 403);
}

export function badRequest(message = "Bad request") {
  return json({ error: message }, 400);
}

export function methodNotAllowed(message = "Method not allowed") {
  return json({ error: message }, 405);
}

export function requireSessionFromContext(context: { cookies: any }) {
  return getSession(context.cookies);
}
