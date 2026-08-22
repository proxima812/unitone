// @ts-nocheck
import { describe, expect, test } from "bun:test";
import type { PublicationRecord } from "./types";
import { buildPostFacets, filterPublishedPosts } from "./catalog";

function publication(overrides: Partial<PublicationRecord> = {}): PublicationRecord {
	return {
		id: "publication-1",
		type: "post",
		status: "published",
		title: "Заголовок",
		summary: "Краткое описание",
		content: "Текст",
		category: "Практика",
		tags: ["шаги"],
		authorTelegramId: "123456",
		authorName: "Автор",
		authorUsername: "author",
		authorPhotoUrl: "",
		moderationNote: "",
		createdAt: "2026-08-20T10:00:00.000Z",
		updatedAt: "2026-08-21T10:00:00.000Z",
		submittedAt: "2026-08-21T11:00:00.000Z",
		publishedAt: "2026-08-22T10:00:00.000Z",
		...overrides,
	};
}

describe("buildPostFacets", () => {
	test("derives sorted unique non-blank facets only from published posts", () => {
		const records = [
			publication({ id: "1", category: " Практика ", tags: ["шаги", " ", "группа"] }),
			publication({ id: "2", category: "Опыт", tags: ["группа", "шаги"] }),
			publication({ id: "3", status: "draft", category: "Черновик", tags: ["скрыто"] }),
			publication({ id: "4", type: "material", category: "Материал", tags: ["не пост"] }),
		];

		expect(buildPostFacets(records)).toEqual({
			categories: ["Опыт", "Практика"],
			tags: ["группа", "шаги"],
		});
	});
});

describe("filterPublishedPosts", () => {
	test("matches one trimmed category and one trimmed tag while excluding non-public records", () => {
		const matching = publication({ id: "matching", category: "Практика", tags: ["группа", "шаги"] });
		const records = [
			matching,
			publication({ id: "wrong-tag", category: "Практика", tags: ["шаги"] }),
			publication({ id: "draft", status: "draft", category: "Практика", tags: ["группа"] }),
			publication({ id: "material", type: "material", category: "Практика", tags: ["группа"] }),
		];

		expect(filterPublishedPosts(records, { category: " Практика ", tag: " группа " })).toEqual([matching]);
	});

	test("returns all published posts when both filters are blank", () => {
		const first = publication({ id: "first" });
		const second = publication({ id: "second", category: "Опыт", tags: [] });

		expect(filterPublishedPosts([first, publication({ id: "draft", status: "draft" }), second], { category: "", tag: " " })).toEqual([
			first,
			second,
		]);
	});
});
