import type { APIRoute } from "astro";

const appUrl = "https://unityone.appwrite.network/app/";

type TelegramUpdate = {
	message?: {
		chat?: { id?: number };
		text?: string;
	};
};

export const prerender = false;

function env(name: string): string | undefined {
	const value = import.meta.env[name] ?? process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const POST: APIRoute = async ({ request }) => {
	const secret = env("TELEGRAM_WEBHOOK_SECRET");
	if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
		return new Response("Unauthorized", { status: 401 });
	}

	const update = (await request.json()) as TelegramUpdate;
	const chatId = update.message?.chat?.id;
	const command = update.message?.text?.trim().split(/\s+/u)[0]?.split("@")[0];

	if (!chatId || command !== "/start") {
		return Response.json({ ok: true });
	}

	const token = env("TELEGRAM_BOT_TOKEN") ?? env("BOT_TOKEN");
	if (!token) return new Response("Bot token is not configured", { status: 500 });

	const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: chatId,
			text: [
				"Добро пожаловать в «12 шагов»!",
				"",
				"Здесь собраны материалы, посты, полезные инструменты, опыт участников и сообщества.",
				"",
				"Вы можете читать публикации, делиться своим опытом и предлагать собственные материалы. Новые записи проходят модерацию.",
				"",
				"Нажмите кнопку ниже, чтобы открыть приложение.",
			].join("\n"),
			reply_markup: {
				inline_keyboard: [[{ text: "Открыть приложение", web_app: { url: appUrl } }]],
			},
		}),
	});

	if (!telegramResponse.ok) {
		return new Response("Telegram API error", { status: 502 });
	}

	return Response.json({ ok: true });
};
