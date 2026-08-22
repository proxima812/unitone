// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { renderPublicationMarkdown } from "./markdown";

describe("restricted publication markdown", () => {
	test("renders the supported syntax", () => {
		const html = renderPublicationMarkdown("## Раздел\n\n**жирный** и *курсив*\n\n- один\n- два");
		expect(html).toContain("<h2>Раздел</h2>");
		expect(html).toContain("<strong>жирный</strong>");
		expect(html).toContain("<em>курсив</em>");
		expect(html).toContain("<ul>");
	});

	test("rejects html, images, and unsafe links", () => {
		expect(() => renderPublicationMarkdown("<script>alert(1)</script>")).toThrow("HTML не поддерживается");
		expect(() => renderPublicationMarkdown("![alt](https://example.com/a.jpg)")).toThrow("Изображения не поддерживаются");
		expect(() => renderPublicationMarkdown("[опасно](javascript:alert(1))")).toThrow("Недопустимая ссылка");
	});
});
