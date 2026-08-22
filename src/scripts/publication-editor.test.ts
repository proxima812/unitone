// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { renderPublicationMarkdown } from "../lib/publications/markdown";
import { formatSelection } from "./publication-editor";

describe("publication editor", () => {
	test("applies every approved inline format", () => {
		expect(formatSelection("Текст", 0, 5, "bold")).toEqual({
			value: "**Текст**",
			selectionStart: 2,
			selectionEnd: 7,
		});
		expect(formatSelection("Текст", 0, 5, "italic").value).toBe("*Текст*");
		expect(formatSelection("Текст", 0, 5, "link", "https://example.com").value).toBe("[Текст](https://example.com)");
	});

	test("leaves text unchanged for an unsupported format", () => {
		expect(formatSelection("Текст", 0, 5, "h2")).toEqual({
			value: "Текст",
			selectionStart: 0,
			selectionEnd: 5,
		});
		expect(formatSelection("Текст", 0, 5, "code")).toEqual({
			value: "Текст",
			selectionStart: 0,
			selectionEnd: 5,
		});
	});

	test("still renders lists and headings typed by hand as markdown", () => {
		expect(renderPublicationMarkdown("1. один\n1. два")).toBe("<ol><li>один</li><li>два</li></ol>");
	});
});
