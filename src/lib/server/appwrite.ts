import { randomUUID } from "node:crypto";
import type { PublicationRecord } from "../publications/types";
import type { PublicationTransport } from "./publications";

interface AppwriteBaseConfig {
	endpoint: string;
	projectId: string;
	apiKey: string;
	databaseId: string;
}

interface ProfileConfig extends AppwriteBaseConfig {
	profilesCollectionId: string;
}

interface CommunityProposalConfig extends AppwriteBaseConfig {
	communityProposalsCollectionId: string;
}

interface PublicationConfig extends AppwriteBaseConfig {
	publicationsCollectionId: string;
}

export interface TelegramProfileData {
	telegramId: string;
	firstName: string;
	lastName: string;
	username: string;
	languageCode: string;
	photoUrl: string;
	isPremium: boolean;
}

export interface TelegramProfileDocument extends TelegramProfileData {
	createdAt: string;
	updatedAt: string;
	source: string;
}

export interface CommunityProposalData {
	title: string;
	description: string;
	category: string;
	since: string;
	website: string;
	finderUrl: string;
	notes: string;
}

export class AppwriteConfigError extends Error {
	constructor(public readonly missing: string[]) {
		super(`Missing Appwrite environment variables: ${missing.join(", ")}`);
	}
}

export class AppwriteRequestError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code?: string,
	) {
		super(message);
	}
}

function env(name: string): string | undefined {
	const value = process.env[name] ?? import.meta.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstEnv(...names: string[]): string | undefined {
	for (const name of names) {
		const value = env(name);
		if (value) return value;
	}
	return undefined;
}

function requireConfig<T extends Record<string, string | undefined>>(values: T): { [K in keyof T]: string } {
	const missing = Object.entries(values)
		.filter(([, value]) => !value)
		.map(([key]) => key);

	if (missing.length > 0) throw new AppwriteConfigError(missing);

	return values as { [K in keyof T]: string };
}

function readBaseConfig(): AppwriteBaseConfig {
	return requireConfig({
		endpoint: firstEnv("APPWRITE_ENDPOINT", "API_ENDPOINT"),
		projectId: firstEnv("APPWRITE_PROJECT_ID", "PROJECT_ID"),
		apiKey: firstEnv("APPWRITE_API_KEY", "API_SECRET"),
		databaseId: firstEnv("APPWRITE_DATABASE_ID", "DATABASE_ID"),
	});
}

function readProfileConfig(): ProfileConfig {
	return {
		...readBaseConfig(),
		...requireConfig({
			profilesCollectionId: firstEnv("APPWRITE_TELEGRAM_PROFILES_COLLECTION_ID", "APPWRITE_PROFILES_COLLECTION_ID", "TELEGRAM_PROFILES_COLLECTION_ID"),
		}),
	};
}

function readCommunityProposalConfig(): CommunityProposalConfig {
	return {
		...readBaseConfig(),
		...requireConfig({
			communityProposalsCollectionId: firstEnv("APPWRITE_COMMUNITY_PROPOSALS_COLLECTION_ID", "COMMUNITY_PROPOSALS_COLLECTION_ID"),
		}),
	};
}

function readPublicationConfig(): PublicationConfig {
	return {
		...readBaseConfig(),
		...requireConfig({
			publicationsCollectionId: firstEnv("APPWRITE_PUBLICATIONS_COLLECTION_ID", "PUBLICATIONS_COLLECTION_ID"),
		}),
	};
}

function appwriteBaseUrl(endpoint: string): string {
	const base = endpoint.replace(/\/+$/u, "");
	return base.endsWith("/v1") ? base : `${base}/v1`;
}

function profileDocumentId(telegramId: string): string {
	return `tg_${telegramId}`.replace(/[^A-Za-z0-9._-]/gu, "_").slice(0, 36);
}

async function appwriteFetch<T>(config: AppwriteBaseConfig, path: string, init: RequestInit = {}): Promise<T> {
	const response = await fetch(`${appwriteBaseUrl(config.endpoint)}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			"X-Appwrite-Project": config.projectId,
			"X-Appwrite-Key": config.apiKey,
			...init.headers,
		},
	});

	if (!response.ok) {
		let message = `Appwrite request failed with ${response.status}`;
		let code: string | undefined;
		try {
			const payload = await response.json() as { message?: string; type?: string };
			if (payload.message) message = payload.message;
			code = payload.type;
		} catch {
			// Keep the HTTP-level message when Appwrite returns a non-JSON response.
		}
		throw new AppwriteRequestError(message, response.status, code);
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

export async function upsertTelegramProfile(profile: TelegramProfileData): Promise<TelegramProfileDocument> {
	const config = readProfileConfig();
	const documentId = profileDocumentId(profile.telegramId);
	const data = {
		telegramId: profile.telegramId,
		firstName: profile.firstName,
		lastName: profile.lastName,
		username: profile.username,
		languageCode: profile.languageCode,
		photoUrl: profile.photoUrl,
		isPremium: profile.isPremium,
		updatedAt: new Date().toISOString(),
		source: "telegram-mini-app",
	};
	const path = `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(config.profilesCollectionId)}/documents`;
	const documentPath = `${path}/${encodeURIComponent(documentId)}`;

	try {
		return await appwriteFetch<TelegramProfileDocument>(config, documentPath, {
			method: "PATCH",
			body: JSON.stringify({ data }),
		});
	} catch (error) {
		if (!(error instanceof AppwriteRequestError) || error.status !== 404) throw error;
		return appwriteFetch<TelegramProfileDocument>(config, path, {
			method: "POST",
			body: JSON.stringify({
				documentId,
				data: {
					...data,
					createdAt: data.updatedAt,
				},
			}),
		});
	}
}

export interface CommunityProposalDocument extends CommunityProposalData {
	id: string;
	telegramId: string;
	telegramUsername: string;
	telegramFirstName: string;
	telegramLastName: string;
	telegramChannelMessageId: string;
}

function communityProposalsDocumentsPath(config: CommunityProposalConfig): string {
	return `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(config.communityProposalsCollectionId)}/documents`;
}

function communityProposalFromDocument(document: Record<string, unknown> & { $id: string }): CommunityProposalDocument {
	return {
		id: document.$id,
		title: String(document.title ?? ""),
		description: String(document.description ?? ""),
		category: String(document.category ?? ""),
		since: String(document.since ?? ""),
		website: String(document.website ?? ""),
		finderUrl: String(document.finderUrl ?? ""),
		notes: String(document.notes ?? ""),
		telegramId: String(document.telegramId ?? ""),
		telegramUsername: String(document.telegramUsername ?? ""),
		telegramFirstName: String(document.telegramFirstName ?? ""),
		telegramLastName: String(document.telegramLastName ?? ""),
		telegramChannelMessageId: String(document.telegramChannelMessageId ?? ""),
	};
}

export async function createCommunityProposal(profile: TelegramProfileData, proposal: CommunityProposalData): Promise<string> {
	const config = readCommunityProposalConfig();
	const documentId = randomUUID();
	const now = new Date().toISOString();

	await appwriteFetch(config, communityProposalsDocumentsPath(config), {
		method: "POST",
		body: JSON.stringify({
			documentId,
			data: {
				type: "community",
				status: "new",
				title: proposal.title,
				description: proposal.description,
				category: proposal.category,
				since: proposal.since,
				website: proposal.website,
				finderUrl: proposal.finderUrl,
				notes: proposal.notes,
				telegramId: profile.telegramId,
				telegramUsername: profile.username,
				telegramFirstName: profile.firstName,
				telegramLastName: profile.lastName,
				createdAt: now,
				updatedAt: now,
				source: "telegram-mini-app",
			},
		}),
	});

	return documentId;
}

export async function getCommunityProposal(id: string): Promise<CommunityProposalDocument | null> {
	const config = readCommunityProposalConfig();
	try {
		const document = await appwriteFetch<Record<string, unknown> & { $id: string }>(
			config,
			`${communityProposalsDocumentsPath(config)}/${encodeURIComponent(id)}`,
		);
		return communityProposalFromDocument(document);
	} catch (error) {
		if (error instanceof AppwriteRequestError && error.status === 404) return null;
		throw error;
	}
}

export async function setCommunityProposalChannelMessage(id: string, messageId: string): Promise<void> {
	const config = readCommunityProposalConfig();
	await appwriteFetch(config, `${communityProposalsDocumentsPath(config)}/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify({ data: { telegramChannelMessageId: messageId } }),
	});
}

export async function deleteCommunityProposal(id: string): Promise<void> {
	const config = readCommunityProposalConfig();
	await appwriteFetch(config, `${communityProposalsDocumentsPath(config)}/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
}

type AppwritePublicationDocument = Omit<PublicationRecord, "id"> & {
	$id: string;
};

const publicationPageSize = 25;

function publicationFromDocument(document: AppwritePublicationDocument): PublicationRecord {
	return {
		id: document.$id,
		type: document.type,
		status: document.status,
		title: document.title,
		summary: document.summary,
		content: document.content,
		category: document.category,
		tags: document.tags,
		authorTelegramId: document.authorTelegramId,
		authorName: document.authorName,
		authorUsername: document.authorUsername,
		authorPhotoUrl: document.authorPhotoUrl,
		moderationNote: document.moderationNote,
		telegramChannelMessageId: document.telegramChannelMessageId ?? "",
		createdAt: document.createdAt,
		updatedAt: document.updatedAt,
		submittedAt: document.submittedAt,
		publishedAt: document.publishedAt,
	};
}

export function createAppwritePublicationTransport(): PublicationTransport {
	const config = readPublicationConfig();
	const documentsPath = `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(config.publicationsCollectionId)}/documents`;

	return {
		async create(data) {
			const document = await appwriteFetch<AppwritePublicationDocument>(config, documentsPath, {
				method: "POST",
				body: JSON.stringify({ documentId: randomUUID(), data }),
			});
			return publicationFromDocument(document);
		},

		async get(id) {
			try {
				const document = await appwriteFetch<AppwritePublicationDocument>(config, `${documentsPath}/${encodeURIComponent(id)}`);
				return publicationFromDocument(document);
			} catch (error) {
				if (error instanceof AppwriteRequestError && error.status === 404) return null;
				throw error;
			}
		},

		async update(id, data) {
			const document = await appwriteFetch<AppwritePublicationDocument>(config, `${documentsPath}/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify({ data }),
			});
			return publicationFromDocument(document);
		},

		async remove(id) {
			await appwriteFetch<void>(config, `${documentsPath}/${encodeURIComponent(id)}`, { method: "DELETE" });
		},

		async list(queries) {
			const documents: AppwritePublicationDocument[] = [];
			const documentIds = new Set<string>();
			let cursor: string | undefined;

			while (true) {
				const params = new URLSearchParams();
				for (const query of queries) params.append("queries[]", query);
				params.append("queries[]", JSON.stringify({ method: "limit", values: [publicationPageSize] }));
				if (cursor) params.append("queries[]", JSON.stringify({ method: "cursorAfter", values: [cursor] }));

				const result = await appwriteFetch<{ total: number; documents: AppwritePublicationDocument[] }>(
					config,
					`${documentsPath}?${params.toString()}`,
				);
				for (const document of result.documents) {
					if (!documentIds.has(document.$id)) {
						documentIds.add(document.$id);
						documents.push(document);
					}
				}

				if (result.documents.length < publicationPageSize || documents.length >= result.total) break;
				const nextCursor = result.documents.at(-1)?.$id;
				if (!nextCursor || nextCursor === cursor) {
					throw new AppwriteRequestError("Appwrite pagination cursor did not advance.", 502, "pagination_cursor_stalled");
				}
				cursor = nextCursor;
			}

			return documents.map(publicationFromDocument);
		},
	};
}
