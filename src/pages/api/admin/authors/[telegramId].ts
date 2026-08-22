import type { APIRoute } from "astro";
import {
	ApiRequestError,
	apiErrorResponse,
	jsonResponse,
	publicationApiServices,
	readJsonObject,
	type PublicationApiServices,
} from "../../../../lib/server/api";

export const prerender = false;

export function createAdminAuthorHandlers(services: PublicationApiServices) {
	async function responseFor(telegramId: string | undefined, adminTelegramId: string) {
		if (!services.isAdmin(adminTelegramId)) throw new ApiRequestError(403, "Нет доступа.");
		if (!telegramId?.trim() || !/^\d+$/u.test(telegramId)) {
			throw new ApiRequestError(400, "Некорректный Telegram ID автора.");
		}
		const author = await services.repository.getAdminAuthorOverview(telegramId);
		if (!author) throw new ApiRequestError(404, "Автор не найден.");
		return jsonResponse({ ok: true, author }, 200, true);
	}

	const GET: APIRoute = async ({ request, params }) => {
		try {
			const profile = await services.authenticateHeader(request);
			return await responseFor(params.telegramId, profile.telegramId);
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	const POST: APIRoute = async ({ request, params }) => {
		try {
			const body = await readJsonObject(request);
			const profile = await services.authenticateBody(request, body);
			return await responseFor(params.telegramId, profile.telegramId);
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	return { GET, POST };
}

export const { GET, POST } = createAdminAuthorHandlers(publicationApiServices);
