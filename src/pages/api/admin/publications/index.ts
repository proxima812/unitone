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

export function createAdminPublicationHandlers(services: PublicationApiServices) {
	async function responseFor(profile: Awaited<ReturnType<PublicationApiServices["authenticateBody"]>>) {
		if (!services.isAdmin(profile.telegramId)) throw new ApiRequestError(403, "Нет доступа.");
		const publications = await services.repository.listReviewQueue();
		return jsonResponse({ ok: true, publications }, 200, true);
	}

	const GET: APIRoute = async ({ request }) => {
		try {
			return await responseFor(await services.authenticateHeader(request));
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	const POST: APIRoute = async ({ request }) => {
		try {
			const body = await readJsonObject(request);
			return await responseFor(await services.authenticateBody(request, body));
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	return { GET, POST };
}

export const { GET, POST } = createAdminPublicationHandlers(publicationApiServices);
