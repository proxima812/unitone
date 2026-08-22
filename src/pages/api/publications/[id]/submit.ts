import type { APIRoute } from "astro";
import {
	ApiRequestError,
	apiErrorResponse,
	jsonResponse,
	publicationApiServices,
	readJsonObject,
	type PublicationApiServices,
	withoutAuthorTelegramId,
} from "../../../../lib/server/api";

export const prerender = false;

export function createSubmitHandlers(services: PublicationApiServices) {
	const POST: APIRoute = async ({ request, params }) => {
		try {
			if (!params.id?.trim()) throw new ApiRequestError(400, "Не указан ID публикации.");
			const body = await readJsonObject(request);
			const profile = await services.authenticateBody(request, body);
			const current = await services.repository.getPublicationForViewer(params.id, profile.telegramId);
			const publication = await services.repository.submitPublication(params.id, profile.telegramId);
			try {
				if (current?.status !== "review") await services.notifySubmission?.(publication);
			} catch (error) {
				console.error("Failed to notify publication moderators.", error);
			}
			return jsonResponse({ ok: true, publication: withoutAuthorTelegramId(publication) }, 200, true);
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	return { POST };
}

export const { POST } = createSubmitHandlers(publicationApiServices);
