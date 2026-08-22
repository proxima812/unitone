import type { APIRoute } from "astro";
import { publicationTypes } from "../../../lib/publications/types";
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

export function createPublicationIndexHandlers(services: PublicationApiServices) {
	const GET: APIRoute = async ({ url }) => {
		try {
			const allowedParameters = new Set(["type", "category", "tag"]);
			for (const key of url.searchParams.keys()) {
				if (!allowedParameters.has(key)) throw new ApiRequestError(400, "Неподдерживаемый параметр запроса.");
			}

			const type = url.searchParams.get("type")?.trim() ?? "";
			if (type && !publicationTypes.includes(type as (typeof publicationTypes)[number])) {
				throw new ApiRequestError(422, "Неизвестный тип публикации.");
			}
			const publications = await services.repository.listPublishedPublications({
				type: type ? type as (typeof publicationTypes)[number] : undefined,
				category: url.searchParams.get("category")?.trim() || undefined,
				tag: url.searchParams.get("tag")?.trim() || undefined,
			});
			return jsonResponse({ ok: true, publications });
		} catch (error) {
			return apiErrorResponse(error);
		}
	};

	const POST: APIRoute = async ({ request }) => {
		try {
			const body = await readJsonObject(request);
			const profile = await services.authenticateBody(request, body);
			const input = validatedPublicationInput(body);
			const publication = await services.repository.createPublication(profile, input);
			return jsonResponse({ ok: true, publication: withoutAuthorTelegramId(publication) }, 201, true);
		} catch (error) {
			return apiErrorResponse(error, true);
		}
	};

	return { GET, POST };
}

export const { GET, POST } = createPublicationIndexHandlers(publicationApiServices);
