export const markdownFormats = [
	"bold",
	"italic",
	"link",
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

	const url = linkUrl.trim();
	if (!url) return { value, selectionStart, selectionEnd };
	return replaceSelection(value, selectionStart, selectionEnd, `[${selected}](${url})`, 1, selected.length);
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
		const toolbar = editor.querySelector<HTMLElement>("[data-selection-toolbar]");
		const defaultActions = editor.querySelector<HTMLElement>("[data-default-actions]");
		const linkPanel = editor.querySelector<HTMLElement>("[data-link-panel]");
		const linkInput = editor.querySelector<HTMLInputElement>("[data-link-url]");
		const openLinkButton = editor.querySelector<HTMLButtonElement>("[data-open-link]");
		const applyLinkButton = editor.querySelector<HTMLButtonElement>("[data-apply-link]");
		if (!textarea || !toolbar || !defaultActions || !linkPanel) return;

		function showDefaultActions(): void {
			toolbar!.hidden = false;
			defaultActions!.hidden = false;
			linkPanel!.hidden = true;
		}

		function hideToolbar(): void {
			toolbar!.hidden = true;
			defaultActions!.hidden = false;
			linkPanel!.hidden = true;
			if (linkInput) linkInput.value = "";
		}

		function syncToolbarToSelection(): void {
			if (!linkPanel!.hidden) return;
			if (textarea!.selectionStart === textarea!.selectionEnd) {
				hideToolbar();
				return;
			}
			showDefaultActions();
		}

		textarea.addEventListener("select", syncToolbarToSelection);
		textarea.addEventListener("keyup", syncToolbarToSelection);
		textarea.addEventListener("mouseup", syncToolbarToSelection);
		textarea.addEventListener("touchend", syncToolbarToSelection);
		textarea.addEventListener("blur", () => {
			window.setTimeout(() => {
				if (!editor.contains(document.activeElement)) hideToolbar();
			}, 0);
		});

		defaultActions.querySelectorAll<HTMLButtonElement>("button[data-format]").forEach((button) => {
			button.addEventListener("click", () => {
				applyMarkdownFormat(textarea, button.dataset.format ?? "");
				// The formatted text stays selected, so keep the popup open on the default actions.
				showDefaultActions();
			});
		});

		openLinkButton?.addEventListener("click", () => {
			defaultActions.hidden = true;
			linkPanel!.hidden = false;
			linkInput?.focus();
		});

		applyLinkButton?.addEventListener("click", () => {
			applyMarkdownFormat(textarea, "link", linkInput?.value ?? "");
			if (linkInput) linkInput.value = "";
			showDefaultActions();
		});

		linkInput?.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				applyLinkButton?.click();
			}
		});
	});
}
