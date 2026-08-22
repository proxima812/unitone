import type { APIRoute } from "astro";
import {
	apiErrorResponse,
	jsonResponse,
	publicationApiServices,
	readJsonObject,
	type PublicationApiServices,
	withoutAuthorTelegramId,
} from "../../../lib/server/api";

export const prerender = false;

export function createProfilePublicationHandlers(services: PublicationApiServices) {
	async function responseFor(profile: Awaited<ReturnType<PublicationApiServices["authenticateBody"]>>) {
		const publications = await services.repository.listAuthorPublications(profile.telegramId);
		return jsonResponse({ ok: true, publications: publications.map(withoutAuthorTelegramId) }, 200, true);
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

export const { GET, POST } = createProfilePublicationHandlers(publicationApiServices);
