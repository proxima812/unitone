export {};

type PublicationType = "material" | "post" | "tool" | "experience";
type EditableStatus = "draft" | "rejected";

interface DraftFields {
	title: string;
	summary: string;
	content: string;
	category: string;
	tags: string;
}

interface EditablePublication {
	id: string;
	type: PublicationType;
	status: EditableStatus;
	title: string;
	summary: string;
	content: string;
	category: string;
	tags: string[];
	moderationNote: string;
}

interface PublicationTelegramWebApp {
	initData?: string;
	HapticFeedback?: {
		notificationOccurred?: (type: "success" | "error") => void;
	};
}

interface PublicationTelegramWindow {
	Telegram?: {
		WebApp?: PublicationTelegramWebApp;
	};
}

const publicationTypes = ["material", "post", "tool", "experience"] as const;

function isPublicationType(value: string): value is PublicationType {
	return publicationTypes.includes(value as PublicationType);
}

function isEditablePublication(value: unknown): value is EditablePublication {
	if (!value || typeof value !== "object") return false;
	const publication = value as Record<string, unknown>;
	return typeof publication.id === "string"
		&& typeof publication.type === "string"
		&& isPublicationType(publication.type)
		&& (publication.status === "draft" || publication.status === "rejected")
		&& typeof publication.title === "string"
		&& typeof publication.summary === "string"
		&& typeof publication.content === "string"
		&& typeof publication.category === "string"
		&& Array.isArray(publication.tags)
		&& publication.tags.every((tag) => typeof tag === "string")
		&& typeof publication.moderationNote === "string";
}

function isDraftFields(value: unknown): value is DraftFields {
	if (!value || typeof value !== "object") return false;
	const fields = value as Record<string, unknown>;
	return ["title", "summary", "content", "category", "tags"].every((key) => typeof fields[key] === "string");
}

function responseError(value: unknown, fallback: string): string {
	if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return value.error;
	return fallback;
}

document.querySelectorAll<HTMLFormElement>("[data-publication-form]").forEach((form) => {
	const rawType = form.dataset.publicationType ?? "";
	if (!isPublicationType(rawType)) return;

	const type = rawType;
	let publicationId = form.dataset.publicationId?.trim() ?? "";
	const statusElement = form.querySelector<HTMLElement>("[data-publication-status]");
	const saveButton = form.querySelector<HTMLButtonElement>("[data-save-draft]");
	const submitButton = form.querySelector<HTMLButtonElement>("[data-submit-review]");
	const titleInput = form.elements.namedItem("title") as HTMLInputElement | null;
	const summaryInput = form.elements.namedItem("summary") as HTMLTextAreaElement | null;
	const contentInput = form.elements.namedItem("content") as HTMLTextAreaElement | null;
	const categoryInput = form.elements.namedItem("category") as HTMLInputElement | null;
	const tagsInput = form.elements.namedItem("tags") as HTMLInputElement | null;
	let userChangedFields = false;

	if (!saveButton || !submitButton || !titleInput || !summaryInput || !contentInput) return;
	const readySaveButton = saveButton;
	const readySubmitButton = submitButton;
	const readyTitleInput = titleInput;
	const readySummaryInput = summaryInput;
	const readyContentInput = contentInput;

	const telegram = (window as unknown as PublicationTelegramWindow).Telegram?.WebApp;
	const sessionKey = () => `twelve-steps.publication-draft:${type}:${publicationId || "new"}`;

	function setStatus(message: string, tone: "neutral" | "error" | "success" = "neutral"): void {
		if (!statusElement) return;
		statusElement.textContent = message;
		statusElement.dataset.tone = tone;
		statusElement.hidden = !message;
	}

	function setBusy(busy: boolean): void {
		readySaveButton.disabled = busy;
		readySubmitButton.disabled = busy;
		form.setAttribute("aria-busy", String(busy));
	}

	function fields(): DraftFields {
		return {
			title: readyTitleInput.value,
			summary: readySummaryInput.value,
			content: readyContentInput.value,
			category: type === "post" ? categoryInput?.value ?? "" : "",
			tags: type === "post" ? tagsInput?.value ?? "" : "",
		};
	}

	function applyFields(value: DraftFields): void {
		readyTitleInput.value = value.title;
		readySummaryInput.value = value.summary;
		readyContentInput.value = value.content;
		if (categoryInput) categoryInput.value = value.category;
		if (tagsInput) tagsInput.value = value.tags;
	}

	function persistFields(): void {
		try {
			window.sessionStorage.setItem(sessionKey(), JSON.stringify(fields()));
		} catch {
			// The form remains usable when browser storage is unavailable.
		}
	}

	function restoreFields(): boolean {
		try {
			const stored = window.sessionStorage.getItem(sessionKey());
			if (!stored) return false;
			const parsed: unknown = JSON.parse(stored);
			if (!isDraftFields(parsed)) return false;
			applyFields(parsed);
			return true;
		} catch {
			return false;
		}
	}

	function clearStoredFields(key = sessionKey()): void {
		try {
			window.sessionStorage.removeItem(key);
		} catch {
			// A successful server save is still valid when browser storage is unavailable.
		}
	}

	function initData(): string {
		return telegram?.initData?.trim() ?? "";
	}

	function normalizedTags(): string[] | null {
		const unique = new Map<string, string>();
		for (const rawTag of fields().tags.split(",")) {
			const tag = rawTag.trim();
			if (!tag) continue;
			if (tag.length > 40) return null;
			const key = tag.toLocaleLowerCase();
			if (!unique.has(key)) unique.set(key, tag);
		}
		const tags = [...unique.values()];
		return tags.length <= 8 ? tags : null;
	}

	function requestBody(): Record<string, unknown> | null {
		const telegramInitData = initData();
		if (!telegramInitData) {
			setStatus("Откройте приложение внутри Telegram.", "error");
			return null;
		}

		const tags = normalizedTags();
		if (!tags) {
			setStatus("Добавьте не более 8 тегов длиной до 40 символов.", "error");
			return null;
		}

		const value = fields();
		return {
			initData: telegramInitData,
			type,
			title: value.title,
			summary: value.summary,
			content: value.content,
			category: value.category,
			tags,
		};
	}

	async function parseJson(response: Response): Promise<unknown> {
		try {
			return await response.json();
		} catch {
			return null;
		}
	}

	async function loadPublication(keepRecoveredFields: boolean): Promise<void> {
		if (!publicationId) return;
		const telegramInitData = initData();
		if (!telegramInitData) {
			setStatus("Откройте приложение внутри Telegram, чтобы загрузить черновик.", "error");
			return;
		}

		setBusy(true);
		setStatus("Загружаем черновик…");
		try {
			const response = await fetch("/api/profile/publications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ initData: telegramInitData }),
			});
			const result = await parseJson(response);
			if (!response.ok || !result || typeof result !== "object") {
				throw new Error(responseError(result, "Не удалось загрузить черновик."));
			}
			const publications = "publications" in result && Array.isArray(result.publications) ? result.publications : [];
			const publication = publications.find((item) => isEditablePublication(item) && item.id === publicationId);
			if (!isEditablePublication(publication) || publication.type !== type) {
				throw new Error("Этот черновик не найден или больше недоступен для редактирования.");
			}
			if (!keepRecoveredFields && !userChangedFields) {
				applyFields({
					title: publication.title,
					summary: publication.summary,
					content: publication.content,
					category: publication.category,
					tags: publication.tags.join(", "),
				});
			}
			const moderationMessage = publication.status === "rejected" && publication.moderationNote
				? `Комментарий модератора: ${publication.moderationNote}`
				: "Черновик загружен.";
			setStatus(moderationMessage, "success");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Не удалось загрузить черновик.", "error");
		} finally {
			setBusy(false);
		}
	}

	async function saveDraft(): Promise<string | null> {
		if (!form.reportValidity()) {
			setStatus("Заполните обязательные поля.", "error");
			return null;
		}
		const body = requestBody();
		if (!body) return null;

		const previousSessionKey = sessionKey();
		const editing = Boolean(publicationId);
		const endpoint = editing ? `/api/publications/${encodeURIComponent(publicationId)}` : "/api/publications";
		const response = await fetch(endpoint, {
			method: editing ? "PATCH" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const result = await parseJson(response);
		if (!response.ok || !result || typeof result !== "object" || !("publication" in result) || !isEditablePublication(result.publication)) {
			throw new Error(responseError(result, "Не удалось сохранить черновик."));
		}
		if (result.publication.type !== type) throw new Error("Сервер вернул другой тип публикации.");

		publicationId = result.publication.id;
		form.dataset.publicationId = publicationId;
		clearStoredFields(previousSessionKey);
		const url = new URL(window.location.href);
		url.searchParams.set("id", publicationId);
		window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
		return publicationId;
	}

	async function runSave(): Promise<void> {
		setBusy(true);
		setStatus("Сохраняем черновик…");
		try {
			const id = await saveDraft();
			if (!id) return;
			telegram?.HapticFeedback?.notificationOccurred?.("success");
			setStatus("Черновик сохранён.", "success");
		} catch (error) {
			telegram?.HapticFeedback?.notificationOccurred?.("error");
			setStatus(error instanceof Error ? error.message : "Не удалось сохранить черновик.", "error");
		} finally {
			setBusy(false);
		}
	}

	async function submitForReview(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		setBusy(true);
		setStatus("Сохраняем и отправляем на проверку…");
		try {
			const id = await saveDraft();
			if (!id) return;
			const telegramInitData = initData();
			if (!telegramInitData) throw new Error("Откройте приложение внутри Telegram.");
			const response = await fetch(`/api/publications/${encodeURIComponent(id)}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ initData: telegramInitData }),
			});
			const result = await parseJson(response);
			if (!response.ok || !result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
				throw new Error(responseError(result, "Не удалось отправить публикацию на проверку."));
			}
			clearStoredFields();
			telegram?.HapticFeedback?.notificationOccurred?.("success");
			window.location.assign("/app/profile/");
		} catch (error) {
			telegram?.HapticFeedback?.notificationOccurred?.("error");
			setStatus(error instanceof Error ? error.message : "Не удалось отправить публикацию на проверку.", "error");
		} finally {
			setBusy(false);
		}
	}

	const recovered = restoreFields();
	form.addEventListener("input", () => {
		userChangedFields = true;
		persistFields();
	});
	readySaveButton.addEventListener("click", () => void runSave());
	form.addEventListener("submit", (event) => void submitForReview(event));
	void loadPublication(recovered);
});
