import type { APIRoute } from "astro";
import {
	ApiRequestError,
	apiErrorResponse,
	jsonResponse,
	publicationApiServices,
	readJsonObject,
	type PublicationApiServices,
} from "../../../../../lib/server/api";

export const prerender = false;

export function createPublishHandlers(services: PublicationApiServices) {
	const POST: APIRoute = async ({ request, params }) => {
		try {
			if (!params.id?.trim()) throw new ApiRequestError(400, "Не указан ID публикации.");
			const body = await readJsonObject(request);
			const profile = await services.authenticateBody(request, body);
			if (!services.isAdmin(profile.telegramId)) throw new ApiRequestError(403, "Нет доступа.");
			const publication = await services.repository.moderatePublication(params.id, "published", "");
			return jsonResponse({ ok: true, publication }, 200, true);
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	return { POST };
}

export const { POST } = createPublishHandlers(publicationApiServices);
