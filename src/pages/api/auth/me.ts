import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth/session";
import { json, unauthorized } from "@/lib/security/api";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) return unauthorized();

  return json({
    telegramId: session.telegramId,
    username: session.username,
    role: session.role,
    csrfToken: session.csrfToken,
  });
};
