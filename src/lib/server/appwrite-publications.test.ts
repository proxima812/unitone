// @ts-nocheck
import { afterEach, describe, expect, test } from "bun:test";
import { createAppwritePublicationTransport } from "./appwrite";

const originalFetch = globalThis.fetch;
const appwriteEnvironment = [
	"APPWRITE_ENDPOINT",
	"APPWRITE_PROJECT_ID",
	"APPWRITE_API_KEY",
	"APPWRITE_DATABASE_ID",
	"APPWRITE_PUBLICATIONS_COLLECTION_ID",
] as const;
const originalEnvironment = Object.fromEntries(
	appwriteEnvironment.map((name) => [name, process.env[name]]),
);

afterEach(() => {
	globalThis.fetch = originalFetch;
	for (const name of appwriteEnvironment) {
		const value = originalEnvironment[name];
		if (value === undefined) delete process.env[name];
		else process.env[name] = value;
	}
});

function appwritePublication(index: number) {
	const suffix = String(index).padStart(2, "0");
	return {
		$id: `document-${suffix}`,
		type: "post",
		status: "published",
		title: `Публикация ${suffix}`,
		summary: `Описание ${suffix}`,
		content: `## Текст ${suffix}`,
		category: "Опыт",
		tags: ["шаги"],
		authorTelegramId: "100",
		authorName: "Alice Author",
		authorUsername: "alice",
		authorPhotoUrl: "https://example.com/alice.jpg",
		moderationNote: "",
		createdAt: "2026-08-22T00:00:00.000Z",
		updatedAt: "2026-08-22T00:00:00.000Z",
		submittedAt: "2026-08-22T00:00:00.000Z",
		publishedAt: `2026-08-22T00:${suffix}:00.000Z`,
	};
}

describe("Appwrite publication transport", () => {
	test("returns more than the default page in order without duplicates", async () => {
		process.env.APPWRITE_ENDPOINT = "https://appwrite.example/v1";
		process.env.APPWRITE_PROJECT_ID = "project";
		process.env.APPWRITE_API_KEY = "secret";
		process.env.APPWRITE_DATABASE_ID = "database";
		process.env.APPWRITE_PUBLICATIONS_COLLECTION_ID = "publications";

		const documents = Array.from({ length: 52 }, (_, index) => appwritePublication(index + 1));
		const requestedPages: string[][] = [];
		globalThis.fetch = async (input) => {
			const url = new URL(String(input));
			const queries = url.searchParams.getAll("queries[]");
			requestedPages.push(queries);
			const cursorQuery = queries.find((query) => query.startsWith("cursorAfter("));
			const cursor = cursorQuery ? JSON.parse(cursorQuery.slice("cursorAfter(".length, -1)) : null;
			const start = cursor === null
				? 0
				: documents.findIndex((document) => document.$id === cursor) + 1;

			return Response.json({
				total: documents.length,
				documents: documents.slice(start, start + 25),
			});
		};

		const transport = createAppwritePublicationTransport();
		const publications = await transport.list(['orderAsc("publishedAt")']);

		expect(publications.map((publication) => publication.id)).toEqual(
			documents.map((document) => document.$id),
		);
		expect(new Set(publications.map((publication) => publication.id)).size).toBe(52);
		expect(requestedPages).toHaveLength(3);
	});
});
