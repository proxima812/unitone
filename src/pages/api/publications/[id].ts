import type { APIRoute } from "astro";
import {
	ApiRequestError,
	apiErrorResponse,
	jsonResponse,
	publicationApiServices,
	readJsonObject,
	type PublicationApiServices,
	validatedPublicationInput,
	withoutAuthorTelegramId,
} from "../../../lib/server/api";

export const prerender = false;

function requiredId(id: string | undefined): string {
	if (!id?.trim()) throw new ApiRequestError(400, "Не указан ID публикации.");
	return id;
}

export function createPublicationDetailHandlers(services: PublicationApiServices) {
	const GET: APIRoute = async ({ request, params }) => {
		try {
			const id = requiredId(params.id);
			let publication = await services.repository.getPublicationForViewer(id);
			if (!publication && request.headers.has("Authorization")) {
				const profile = await services.authenticateHeader(request);
				publication = await services.repository.getPublicationForViewer(id, profile.telegramId);
			}
			if (!publication) throw new ApiRequestError(404, "Публикация не найдена.");
			return jsonResponse({ ok: true, publication }, 200, request.headers.has("Authorization"));
		} catch (error) {
			return apiErrorResponse(error, request.headers.has("Authorization"));
		}
	};

	const PATCH: APIRoute = async ({ request, params }) => {
		try {
			const id = requiredId(params.id);
			const body = await readJsonObject(request);
			const profile = await services.authenticateBody(request, body);
			const input = validatedPublicationInput(body);
			const publication = await services.repository.updatePublication(id, profile.telegramId, input);
			return jsonResponse({ ok: true, publication: withoutAuthorTelegramId(publication) }, 200, true);
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	return { GET, PATCH };
}

export const { GET, PATCH } = createPublicationDetailHandlers(publicationApiServices);
