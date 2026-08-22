// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { renderPublicationMarkdown } from "../lib/publications/markdown";
import { formatSelection } from "./publication-editor";

describe("publication editor", () => {
	test("applies every approved inline and heading format", () => {
		expect(formatSelection("Текст", 0, 5, "bold")).toEqual({
			value: "**Текст**",
			selectionStart: 2,
			selectionEnd: 7,
		});
		expect(formatSelection("Текст", 0, 5, "italic").value).toBe("*Текст*");
		expect(formatSelection("Текст", 0, 5, "h2").value).toBe("## Текст");
		expect(formatSelection("Текст", 0, 5, "h3").value).toBe("### Текст");
		expect(formatSelection("Текст", 0, 5, "link", "https://example.com").value).toBe("[Текст](https://example.com)");
	});

	test("prefixes every selected line for approved lists", () => {
		expect(formatSelection("один\nдва", 0, 8, "unordered-list").value).toBe("- один\n- два");
		expect(formatSelection("один\nдва", 0, 8, "ordered-list").value).toBe("1. один\n1. два");
	});

	test("produces one rendered ordered list with every selected line", () => {
		const formatted = formatSelection("один\nдва", 0, 8, "ordered-list").value;
		expect(renderPublicationMarkdown(formatted)).toBe("<ol><li>один</li><li>два</li></ol>");
	});

	test("leaves text unchanged for an unsupported format", () => {
		expect(formatSelection("Текст", 0, 5, "code")).toEqual({
			value: "Текст",
			selectionStart: 0,
			selectionEnd: 5,
		});
	});
});
