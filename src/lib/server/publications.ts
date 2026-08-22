import type {
	PublicationInput,
	PublicationRecord,
	PublicationStatus,
	PublicationType,
	PublicPublication,
} from "../publications/types";
import { validatePublicationInput, validateStatusTransition } from "../publications/validation";
import { createAppwritePublicationTransport, type TelegramProfileData } from "./appwrite";

export interface PublicationTransport {
	create(data: Omit<PublicationRecord, "id">): Promise<PublicationRecord>;
	get(id: string): Promise<PublicationRecord | null>;
	update(id: string, data: Partial<PublicationRecord>): Promise<PublicationRecord>;
	list(queries: string[]): Promise<PublicationRecord[]>;
}

export type PublicationRepositoryErrorCode = "not_found" | "forbidden" | "conflict" | "validation";

export class PublicationRepositoryError extends Error {
	constructor(
		public readonly code: PublicationRepositoryErrorCode,
		message: string,
	) {
		super(message);
	}
}

export interface PublishedPublicationFilters {
	type?: PublicationType;
	category?: string;
	tag?: string;
}

export interface AdminAuthorOverview {
	telegramId: string;
	name: string;
	username: string;
	photoUrl: string;
	publications: PublicationRecord[];
}

export interface PublicationRepository {
	createPublication(profile: TelegramProfileData, input: PublicationInput): Promise<PublicationRecord>;
	updatePublication(id: string, telegramId: string, input: PublicationInput): Promise<PublicationRecord>;
	submitPublication(id: string, telegramId: string): Promise<PublicationRecord>;
	moderatePublication(id: string, action: "published" | "rejected", note: string): Promise<PublicationRecord>;
	listPublishedPublications(filters?: PublishedPublicationFilters): Promise<PublicPublication[]>;
	getPublicationForViewer(id: string, telegramId?: string): Promise<PublicPublication | null>;
	listAuthorPublications(telegramId: string): Promise<PublicationRecord[]>;
	getAdminAuthorOverview(telegramId: string): Promise<AdminAuthorOverview | null>;
	listReviewQueue(): Promise<PublicationRecord[]>;
}

function repositoryError(code: PublicationRepositoryErrorCode, message: string): never {
	throw new PublicationRepositoryError(code, message);
}

function queryEqual(attribute: string, value: string): string {
	return `equal(${JSON.stringify(attribute)},${JSON.stringify([value])})`;
}

function queryOrder(direction: "Asc" | "Desc", attribute: string): string {
	return `order${direction}(${JSON.stringify(attribute)})`;
}

function publicPublication(record: PublicationRecord): PublicPublication {
	const { authorTelegramId: _authorTelegramId, ...publication } = record;
	return publication;
}

function normalizedInput(input: PublicationInput): PublicationInput {
	const validation = validatePublicationInput(input);
	if (!validation.ok) return repositoryError("validation", validation.error);
	return validation.value;
}

async function requiredPublication(transport: PublicationTransport, id: string): Promise<PublicationRecord> {
	const publication = await transport.get(id);
	if (!publication) return repositoryError("not_found", "Публикация не найдена.");
	return publication;
}

function requireOwner(publication: PublicationRecord, telegramId: string): void {
	if (publication.authorTelegramId !== telegramId) {
		repositoryError("forbidden", "Нет доступа к этой публикации.");
	}
}

function requireTransition(actor: "author" | "admin", from: PublicationStatus, to: PublicationStatus): void {
	if (!validateStatusTransition(actor, from, to)) {
		repositoryError("conflict", "Публикация недоступна для этого действия.");
	}
}

export function createPublicationRepository(transport: PublicationTransport): PublicationRepository {
	return {
		async createPublication(profile, input) {
			const publication = normalizedInput(input);
			const now = new Date().toISOString();
			return transport.create({
				...publication,
				status: "draft",
				authorTelegramId: profile.telegramId,
				authorName: [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim(),
				authorUsername: profile.username,
				authorPhotoUrl: profile.photoUrl,
				moderationNote: "",
				createdAt: now,
				updatedAt: now,
				submittedAt: "",
				publishedAt: "",
			});
		},

		async updatePublication(id, telegramId, input) {
			const current = await requiredPublication(transport, id);
			requireOwner(current, telegramId);
			if (current.status !== "draft" && current.status !== "rejected") {
				return repositoryError("conflict", "Отправленную или опубликованную запись нельзя редактировать.");
			}

			return transport.update(id, {
				...normalizedInput(input),
				status: "draft",
				updatedAt: new Date().toISOString(),
			});
		},

		async submitPublication(id, telegramId) {
			const current = await requiredPublication(transport, id);
			requireOwner(current, telegramId);
			if (current.status === "review") return current;
			requireTransition("author", current.status, "review");

			const now = new Date().toISOString();
			return transport.update(id, {
				status: "review",
				moderationNote: "",
				submittedAt: now,
				updatedAt: now,
			});
		},

		async moderatePublication(id, action, note) {
			const current = await requiredPublication(transport, id);
			if (current.status === action) return current;
			requireTransition("admin", current.status, action);

			const moderationNote = note.trim();
			if (action === "rejected" && !moderationNote) {
				return repositoryError("validation", "Укажите комментарий модератора.");
			}
			if (moderationNote.length > 1_000) {
				return repositoryError("validation", "Комментарий модератора не должен быть длиннее 1000 символов.");
			}

			const now = new Date().toISOString();
			return transport.update(id, {
				status: action,
				moderationNote: action === "rejected" ? moderationNote : "",
				publishedAt: action === "published" ? now : "",
				updatedAt: now,
			});
		},

		async listPublishedPublications(filters = {}) {
			const queries = [queryEqual("status", "published")];
			if (filters.type) queries.push(queryEqual("type", filters.type));
			if (filters.category?.trim()) queries.push(queryEqual("category", filters.category.trim()));
			if (filters.tag?.trim()) queries.push(queryEqual("tags", filters.tag.trim()));
			queries.push(queryOrder("Desc", "publishedAt"));

			const publications = await transport.list(queries);
			return publications
				.filter((publication) => publication.status === "published")
				.map(publicPublication);
		},

		async getPublicationForViewer(id, telegramId) {
			const publication = await transport.get(id);
			if (!publication) return null;
			if (publication.status !== "published" && publication.authorTelegramId !== telegramId) return null;
			return publicPublication(publication);
		},

		async listAuthorPublications(telegramId) {
			return transport.list([
				queryEqual("authorTelegramId", telegramId),
				queryOrder("Desc", "updatedAt"),
			]);
		},

		async getAdminAuthorOverview(telegramId) {
			const publications = await transport.list([
				queryEqual("authorTelegramId", telegramId),
				queryOrder("Desc", "updatedAt"),
			]);
			const latest = publications[0];
			if (!latest) return null;
			return {
				telegramId,
				name: latest.authorName,
				username: latest.authorUsername,
				photoUrl: latest.authorPhotoUrl,
				publications,
			};
		},

		async listReviewQueue() {
			return transport.list([
				queryEqual("status", "review"),
				queryOrder("Asc", "submittedAt"),
			]);
		},
	};
}

function configuredRepository(): PublicationRepository {
	return createPublicationRepository(createAppwritePublicationTransport());
}

export function createPublication(profile: TelegramProfileData, input: PublicationInput) {
	return configuredRepository().createPublication(profile, input);
}

export function updatePublication(id: string, telegramId: string, input: PublicationInput) {
	return configuredRepository().updatePublication(id, telegramId, input);
}

export function submitPublication(id: string, telegramId: string) {
	return configuredRepository().submitPublication(id, telegramId);
}

export function moderatePublication(id: string, action: "published" | "rejected", note: string) {
	return configuredRepository().moderatePublication(id, action, note);
}

export function listPublishedPublications(filters: PublishedPublicationFilters = {}) {
	return configuredRepository().listPublishedPublications(filters);
}

export function getPublicationForViewer(id: string, telegramId?: string) {
	return configuredRepository().getPublicationForViewer(id, telegramId);
}

export function listAuthorPublications(telegramId: string) {
	return configuredRepository().listAuthorPublications(telegramId);
}

export function getAdminAuthorOverview(telegramId: string) {
	return configuredRepository().getAdminAuthorOverview(telegramId);
}

export function listReviewQueue() {
	return configuredRepository().listReviewQueue();
}
