import { createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramUser {
	id: number;
	first_name?: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	photo_url?: string;
	is_premium?: boolean;
}

export interface VerifiedTelegramInitData {
	authDate: number;
	user: TelegramUser;
}

export class TelegramAuthError extends Error {
	constructor(message: string) {
		super(message);
	}
}

function env(name: string): string | undefined {
	const value = process.env[name] ?? import.meta.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isTelegramAdmin(telegramId: string): boolean {
	return (env("ADMIN_TELEGRAM_IDS") ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter((value) => /^\d+$/.test(value))
		.includes(telegramId);
}

function botToken(): string {
	const token = env("TELEGRAM_BOT_TOKEN") ?? env("BOT_TOKEN") ?? env("TELEGRAM_TOKEN");
	if (!token) throw new TelegramAuthError("Не задан TELEGRAM_BOT_TOKEN.");
	return token;
}

function maxAgeSeconds(): number {
	const raw = env("TELEGRAM_AUTH_MAX_AGE_SECONDS");
	if (!raw) return 60 * 60 * 24;
	const value = Number.parseInt(raw, 10);
	return Number.isFinite(value) && value > 0 ? value : 60 * 60 * 24;
}

function hmacHex(data: string, key: string | Buffer): string {
	return createHmac("sha256", key).update(data).digest("hex");
}

function safeEqualHex(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left, "hex");
	const rightBuffer = Buffer.from(right, "hex");
	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseTelegramUser(value: string | null): TelegramUser {
	if (!value) throw new TelegramAuthError("В Telegram initData нет профиля пользователя.");

	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new TelegramAuthError("Некорректный профиль Telegram.");
	}

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new TelegramAuthError("Некорректный профиль Telegram.");
	}

	const user = parsed as Record<string, unknown>;
	if (typeof user.id !== "number" || !Number.isFinite(user.id)) {
		throw new TelegramAuthError("В профиле Telegram нет ID.");
	}

	return {
		id: user.id,
		first_name: typeof user.first_name === "string" ? user.first_name : undefined,
		last_name: typeof user.last_name === "string" ? user.last_name : undefined,
		username: typeof user.username === "string" ? user.username : undefined,
		language_code: typeof user.language_code === "string" ? user.language_code : undefined,
		photo_url: typeof user.photo_url === "string" ? user.photo_url : undefined,
		is_premium: typeof user.is_premium === "boolean" ? user.is_premium : undefined,
	};
}

export function verifyTelegramInitData(initData: string): VerifiedTelegramInitData {
	if (!initData.trim()) throw new TelegramAuthError("Откройте приложение внутри Telegram.");

	const params = new URLSearchParams(initData);
	const receivedHash = params.get("hash");
	if (!receivedHash) throw new TelegramAuthError("Telegram initData не содержит hash.");

	const checkPairs = [...params.entries()]
		.filter(([key]) => key !== "hash")
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}=${value}`);
	const dataCheckString = checkPairs.join("\n");
	const secretKey = createHmac("sha256", "WebAppData").update(botToken()).digest();
	const calculatedHash = hmacHex(dataCheckString, secretKey);

	if (!safeEqualHex(calculatedHash, receivedHash)) {
		throw new TelegramAuthError("Не удалось подтвердить вход через Telegram.");
	}

	const authDate = Number.parseInt(params.get("auth_date") ?? "", 10);
	if (!Number.isFinite(authDate) || authDate <= 0) {
		throw new TelegramAuthError("Telegram initData не содержит auth_date.");
	}

	const now = Math.floor(Date.now() / 1000);
	if (now - authDate > maxAgeSeconds()) {
		throw new TelegramAuthError("Сессия Telegram устарела. Откройте приложение заново.");
	}

	return {
		authDate,
		user: parseTelegramUser(params.get("user")),
	};
}

export function telegramProfileData(user: TelegramUser) {
	return {
		telegramId: String(user.id),
		firstName: user.first_name ?? "",
		lastName: user.last_name ?? "",
		username: user.username ?? "",
		languageCode: user.language_code ?? "",
		photoUrl: user.photo_url ?? "",
		isPremium: user.is_premium ?? false,
	};
}
