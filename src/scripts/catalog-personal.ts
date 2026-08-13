import { clearRecent, readPersonalState, recordRecent, toggleFavorite, type PersonalState } from "@/lib/catalog/state";
import type { CatalogKey } from "@/lib/catalog/types";

interface PersonalItem {
	key: CatalogKey;
	title: string;
	description: string;
	href: string;
	kind: "community" | "method";
}

const catalogKeyPattern = /^(community|method):.+$/u;
let listenersReady = false;
let currentState: PersonalState;

function getLocalStorage(): Storage | undefined {
	try {
		return window.localStorage;
	} catch {
		return undefined;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPersonalItem(value: unknown): value is PersonalItem {
	return isRecord(value)
		&& typeof value.key === "string"
		&& catalogKeyPattern.test(value.key)
		&& typeof value.title === "string"
		&& typeof value.description === "string"
		&& typeof value.href === "string"
		&& (value.kind === "community" || value.kind === "method");
}

function readItemMap(): Map<CatalogKey, PersonalItem> {
	const items = new Map<CatalogKey, PersonalItem>();
	for (const source of document.querySelectorAll<HTMLScriptElement>("[data-personal-items], [data-catalog-data]")) {
		try {
			const parsed: unknown = JSON.parse(source.textContent ?? "");
			const values = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : [];
			for (const value of values) {
				if (isPersonalItem(value)) items.set(value.key, value);
			}
		} catch {
			// Invalid embedded data simply leaves the corresponding item unavailable.
		}
	}
	return items;
}

function setStatus(message: string): void {
	for (const status of document.querySelectorAll<HTMLElement>("[data-personal-status]")) {
		status.textContent = message;
		status.hidden = !message;
	}
}

function updateFavoriteButtons(state: PersonalState): void {
	const favorites = new Set(state.favorites);
	for (const button of document.querySelectorAll<HTMLButtonElement>("[data-favorite-toggle]")) {
		const key = button.dataset.itemKey as CatalogKey | undefined;
		const label = button.dataset.favoriteLabel ?? "этот материал";
		if (!key || !catalogKeyPattern.test(key)) continue;
		const selected = favorites.has(key);
		button.setAttribute("aria-pressed", String(selected));
		button.setAttribute("aria-label", `${selected ? "Удалить" : "Добавить"} «${label}» ${selected ? "из" : "в"} избранного`);
		button.querySelector<HTMLElement>("[data-favorite-icon='outline']")?.toggleAttribute("hidden", selected);
		button.querySelector<HTMLElement>("[data-favorite-icon='filled']")?.toggleAttribute("hidden", !selected);
		const text = button.querySelector<HTMLElement>("[data-favorite-text]");
		if (text) text.textContent = selected ? "В избранном" : "В избранное";
	}
}

function createRow(template: HTMLTemplateElement, item: PersonalItem, includeFavorite: boolean): DocumentFragment {
	const fragment = template.content.cloneNode(true) as DocumentFragment;
	const link = fragment.querySelector<HTMLAnchorElement>("[data-personal-result-link]");
	if (link) {
		link.href = item.href;
		link.dataset.personalItemKey = item.key;
	}
	const title = fragment.querySelector<HTMLElement>("[data-personal-title]");
	if (title) title.textContent = item.title;
	const description = fragment.querySelector<HTMLElement>("[data-personal-description]");
	if (description) description.textContent = item.description;
	const favorite = fragment.querySelector<HTMLButtonElement>("[data-favorite-toggle]");
	if (favorite && includeFavorite) {
		favorite.dataset.itemKey = item.key;
		favorite.dataset.favoriteLabel = item.title;
		favorite.setAttribute("aria-label", `Добавить «${item.title}» в избранное`);
	} else {
		favorite?.remove();
	}
	return fragment;
}

function renderPersonalContent(state: PersonalState, itemsByKey: Map<CatalogKey, PersonalItem>): void {
	for (const list of document.querySelectorAll<HTMLElement>("[data-personal-list]")) {
		const kind = list.dataset.personalList;
		if (kind !== "favorites" && kind !== "recent") continue;
		const sourceKeys = kind === "favorites" ? state.favorites : state.recent.map((entry) => entry.key);
		const limit = Number.parseInt(list.dataset.personalLimit ?? "", 10);
		const visibleItems = sourceKeys
			.map((key) => itemsByKey.get(key))
			.filter((item): item is PersonalItem => Boolean(item))
			.slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);
		const section = list.closest<HTMLElement>("[data-personal-section]");
		const template = section?.querySelector<HTMLTemplateElement>("[data-personal-row-template]")
			?? list.parentElement?.querySelector<HTMLTemplateElement>("[data-personal-row-template]");
		list.replaceChildren();
		if (template) for (const item of visibleItems) list.append(createRow(template, item, kind === "favorites"));
		if (section) section.hidden = visibleItems.length === 0;
		const allFavorites = section?.querySelector<HTMLElement>("[data-personal-all-favorites]");
		if (allFavorites) allFavorites.hidden = kind !== "favorites" || sourceKeys.filter((key) => itemsByKey.has(key)).length <= 4;
	}

	for (const page of document.querySelectorAll<HTMLElement>("[data-personal-favorites-page]")) {
		const list = page.querySelector<HTMLElement>("[data-personal-list='favorites']");
		const template = page.querySelector<HTMLTemplateElement>("[data-personal-row-template]");
		const empty = page.querySelector<HTMLElement>("[data-personal-empty]");
		if (!list || !template || !empty) continue;
		const favorites = state.favorites.map((key) => itemsByKey.get(key)).filter((item): item is PersonalItem => Boolean(item));
		list.replaceChildren(...favorites.map((item) => createRow(template, item, true)));
		empty.hidden = favorites.length > 0;
		list.hidden = favorites.length === 0;
	}
	updateFavoriteButtons(state);
}

function broadcast(state: PersonalState): void {
	window.dispatchEvent(new CustomEvent<PersonalState>("unityone:personal-state", { detail: state }));
}

function trackViews(storage: Storage | undefined, itemsByKey: Map<CatalogKey, PersonalItem>): void {
	const keys = new Set<CatalogKey>();
	for (const tracker of document.querySelectorAll<HTMLElement>("[data-view-tracker]")) {
		const key = tracker.dataset.viewTracker as CatalogKey | undefined;
		if (key && catalogKeyPattern.test(key)) keys.add(key);
	}

	for (const key of keys) {
		const result = recordRecent(storage, key, Date.now());
		if (result.persisted) currentState = result.value;
		renderPersonalContent(currentState, itemsByKey);
		broadcast(currentState);
	}
}

function init(): void {
	const storage = getLocalStorage();
	const itemsByKey = readItemMap();
	currentState = readPersonalState(storage);
	renderPersonalContent(currentState, itemsByKey);
	trackViews(storage, itemsByKey);

	if (listenersReady) return;
	listenersReady = true;
	document.addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;
		const favorite = event.target.closest<HTMLButtonElement>("[data-favorite-toggle]");
		if (favorite) {
			const key = favorite.dataset.itemKey as CatalogKey | undefined;
			if (!key || !catalogKeyPattern.test(key)) return;
			const before = currentState;
			const result = toggleFavorite(storage, key);
			currentState = result.persisted ? result.value : before;
			renderPersonalContent(currentState, itemsByKey);
			if (!result.persisted) setStatus("Не удалось сохранить избранное в этом браузере.");
			else setStatus("");
			broadcast(currentState);
			return;
		}

		const clearButton = event.target.closest<HTMLButtonElement>("[data-clear-recent]");
		if (clearButton) {
			const before = currentState;
			const result = clearRecent(storage);
			currentState = result.persisted ? result.value : before;
			renderPersonalContent(currentState, itemsByKey);
			if (!result.persisted) setStatus("Не удалось очистить историю в этом браузере.");
			else setStatus("");
			broadcast(currentState);
			return;
		}

		const resultLink = event.target.closest<HTMLAnchorElement>("[data-catalog-result-link], [data-personal-result-link]");
		if (!resultLink) return;
		const row = resultLink.closest<HTMLElement>("[data-catalog-item]");
		const key = (row?.dataset.catalogItem ?? resultLink.dataset.personalItemKey) as CatalogKey | undefined;
		if (!key || !itemsByKey.has(key)) return;
		const result = recordRecent(storage, key, Date.now());
		if (result.persisted) {
			currentState = result.value;
			renderPersonalContent(currentState, itemsByKey);
			broadcast(currentState);
		}
	});

	window.addEventListener("unityone:personal-state", (event) => {
		if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") return;
		currentState = event.detail as PersonalState;
		renderPersonalContent(currentState, itemsByKey);
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
