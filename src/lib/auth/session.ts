import crypto from "node:crypto";
import type { AstroCookies } from "astro";
import { env } from "@/lib/env";
import type { SessionPayload } from "@/lib/types";

const DAY = 60 * 60 * 24;

function base64urlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64urlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  const secret = env.authSecret;
  if (!secret) throw new Error("AUTH_SECRET or TELEGRAM_BOT_TOKEN must be configured");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function generateCsrfToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function encodeSession(payload: SessionPayload) {
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function decodeSession(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = sign(encodedPayload);
  const encoder = new TextEncoder();
  const a = encoder.encode(signature);
  const b = encoder.encode(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(base64urlDecode(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSession(cookies: AstroCookies, payload: SessionPayload) {
  cookies.set(env.authCookieName, encodeSession(payload), {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: DAY,
  });
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete(env.authCookieName, { path: "/" });
}

export function getSession(cookies: AstroCookies) {
  return decodeSession(cookies.get(env.authCookieName)?.value);
}

export function assertCsrf(request: Request, session: SessionPayload) {
  const csrfHeader = request.headers.get("x-csrf-token");
  return csrfHeader && csrfHeader === session.csrfToken;
}
