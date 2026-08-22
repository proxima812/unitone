import { renderPublicationMarkdown } from "../lib/publications/markdown";
import type { PublicationRecord, PublicationStatus, PublicationType } from "../lib/publications/types";
import { telegramWebApp } from "./telegram-profile";

interface SuccessResponse {
	ok: true;
}

interface QueueResponse extends SuccessResponse {
	publications: PublicationRecord[];
}

interface AuthorOverview {
	telegramId: string;
	name: string;
	username: string;
	photoUrl: string;
	publications: PublicationRecord[];
}

interface AuthorResponse extends SuccessResponse {
	author: AuthorOverview;
}

interface ErrorResponse {
	ok: false;
	error: string;
}

export interface ModerationResult {
	ok: boolean;
}

const publicationTypes = ["material", "post", "tool", "experience"] as const;
const publicationStatuses = ["draft", "review", "published", "rejected"] as const;

const typeLabels: Record<PublicationType, string> = {
	material: "Материал",
	post: "Пост",
	tool: "Инструмент",
	experience: "Личный опыт",
};

const statusLabels: Record<PublicationStatus, string> = {
	draft: "Черновик",
	review: "На проверке",
	published: "Опубликовано",
	rejected: "На доработке",
};

class AdminAccessError extends Error {}

export function applyModerationResult<T extends { id: string }>(
	queue: T[],
	id: string,
	result: ModerationResult,
): T[] {
	if (!result.ok || !queue.some((item) => item.id === id)) return queue;
	return queue.filter((item) => item.id !== id);
}

export function rejectionNoteError(note: string): string | null {
	const normalized = note.trim();
	if (!normalized) return "Укажите комментарий автору.";
	if (normalized.length > 1_000) return "Комментарий не должен быть длиннее 1000 символов.";
	return null;
}

function isPublicationType(value: unknown): value is PublicationType {
	return typeof value === "string" && publicationTypes.includes(value as PublicationType);
}

function isPublicationStatus(value: unknown): value is PublicationStatus {
	return typeof value === "string" && publicationStatuses.includes(value as PublicationStatus);
}

function isPublication(value: unknown): value is PublicationRecord {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const publication = value as Record<string, unknown>;
	return typeof publication.id === "string"
		&& isPublicationType(publication.type)
		&& isPublicationStatus(publication.status)
		&& typeof publication.title === "string"
		&& typeof publication.summary === "string"
		&& typeof publication.content === "string"
		&& typeof publication.category === "string"
		&& Array.isArray(publication.tags)
		&& publication.tags.every((tag) => typeof tag === "string")
		&& typeof publication.authorTelegramId === "string"
		&& typeof publication.authorName === "string"
		&& typeof publication.authorUsername === "string"
		&& typeof publication.authorPhotoUrl === "string"
		&& typeof publication.moderationNote === "string"
		&& typeof publication.createdAt === "string"
		&& typeof publication.updatedAt === "string"
		&& typeof publication.submittedAt === "string"
		&& typeof publication.publishedAt === "string";
}

function isAuthorOverview(value: unknown): value is AuthorOverview {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const author = value as Record<string, unknown>;
	return typeof author.telegramId === "string"
		&& typeof author.name === "string"
		&& typeof author.username === "string"
		&& typeof author.photoUrl === "string"
		&& Array.isArray(author.publications)
		&& author.publications.every(isPublication);
}

function displayDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Дата не указана";
	return new Intl.DateTimeFormat("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function safeAvatarUrl(value: string): string | null {
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : null;
	} catch {
		return null;
	}
}

function authorName(publication: PublicationRecord): string {
	return publication.authorName.trim()
		|| (publication.authorUsername.trim() ? `@${publication.authorUsername.trim()}` : "Участник сообщества");
}

function initials(value: string): string {
	return value
		.split(/\s+/u)
		.map((part) => part.charAt(0))
		.filter(Boolean)
		.join("")
		.slice(0, 2)
		.toLocaleUpperCase("ru-RU") || "?";
}

function text<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	value: string,
	className?: string,
): HTMLElementTagNameMap[K] {
	const element = document.createElement(tag);
	element.textContent = value;
	if (className) element.className = className;
	return element;
}

function setText(root: ParentNode, selector: string, value: string): void {
	const element = root.querySelector<HTMLElement>(selector);
	if (element) element.textContent = value;
}

function errorMessage(payload: unknown, fallback: string): string {
	if (payload && typeof payload === "object" && !Array.isArray(payload)) {
		const error = (payload as Partial<ErrorResponse>).error;
		if (typeof error === "string" && error.trim()) return error;
	}
	return fallback;
}

async function adminRequest<T>(url: string, initData: string, body: Record<string, unknown> = {}): Promise<T> {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ initData, ...body }),
	});

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}

	if (response.status === 403) throw new AdminAccessError("Нет доступа");
	if (!response.ok || !payload || typeof payload !== "object" || !("ok" in payload) || payload.ok !== true) {
		throw new Error(errorMessage(payload, "Не удалось выполнить запрос."));
	}
	return payload as T;
}

function setHidden(element: HTMLElement | null, hidden: boolean): void {
	if (element) element.hidden = hidden;
}

function showAccessDenied(root: HTMLElement): void {
	setHidden(root.querySelector("[data-authorization-state]"), true);
	setHidden(root.querySelector("[data-queue-error]"), true);
	setHidden(root.querySelector("[data-queue-content]"), true);
	setHidden(root.querySelector("[data-queue-count]"), true);
	setHidden(root.querySelector("[data-access-denied]"), false);
}

function setCardBusy(card: HTMLElement, busy: boolean): void {
	card.setAttribute("aria-busy", String(busy));
	card.classList.toggle("opacity-60", busy);
	for (const control of card.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>("button, textarea")) {
		control.disabled = busy;
	}
}

function showInlineError(card: HTMLElement, message: string): void {
	const error = card.querySelector<HTMLElement>("[data-action-error]");
	if (!error) return;
	error.textContent = message;
	error.hidden = false;
}

function clearInlineError(card: HTMLElement): void {
	const error = card.querySelector<HTMLElement>("[data-action-error]");
	if (error) {
		error.textContent = "";
		error.hidden = true;
	}
}

function renderAuthorPublications(list: HTMLElement, author: AuthorOverview, currentId: string): void {
	const publications = author.publications.filter((publication) => publication.id !== currentId);
	list.replaceChildren();
	if (publications.length === 0) {
		list.append(text("li", "Других записей пока нет.", "py-2 text-sm text-zinc-500 dark:text-zinc-400"));
		return;
	}

	for (const publication of publications) {
		const item = document.createElement("li");
		item.className = "py-2.5";
		const heading = document.createElement("div");
		heading.className = "flex items-start justify-between gap-3";
		heading.append(
			text("p", publication.title || "Без названия", "min-w-0 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100"),
			text("span", statusLabels[publication.status], "shrink-0 text-xs text-zinc-500 dark:text-zinc-400"),
		);
		item.append(
			heading,
			text("p", `${typeLabels[publication.type]} · ${displayDate(publication.updatedAt)}`, "mt-1 text-xs text-zinc-500 dark:text-zinc-400"),
		);
		list.append(item);
	}
}

async function loadAuthorPanel(
	root: HTMLElement,
	card: HTMLElement,
	publication: PublicationRecord,
	initData: string,
): Promise<void> {
	const panel = card.querySelector<HTMLElement>("[data-author-panel]");
	const loading = card.querySelector<HTMLElement>("[data-author-loading]");
	const error = card.querySelector<HTMLElement>("[data-author-error]");
	const content = card.querySelector<HTMLElement>("[data-author-content]");
	if (!panel || !loading || !error || !content) return;

	panel.hidden = false;
	loading.hidden = false;
	error.hidden = true;
	content.hidden = true;
	setCardBusy(card, true);

	try {
		const payload = await adminRequest<AuthorResponse>(
			`/api/admin/authors/${encodeURIComponent(publication.authorTelegramId)}`,
			initData,
		);
		if (!isAuthorOverview(payload.author)) throw new Error("Сервер вернул некорректные данные автора.");
		setText(content, "[data-author-profile-name]", payload.author.name.trim() || "Участник сообщества");
		setText(content, "[data-author-telegram-id]", `ID ${payload.author.telegramId}`);
		const username = content.querySelector<HTMLElement>("[data-author-profile-username]");
		if (username) {
			username.textContent = payload.author.username.trim() ? `@${payload.author.username.trim()}` : "Username не указан";
			username.hidden = false;
		}
		const list = content.querySelector<HTMLElement>("[data-author-publications]");
		if (list) renderAuthorPublications(list, payload.author, publication.id);
		panel.dataset.loaded = "true";
		content.hidden = false;
	} catch (caught) {
		if (caught instanceof AdminAccessError) {
			showAccessDenied(root);
			return;
		}
		error.textContent = caught instanceof Error ? caught.message : "Не удалось загрузить данные автора.";
		error.hidden = false;
	} finally {
		loading.hidden = true;
		setCardBusy(card, false);
	}
}

function bindAuthorPanel(root: HTMLElement, card: HTMLElement, publication: PublicationRecord, initData: string): void {
	const toggle = card.querySelector<HTMLButtonElement>("[data-author-toggle]");
	const panel = card.querySelector<HTMLElement>("[data-author-panel]");
	if (!toggle || !panel) return;
	const panelId = `moderation-author-${publication.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
	panel.id = panelId;
	toggle.setAttribute("aria-controls", panelId);

	toggle.addEventListener("click", () => {
		const opening = panel.hidden;
		panel.hidden = !opening;
		toggle.setAttribute("aria-expanded", String(opening));
		if (opening && panel.dataset.loaded !== "true") {
			void loadAuthorPanel(root, card, publication, initData);
		}
	});
}

function bindRejectPanel(card: HTMLElement): HTMLTextAreaElement | null {
	const toggle = card.querySelector<HTMLButtonElement>("[data-reject-toggle]");
	const panel = card.querySelector<HTMLElement>("[data-reject-panel]");
	const cancel = card.querySelector<HTMLButtonElement>("[data-reject-cancel]");
	const note = card.querySelector<HTMLTextAreaElement>("[data-rejection-note]");
	const count = card.querySelector<HTMLElement>("[data-note-count]");
	const noteError = card.querySelector<HTMLElement>("[data-note-error]");
	if (!toggle || !panel || !note) return null;
	const panelId = `moderation-reject-${card.dataset.publicationId?.replace(/[^a-zA-Z0-9_-]/g, "-") ?? "record"}`;
	panel.id = panelId;
	toggle.setAttribute("aria-controls", panelId);

	const setOpen = (open: boolean) => {
		panel.hidden = !open;
		toggle.setAttribute("aria-expanded", String(open));
		if (open) note.focus();
	};
	toggle.addEventListener("click", () => setOpen(panel.hidden));
	cancel?.addEventListener("click", () => setOpen(false));
	note.addEventListener("input", () => {
		if (count) count.textContent = `${note.value.length} / 1000`;
		if (noteError) {
			noteError.textContent = "";
			noteError.hidden = true;
		}
	});
	return note;
}

function renderSafeContent(card: HTMLElement, publication: PublicationRecord): void {
	const content = card.querySelector<HTMLElement>("[data-publication-content]");
	if (!content) return;
	try {
		content.innerHTML = renderPublicationMarkdown(publication.content);
	} catch {
		content.replaceChildren(text(
			"p",
			"Контент не прошёл безопасную проверку и не может быть показан.",
			"text-sm text-red-700 dark:text-red-300",
		));
	}
}

function fillAuthorDisplay(card: HTMLElement, publication: PublicationRecord): void {
	const name = authorName(publication);
	setText(card, "[data-author-name]", name);
	setText(card, "[data-author-initials]", initials(name));
	const username = card.querySelector<HTMLElement>("[data-author-username]");
	if (username && publication.authorUsername.trim()) {
		username.textContent = `@${publication.authorUsername.trim()}`;
		username.hidden = false;
	}

	const avatar = card.querySelector<HTMLImageElement>("[data-author-avatar]");
	const avatarInitials = card.querySelector<HTMLElement>("[data-author-initials]");
	const avatarUrl = safeAvatarUrl(publication.authorPhotoUrl);
	if (avatar && avatarInitials && avatarUrl) {
		avatar.src = avatarUrl;
		avatar.alt = `Фото автора ${name}`;
		avatar.hidden = false;
		avatarInitials.hidden = true;
		avatar.addEventListener("error", () => {
			avatar.hidden = true;
			avatarInitials.hidden = false;
		}, { once: true });
	}
}

function renderCard(
	root: HTMLElement,
	template: HTMLTemplateElement,
	publication: PublicationRecord,
	initData: string,
	onSuccess: (id: string, result: ModerationResult) => void,
): HTMLElement | null {
	const fragment = template.content.cloneNode(true) as DocumentFragment;
	const card = fragment.querySelector<HTMLElement>("[data-moderation-card]");
	if (!card) return null;
	card.dataset.publicationId = publication.id;
	setText(card, "[data-publication-type]", typeLabels[publication.type]);
	setText(card, "[data-publication-title]", publication.title || "Без названия");
	setText(card, "[data-publication-summary]", publication.summary);
	const submitted = card.querySelector<HTMLTimeElement>("[data-submitted-date]");
	if (submitted) {
		submitted.dateTime = publication.submittedAt;
		submitted.textContent = displayDate(publication.submittedAt);
	}
	fillAuthorDisplay(card, publication);
	renderSafeContent(card, publication);
	bindAuthorPanel(root, card, publication, initData);
	const note = bindRejectPanel(card);

	const moderate = async (action: "publish" | "reject") => {
		clearInlineError(card);
		const noteError = card.querySelector<HTMLElement>("[data-note-error]");
		if (action === "reject") {
			const validationError = rejectionNoteError(note?.value ?? "");
			if (validationError) {
				if (noteError) {
					noteError.textContent = validationError;
					noteError.hidden = false;
				}
				note?.focus();
				return;
			}
		}
		if (action === "publish" && !window.confirm(`Опубликовать «${publication.title}»?`)) return;

		setCardBusy(card, true);
		try {
			const result = await adminRequest<ModerationResult & SuccessResponse>(
				`/api/admin/publications/${encodeURIComponent(publication.id)}/${action}`,
				initData,
				action === "reject" ? { moderationNote: note?.value.trim() ?? "" } : {},
			);
			onSuccess(publication.id, result);
		} catch (caught) {
			if (caught instanceof AdminAccessError) {
				showAccessDenied(root);
				return;
			}
			showInlineError(card, caught instanceof Error ? caught.message : "Не удалось сохранить решение.");
			setCardBusy(card, false);
		}
	};

	card.querySelector<HTMLButtonElement>("[data-publish]")?.addEventListener("click", () => void moderate("publish"));
	card.querySelector<HTMLButtonElement>("[data-reject]")?.addEventListener("click", () => void moderate("reject"));
	return card;
}

function submittedTime(publication: PublicationRecord): number {
	const time = new Date(publication.submittedAt).getTime();
	return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

async function initializeModerationQueue(root: HTMLElement): Promise<void> {
	const authorization = root.querySelector<HTMLElement>("[data-authorization-state]");
	const denied = root.querySelector<HTMLElement>("[data-access-denied]");
	const error = root.querySelector<HTMLElement>("[data-queue-error]");
	const content = root.querySelector<HTMLElement>("[data-queue-content]");
	const empty = root.querySelector<HTMLElement>("[data-queue-empty]");
	const list = root.querySelector<HTMLUListElement>("[data-queue-list]");
	const count = root.querySelector<HTMLElement>("[data-queue-count]");
	const template = root.querySelector<HTMLTemplateElement>("[data-moderation-card-template]");
	const initData = telegramWebApp()?.initData.trim() ?? "";
	if (!authorization || !error || !content || !empty || !list || !count || !template) return;

	if (!initData) {
		authorization.hidden = true;
		error.textContent = "Откройте приложение внутри Telegram, чтобы проверить права администратора.";
		error.hidden = false;
		return;
	}

	try {
		const payload = await adminRequest<QueueResponse>("/api/admin/publications", initData);
		if (!Array.isArray(payload.publications) || !payload.publications.every(isPublication)) {
			throw new Error("Сервер вернул некорректную очередь модерации.");
		}
		let queue = payload.publications
			.filter((publication) => publication.status === "review")
			.sort((left, right) => submittedTime(left) - submittedTime(right));

		const updateQueueState = () => {
			count.textContent = String(queue.length);
			count.hidden = false;
			empty.hidden = queue.length !== 0;
			list.hidden = queue.length === 0;
		};
		const onSuccess = (id: string, result: ModerationResult) => {
			const nextQueue = applyModerationResult(queue, id, result);
			if (nextQueue === queue) return;
			queue = nextQueue;
			list.querySelector<HTMLElement>(`[data-publication-id="${CSS.escape(id)}"]`)?.remove();
			updateQueueState();
		};

		list.replaceChildren();
		for (const publication of queue) {
			const card = renderCard(root, template, publication, initData, onSuccess);
			if (card) list.append(card);
		}
		updateQueueState();
		authorization.hidden = true;
		if (denied) denied.hidden = true;
		error.hidden = true;
		content.hidden = false;
	} catch (caught) {
		authorization.hidden = true;
		if (caught instanceof AdminAccessError) {
			showAccessDenied(root);
			return;
		}
		error.textContent = caught instanceof Error ? caught.message : "Не удалось загрузить очередь модерации.";
		error.hidden = false;
	}
}

document.querySelectorAll<HTMLElement>("[data-moderation-queue]").forEach((root) => {
	void initializeModerationQueue(root);
});
