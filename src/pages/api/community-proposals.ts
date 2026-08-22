import type { APIRoute } from "astro";
import { AppwriteConfigError, AppwriteRequestError, createCommunityProposal, setCommunityProposalChannelMessage, upsertTelegramProfile } from "@/lib/server/appwrite";
import { notifyChannelAboutCommunity, TelegramAuthError, telegramProfileData, verifyTelegramInitData } from "@/lib/server/telegram";

const maxLength = {
	title: 120,
	description: 600,
	category: 120,
	since: 80,
	website: 240,
	finderUrl: 240,
	notes: 1000,
};

function json(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

function readField(source: Record<string, unknown>, key: keyof typeof maxLength): string {
	const value = source[key];
	if (typeof value !== "string") return "";
	return value.trim().slice(0, maxLength[key]);
}

function validOptionalUrl(value: string): boolean {
	if (!value) return true;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:";
	} catch {
		return false;
	}
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ ok: false, error: "Некорректный JSON." }, 400);
	}

	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
		return json({ ok: false, error: "Некорректные данные формы." }, 400);
	}

	const source = payload as Record<string, unknown>;
	const initData = typeof source.initData === "string" ? source.initData : "";
	const proposal = {
		title: readField(source, "title"),
		description: readField(source, "description"),
		category: readField(source, "category"),
		since: readField(source, "since"),
		website: readField(source, "website"),
		finderUrl: readField(source, "finderUrl"),
		notes: readField(source, "notes"),
	};

	if (!proposal.title || !proposal.description) {
		return json({ ok: false, error: "Заполните название и короткое описание." }, 400);
	}
	if (!validOptionalUrl(proposal.website) || !validOptionalUrl(proposal.finderUrl)) {
		return json({ ok: false, error: "Проверьте ссылки: нужен полный адрес с http:// или https://." }, 400);
	}

	try {
		const verified = verifyTelegramInitData(initData);
		const profile = telegramProfileData(verified.user);
		await upsertTelegramProfile(profile);
		const proposalId = await createCommunityProposal(profile, proposal);
		try {
			const authorName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
			const messageId = await notifyChannelAboutCommunity({
				title: proposal.title,
				category: proposal.category,
				authorName,
				authorUsername: profile.username,
			});
			if (messageId) await setCommunityProposalChannelMessage(proposalId, messageId);
		} catch (error) {
			console.error("Failed to notify Telegram channel about community proposal.", error);
		}
		return json({ ok: true, proposalId });
	} catch (error) {
		if (error instanceof TelegramAuthError) return json({ ok: false, error: error.message }, 401);
		if (error instanceof AppwriteConfigError) return json({ ok: false, error: "Не настроены переменные Appwrite.", missing: error.missing }, 500);
		if (error instanceof AppwriteRequestError) return json({ ok: false, error: error.message, appwriteStatus: error.status }, 502);
		return json({ ok: false, error: "Не удалось отправить карточку." }, 500);
	}
};
