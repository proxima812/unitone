// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { validatePublicationInput, validateStatusTransition } from "./validation";

describe("publication validation", () => {
	test("accepts category and tags only for posts", () => {
		expect(validatePublicationInput({ type: "post", title: "Заголовок", summary: "Кратко", content: "## Текст", category: "Практика", tags: ["шаги"] }).ok).toBe(true);
		expect(validatePublicationInput({ type: "tool", title: "Инструмент", summary: "Кратко", content: "## Текст", category: "Практика", tags: [] })).toEqual({ ok: false, error: "Категории и теги доступны только для постов." });
	});

	test("allows only the approved moderation transitions", () => {
		expect(validateStatusTransition("author", "draft", "review")).toBe(true);
		expect(validateStatusTransition("admin", "review", "published")).toBe(true);
		expect(validateStatusTransition("author", "review", "draft")).toBe(false);
	});
});
