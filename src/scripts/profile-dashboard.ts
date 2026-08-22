import { syncTelegramProfile, telegramWebApp, type TelegramProfileResponse } from "./telegram-profile";

const publicationStatuses = ["draft", "review", "published", "rejected"] as const;
const publicationTypes = ["material", "post", "tool", "experience"] as const;

type PublicationStatus = (typeof publicationStatuses)[number];
type PublicationType = (typeof publicationTypes)[number];

interface AuthorPublication {
	id: string;
	type: PublicationType;
	status: PublicationStatus;
	title: string;
	summary: string;
	moderationNote: string;
	updatedAt: string;
	publishedAt: string;
}

interface PublicationsResponse {
	ok: true;
	publications: AuthorPublication[];
}

interface ErrorResponse {
	ok: false;
	error: string;
}

const statusLabels: Record<PublicationStatus, string> = {
	draft: "Черновик",
	review: "На проверке",
	published: "Опубликовано",
	rejected: "На доработке",
};

const typeLabels: Record<PublicationType, string> = {
	material: "Материалы",
	post: "Посты",
	tool: "Инструменты",
	experience: "Личный опыт",
};

const publicPaths: Record<PublicationType, string> = {
	material: "materials",
	post: "posts",
	tool: "tools",
	experience: "experience",
};

function isPublicationStatus(value: unknown): value is PublicationStatus {
	return typeof value === "string" && publicationStatuses.includes(value as PublicationStatus);
}

function isPublicationType(value: unknown): value is PublicationType {
	return typeof value === "string" && publicationTypes.includes(value as PublicationType);
}

function isAuthorPublication(value: unknown): value is AuthorPublication {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const publication = value as Record<string, unknown>;
	return typeof publication.id === "string"
		&& isPublicationType(publication.type)
		&& isPublicationStatus(publication.status)
		&& typeof publication.title === "string"
		&& typeof publication.summary === "string"
		&& typeof publication.moderationNote === "string"
		&& typeof publication.updatedAt === "string"
		&& typeof publication.publishedAt === "string";
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className?: string): HTMLElementTagNameMap[K] {
	const element = document.createElement(tag);
	element.textContent = value;
	if (className) element.className = className;
	return element;
}

function displayDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
}

function profileInitials(profile: TelegramProfileResponse["profile"]): string {
	const initials = [profile.firstName, profile.lastName]
		.map((part) => part.trim().charAt(0))
		.filter(Boolean)
		.join("")
		.slice(0, 2);
	return (initials || profile.username.trim().charAt(0) || "?").toLocaleUpperCase("ru-RU");
}

function safeAvatarUrl(value: string): string | null {
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : null;
	} catch {
		return null;
	}
}

function renderProfile(root: HTMLElement, profile: TelegramProfileResponse["profile"]): void {
	const fullName = [profile.firstName, profile.lastName].map((part) => part.trim()).filter(Boolean).join(" ")
		|| (profile.username ? `@${profile.username}` : "Пользователь Telegram");
	const name = root.querySelector<HTMLElement>("[data-profile-name]");
	const username = root.querySelector<HTMLElement>("[data-profile-username]");
	const initials = root.querySelector<HTMLElement>("[data-profile-initials]");
	const avatar = root.querySelector<HTMLImageElement>("[data-profile-avatar]");
	const created = root.querySelector<HTMLElement>("[data-profile-created]");
	const updated = root.querySelector<HTMLElement>("[data-profile-updated]");
	const admin = root.querySelector<HTMLElement>("[data-profile-admin]");

	if (name) name.textContent = fullName;
	if (initials) initials.textContent = profileInitials(profile);
	if (created) created.textContent = displayDate(profile.createdAt);
	if (updated) updated.textContent = displayDate(profile.updatedAt);
	if (admin) admin.hidden = !profile.isAdmin;
	if (username) {
		username.textContent = profile.username ? `@${profile.username}` : "";
		username.hidden = !profile.username;
	}

	const avatarUrl = safeAvatarUrl(profile.photoUrl);
	if (avatar && initials && avatarUrl) {
		avatar.src = avatarUrl;
		avatar.alt = `Фото профиля ${fullName}`;
		avatar.hidden = false;
		initials.hidden = true;
		avatar.addEventListener("error", () => {
			avatar.hidden = true;
			initials.hidden = false;
		}, { once: true });
	}
}

function publicationHref(publication: AuthorPublication): string | null {
	if (publication.status === "draft" || publication.status === "rejected") {
		return `/app/create/${publication.type}/?id=${encodeURIComponent(publication.id)}`;
	}
	if (publication.status === "published") {
		return `/app/${publicPaths[publication.type]}/${encodeURIComponent(publication.id)}/`;
	}
	return null;
}

function publicationItem(publication: AuthorPublication): HTMLLIElement {
	const item = document.createElement("li");
	item.className = "border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900";
	const body = publicationHref(publication) ? document.createElement("a") : document.createElement("article");
	body.className = "block rounded-lg px-1 py-1 outline-none transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400";
	const href = publicationHref(publication);
	if (body instanceof HTMLAnchorElement && href) body.href = href;

	const heading = document.createElement("div");
	heading.className = "flex items-start justify-between gap-3";
	heading.append(
		text("h5", publication.title || "Без названия", "text-[0.9375rem] font-semibold leading-snug text-zinc-950 dark:text-zinc-50"),
		text("span", displayDate(publication.publishedAt || publication.updatedAt), "shrink-0 text-xs text-zinc-500 dark:text-zinc-400"),
	);
	body.append(heading);
	if (publication.summary) body.append(text("p", publication.summary, "mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"));
	if (publication.status === "rejected" && publication.moderationNote) {
		body.append(text("p", `Комментарий: ${publication.moderationNote}`, "mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"));
	}
	if (href) {
		body.append(text(
			"span",
			publication.status === "published" ? "Открыть →" : "Редактировать →",
			"mt-2 inline-block text-xs font-semibold text-blue-600 dark:text-blue-400",
		));
	} else if (publication.status === "review") {
		body.append(text("span", statusLabels.review, "mt-2 inline-block text-xs font-semibold text-zinc-500 dark:text-zinc-400"));
	}
	item.append(body);
	return item;
}

function renderPublications(root: HTMLElement, publications: AuthorPublication[]): void {
	for (const status of publicationStatuses) {
		const group = root.querySelector<HTMLElement>(`[data-status-group="${status}"]`);
		const count = group?.querySelector<HTMLElement>("[data-status-count]");
		const content = group?.querySelector<HTMLElement>("[data-status-content]");
		const statusPublications = publications.filter((publication) => publication.status === status);
		if (count) count.textContent = String(statusPublications.length);
		if (!content) continue;
		content.replaceChildren();

		if (statusPublications.length === 0) {
			content.append(text("p", "Пока нет публикаций", "py-3 text-sm text-zinc-500 dark:text-zinc-400"));
			continue;
		}

		for (const type of publicationTypes) {
			const typePublications = statusPublications.filter((publication) => publication.type === type);
			if (typePublications.length === 0) continue;
			const section = document.createElement("section");
			section.className = "pt-2 first:pt-0";
			section.append(text("h4", typeLabels[type], "pt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400"));
			const list = document.createElement("ul");
			list.append(...typePublications.map(publicationItem));
			section.append(list);
			content.append(section);
		}
	}
}

async function loadPublications(initData: string): Promise<AuthorPublication[]> {
	const response = await fetch("/api/profile/publications", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ initData }),
	});
	const payload = await response.json() as PublicationsResponse | ErrorResponse;
	if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Не удалось загрузить публикации." : payload.error);
	return payload.publications.filter(isAuthorPublication);
}

async function initializeDashboard(root: HTMLElement): Promise<void> {
	const loading = root.querySelector<HTMLElement>("[data-profile-loading]");
	const content = root.querySelector<HTMLElement>("[data-profile-content]");
	const error = root.querySelector<HTMLElement>("[data-profile-error]");
	const telegram = telegramWebApp();

	try {
		if (!telegram?.initData) throw new Error("Откройте приложение внутри Telegram, чтобы увидеть профиль.");
		const profileResponse = await syncTelegramProfile({ force: true });
		if (!profileResponse?.ok) throw new Error(profileResponse?.error || "Не удалось загрузить профиль.");
		const publications = await loadPublications(telegram.initData);
		renderProfile(root, profileResponse.profile);
		renderPublications(root, publications);
		if (loading) loading.hidden = true;
		if (content) content.hidden = false;
	} catch (caught) {
		if (loading) loading.hidden = true;
		if (error) {
			error.textContent = caught instanceof Error ? caught.message : "Не удалось загрузить профиль.";
			error.hidden = false;
		}
	}
}

document.querySelectorAll<HTMLElement>("[data-profile-dashboard]").forEach((root) => {
	void initializeDashboard(root);
});
