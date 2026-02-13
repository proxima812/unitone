import type { APIRoute } from "astro";
import { generateCsrfToken, setSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { verifyTelegramLoginPayload } from "@/lib/auth/telegram";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TelegramVerifyRequest } from "@/lib/types";
import { badRequest, forbidden, json } from "@/lib/security/api";

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

  const supabase = getSupabaseServerClient();
  const { data: adminUser, error } = await supabase
    .from(env.supabaseAdminUsersTable)
    .select("id, telegram_id, username, role, is_active")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!adminUser) return forbidden("This Telegram account is not allowed in admin panel");

  const csrfToken = generateCsrfToken();
  setSession(cookies, {
    telegramId,
    username: adminUser.username || payload.username || null,
    role: adminUser.role || "admin",
    csrfToken,
    iat: Math.floor(Date.now() / 1000),
  });

  return json({
    ok: true,
    me: {
      telegramId,
      username: adminUser.username || payload.username || null,
      role: adminUser.role || "admin",
      csrfToken,
    },
  });
};
