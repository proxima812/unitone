import type { PublicationInput, PublicationRecord, PublicPublication } from "../publications/types";
import { validatePublicationInput } from "../publications/validation";
import {
	AppwriteConfigError,
	AppwriteRequestError,
	type TelegramProfileData,
	upsertTelegramProfile,
} from "./appwrite";
import {
	createPublication,
	getAdminAuthorOverview,
	getPublicationForViewer,
	listAuthorPublications,
	listPublishedPublications,
	listReviewQueue,
	moderatePublication,
	PublicationRepositoryError,
	type PublicationRepository,
	submitPublication,
	updatePublication,
} from "./publications";
import {
	isTelegramAdmin,
	notifyAdminsAboutPublication,
	TelegramAuthError,
	telegramProfileData,
	verifyTelegramInitData,
} from "./telegram";

export class ApiRequestError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
	}
}

interface TelegramProfileDependencies {
	verifyTelegramInitData?: typeof verifyTelegramInitData;
	telegramProfileData?: typeof telegramProfileData;
	upsertTelegramProfile?: typeof upsertTelegramProfile;
}

export type AuthenticateBody = (
	request: Request,
	body: Record<string, unknown>,
) => Promise<TelegramProfileData>;

export type AuthenticateHeader = (request: Request) => Promise<TelegramProfileData>;

export interface PublicationApiServices {
	repository: PublicationRepository;
	authenticateBody: AuthenticateBody;
	authenticateHeader: AuthenticateHeader;
	isAdmin(telegramId: string): boolean;
	notifySubmission?(publication: PublicationRecord): Promise<void>;
}

export function jsonResponse(
	body: Record<string, unknown>,
	status = 200,
	authenticated = false,
): Response {
	const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
	if (authenticated) headers.set("Cache-Control", "no-store");
	return new Response(JSON.stringify(body), { status, headers });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		throw new ApiRequestError(400, "Некорректный JSON.");
	}

	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new ApiRequestError(400, "Ожидается JSON-объект.");
	}
	return payload as Record<string, unknown>;
}

async function verifiedProfile(
	initData: string,
	dependencies: TelegramProfileDependencies,
): Promise<TelegramProfileData> {
	const verify = dependencies.verifyTelegramInitData ?? verifyTelegramInitData;
	const toProfile = dependencies.telegramProfileData ?? telegramProfileData;
	const upsert = dependencies.upsertTelegramProfile ?? upsertTelegramProfile;
	const verified = verify(initData);
	const profile = toProfile(verified.user);
	await upsert(profile);
	return profile;
}

export async function verifiedRequestProfile(
	request: Request,
	body: Record<string, unknown>,
	dependencies: TelegramProfileDependencies = {},
): Promise<TelegramProfileData> {
	void request;
	const initData = typeof body.initData === "string" ? body.initData : "";
	return verifiedProfile(initData, dependencies);
}

export async function verifiedAuthorizationProfile(
	request: Request,
	dependencies: TelegramProfileDependencies = {},
): Promise<TelegramProfileData> {
	const authorization = request.headers.get("Authorization") ?? "";
	const initData = authorization.startsWith("tma ") ? authorization.slice(4) : "";
	return verifiedProfile(initData, dependencies);
}

export function publicationInputFromBody(body: Record<string, unknown>): unknown {
	return {
		type: body.type,
		title: body.title,
		summary: body.summary,
		content: body.content,
		category: body.category,
		tags: body.tags,
	};
}

export function validatedPublicationInput(body: Record<string, unknown>): PublicationInput {
	const result = validatePublicationInput(publicationInputFromBody(body));
	if (!result.ok) throw new ApiRequestError(422, result.error);
	return result.value;
}

export function withoutAuthorTelegramId(publication: PublicationRecord): PublicPublication {
	const { authorTelegramId: _authorTelegramId, ...safePublication } = publication;
	return safePublication;
}

export function apiErrorResponse(error: unknown, authenticated = false): Response {
	if (error instanceof ApiRequestError) {
		return jsonResponse({ ok: false, error: error.message }, error.status, authenticated);
	}
	if (error instanceof TelegramAuthError) {
		return jsonResponse({ ok: false, error: error.message }, 401, true);
	}
	if (error instanceof PublicationRepositoryError) {
		const status = {
			not_found: 404,
			forbidden: 403,
			conflict: 409,
			validation: 422,
		}[error.code];
		return jsonResponse({ ok: false, error: error.message }, status, authenticated);
	}
	if (error instanceof AppwriteConfigError) {
		return jsonResponse({ ok: false, error: "Не настроены переменные Appwrite.", missing: error.missing }, 500, authenticated);
	}
	if (error instanceof AppwriteRequestError) {
		return jsonResponse({ ok: false, error: error.message, appwriteStatus: error.status }, 502, authenticated);
	}
	return jsonResponse({ ok: false, error: "Внутренняя ошибка сервера." }, 500, authenticated);
}

const repository: PublicationRepository = {
	createPublication,
	updatePublication,
	submitPublication,
	moderatePublication,
	listPublishedPublications,
	getPublicationForViewer,
	listAuthorPublications,
	getAdminAuthorOverview,
	listReviewQueue,
};

export const publicationApiServices: PublicationApiServices = {
	repository,
	authenticateBody: verifiedRequestProfile,
	authenticateHeader: verifiedAuthorizationProfile,
	isAdmin: isTelegramAdmin,
	notifySubmission: notifyAdminsAboutPublication,
};
