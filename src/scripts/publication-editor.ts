export const markdownFormats = [
	"h2",
	"h3",
	"bold",
	"italic",
	"link",
	"unordered-list",
	"ordered-list",
] as const;

export type MarkdownFormat = (typeof markdownFormats)[number];

export interface FormatResult {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

function isMarkdownFormat(action: string): action is MarkdownFormat {
	return markdownFormats.includes(action as MarkdownFormat);
}

function replaceSelection(
	value: string,
	selectionStart: number,
	selectionEnd: number,
	replacement: string,
	innerOffset = 0,
	innerLength = replacement.length,
): FormatResult {
	return {
		value: `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`,
		selectionStart: selectionStart + innerOffset,
		selectionEnd: selectionStart + innerOffset + innerLength,
	};
}

export function formatSelection(
	value: string,
	selectionStart: number,
	selectionEnd: number,
	action: string,
	linkUrl = "",
): FormatResult {
	if (!isMarkdownFormat(action)) return { value, selectionStart, selectionEnd };

	const selected = value.slice(selectionStart, selectionEnd);
	if (action === "bold" || action === "italic") {
		const marker = action === "bold" ? "**" : "*";
		return replaceSelection(value, selectionStart, selectionEnd, `${marker}${selected}${marker}`, marker.length, selected.length);
	}

	if (action === "link") {
		const url = linkUrl.trim();
		if (!url) return { value, selectionStart, selectionEnd };
		return replaceSelection(value, selectionStart, selectionEnd, `[${selected}](${url})`, 1, selected.length);
	}

	const lines = selected.split("\n");
	const prefix = action === "h2"
		? () => "## "
		: action === "h3"
			? () => "### "
			: action === "unordered-list"
				? () => "- "
				: (index: number) => `${index + 1}. `;
	const replacement = lines.map((line, index) => `${prefix(index)}${line}`).join("\n");
	return replaceSelection(value, selectionStart, selectionEnd, replacement);
}

export function applyMarkdownFormat(
	textarea: HTMLTextAreaElement,
	action: string,
	linkUrl = "",
): void {
	const result = formatSelection(
		textarea.value,
		textarea.selectionStart,
		textarea.selectionEnd,
		action,
		linkUrl,
	);

	textarea.value = result.value;
	textarea.focus();
	textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

if (typeof document !== "undefined") {
	document.querySelectorAll<HTMLElement>("[data-publication-editor]").forEach((editor) => {
		const textarea = editor.querySelector<HTMLTextAreaElement>("textarea[data-editor-content]");
		const linkInput = editor.querySelector<HTMLInputElement>("[data-link-url]");
		if (!textarea) return;

		editor.querySelectorAll<HTMLButtonElement>("button[data-format]").forEach((button) => {
			button.addEventListener("click", () => {
				applyMarkdownFormat(textarea, button.dataset.format ?? "", linkInput?.value ?? "");
				if (button.dataset.format === "link" && linkInput) linkInput.value = "";
			});
		});
	});
}
