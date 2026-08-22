import type { APIRoute } from "astro";
import { AppwriteConfigError, AppwriteRequestError, deleteCommunityProposal, getCommunityProposal } from "@/lib/server/appwrite";
import { deleteChannelMessage, isTelegramAdmin, TelegramAuthError, verifyTelegramInitData } from "@/lib/server/telegram";

function json(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

export const prerender = false;

export const DELETE: APIRoute = async ({ request, params }) => {
	const id = params.id?.trim();
	if (!id) return json({ ok: false, error: "Не указан ID." }, 400);

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		payload = {};
	}
	const initData = typeof payload === "object" && payload !== null && "initData" in payload && typeof (payload as Record<string, unknown>).initData === "string"
		? (payload as Record<string, unknown>).initData as string
		: "";

	try {
		const verified = verifyTelegramInitData(initData);
		const telegramId = String(verified.user.id);
		const proposal = await getCommunityProposal(id);
		if (!proposal) return json({ ok: false, error: "Не найдено." }, 404);
		if (proposal.telegramId !== telegramId && !isTelegramAdmin(telegramId)) {
			return json({ ok: false, error: "Нет доступа." }, 403);
		}

		await deleteCommunityProposal(id);
		try {
			if (proposal.telegramChannelMessageId) await deleteChannelMessage(proposal.telegramChannelMessageId);
		} catch (error) {
			console.error("Failed to delete Telegram channel message.", error);
		}

		return json({ ok: true });
	} catch (error) {
		if (error instanceof TelegramAuthError) return json({ ok: false, error: error.message }, 401);
		if (error instanceof AppwriteConfigError) return json({ ok: false, error: "Не настроены переменные Appwrite.", missing: error.missing }, 500);
		if (error instanceof AppwriteRequestError) return json({ ok: false, error: error.message, appwriteStatus: error.status }, 502);
		return json({ ok: false, error: "Не удалось удалить." }, 500);
	}
};
