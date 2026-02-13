import type { APIRoute } from "astro";
import { clearSession } from "@/lib/auth/session";
import { json } from "@/lib/security/api";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  clearSession(cookies);
  return json({ ok: true });
};
