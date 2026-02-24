import type { APIRoute } from "astro";
import { generateCsrfToken, setSession } from "@/lib/auth/session";
import { verifyTelegramLoginPayload } from "@/lib/auth/telegram";
import type { TelegramVerifyRequest } from "@/lib/types";
import { badRequest, json } from "@/lib/security/api";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let payload: TelegramVerifyRequest;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const verified = verifyTelegramLoginPayload(payload);
  if (!verified.ok) return json({ error: verified.reason }, 401);

  const telegramId = Number(payload.id);
  if (!Number.isFinite(telegramId)) return badRequest("Invalid telegram id");

  const csrfToken = generateCsrfToken();
  setSession(cookies, {
    telegramId,
    username: payload.username || null,
    role: "admin",
    csrfToken,
    iat: Math.floor(Date.now() / 1000),
  });

  return json({
    ok: true,
    me: {
      telegramId,
      username: payload.username || null,
      role: "admin",
      csrfToken,
    },
  });
};
