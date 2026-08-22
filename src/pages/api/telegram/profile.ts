import type { APIRoute } from "astro";
import { AppwriteConfigError, AppwriteRequestError, upsertTelegramProfile } from "@/lib/server/appwrite";
import { isTelegramAdmin, TelegramAuthError, telegramProfileData, verifyTelegramInitData } from "@/lib/server/telegram";

function json(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ ok: false, error: "Некорректный JSON." }, 400);
	}

	const initData = typeof payload === "object" && payload !== null && "initData" in payload && typeof payload.initData === "string"
		? payload.initData
		: "";

	try {
		const verified = verifyTelegramInitData(initData);
		const profile = telegramProfileData(verified.user);
		const storedProfile = await upsertTelegramProfile(profile);
		return json({
			ok: true,
			profile: {
				firstName: storedProfile.firstName,
				lastName: storedProfile.lastName,
				username: storedProfile.username,
				photoUrl: storedProfile.photoUrl,
				createdAt: storedProfile.createdAt,
				updatedAt: storedProfile.updatedAt,
				isAdmin: isTelegramAdmin(profile.telegramId),
			},
		});
	} catch (error) {
		if (error instanceof TelegramAuthError) return json({ ok: false, error: error.message }, 401);
		if (error instanceof AppwriteConfigError) return json({ ok: false, error: "Не настроены переменные Appwrite.", missing: error.missing }, 500);
		if (error instanceof AppwriteRequestError) return json({ ok: false, error: error.message, appwriteStatus: error.status }, 502);
		return json({ ok: false, error: "Не удалось сохранить профиль." }, 500);
	}
};
