import crypto from "node:crypto";
import { env } from "@/lib/env";
import type { TelegramVerifyRequest } from "@/lib/types";

function normalizeTelegramPayload(payload: TelegramVerifyRequest | Record<string, unknown>) {
  const clean = Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  return clean.map(([key, value]) => `${key}=${value}`).join("\n");
}

export function verifyTelegramLoginPayload(payload: TelegramVerifyRequest): { ok: true } | { ok: false; reason: string } {
  const botToken = env.telegramBotToken;
  if (!botToken) return { ok: false, reason: "TELEGRAM_BOT_TOKEN is not configured" };

  if (!payload.hash || !payload.auth_date || !payload.id) {
    return { ok: false, reason: "Missing required Telegram auth fields" };
  }

  const authDate = Number(payload.auth_date);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || nowSec - authDate > env.telegramAuthMaxAgeSec) {
    return { ok: false, reason: "Telegram auth payload is expired" };
  }

  const dataCheckString = normalizeTelegramPayload(payload);
  const secret = new Uint8Array(crypto.createHash("sha256").update(botToken).digest());
  const computedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const encoder = new TextEncoder();
  const a = encoder.encode(computedHash);
  const b = encoder.encode(String(payload.hash));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "Telegram auth hash mismatch" };
  }

  return { ok: true };
}
