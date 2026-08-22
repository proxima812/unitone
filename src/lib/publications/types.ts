export const publicationTypes = ["material", "post", "tool", "experience"] as const;
export const publicationStatuses = ["draft", "review", "published", "rejected"] as const;

export type PublicationType = (typeof publicationTypes)[number];
export type PublicationStatus = (typeof publicationStatuses)[number];
export type PublicationActor = "author" | "admin";

export interface PublicationInput {
	type: PublicationType;
	title: string;
	summary: string;
	content: string;
	category: string;
	tags: string[];
}

export interface PublicationRecord extends PublicationInput {
	id: string;
	status: PublicationStatus;
	authorTelegramId: string;
	authorName: string;
	authorUsername: string;
	authorPhotoUrl: string;
	moderationNote: string;
	createdAt: string;
	updatedAt: string;
	submittedAt: string;
	publishedAt: string;
}

export type PublicPublication = Omit<PublicationRecord, "authorTelegramId">;
