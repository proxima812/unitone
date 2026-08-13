import { searchCatalog, suggestCatalog } from "@/lib/catalog/search";
import {
	clearSearchSession,
	readSearchSession,
	writeSearchSession,
	type SearchSessionState,
} from "@/lib/catalog/state";
import type { CatalogFilter, CatalogItem, TopicId } from "@/lib/catalog/types";

interface ExplorerData {
	mode: "communities" | "methods" | "global";
	items: CatalogItem[];
	filters: CatalogFilter[];
	filterParam: "topic" | "audience";
	topicFilters: CatalogFilter[];
	sessionPath: string;
	initialGroupLimit?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseExplorerData(explorer: HTMLElement): ExplorerData | undefined {
	const dataElement = explorer.nextElementSibling;
	if (!(dataElement instanceof HTMLScriptElement) || !dataElement.matches("script[type='application/json'][data-catalog-data]")) {
		return undefined;
	}

	try {
		const value: unknown = JSON.parse(dataElement.textContent ?? "");
		if (
			!isRecord(value)
			|| !["communities", "methods", "global"].includes(String(value.mode))
			|| !Array.isArray(value.items)
			|| !Array.isArray(value.filters)
			|| !Array.isArray(value.topicFilters)
			|| !["topic", "audience"].includes(String(value.filterParam))
			|| typeof value.sessionPath !== "string"
		) {
			return undefined;
		}

		return value as unknown as ExplorerData;
	} catch {
		return undefined;
	}
}

function getSessionStorage(): Storage | undefined {
	try {
		return window.sessionStorage;
	} catch {
		return undefined;
	}
}

function initCatalogResetPaths(root: ParentNode = document): void {
	const links = root instanceof Element && root.matches("[data-catalog-reset-path]")
		? [root as HTMLAnchorElement, ...root.querySelectorAll<HTMLAnchorElement>("[data-catalog-reset-path]")]
		: [...root.querySelectorAll<HTMLAnchorElement>("[data-catalog-reset-path]")];
	const storage = getSessionStorage();

	for (const link of links) {
		if (link.dataset.catalogResetInitialized === "true") continue;
		link.dataset.catalogResetInitialized = "true";
		link.addEventListener("click", (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const path = link.dataset.catalogResetPath;
			if (path) clearSearchSession(storage, path);
		});
	}
}

function replaceUrl(params: URLSearchParams): void {
	const query = params.toString();
	const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

	try {
		window.history.replaceState(window.history.state, "", nextUrl);
	} catch {
		// Search remains usable when history mutation is unavailable.
	}
}

function resolveUrlFilter(
	params: URLSearchParams,
	name: "topic" | "audience",
	allowedValues: ReadonlySet<string>,
	sessionValue: string | undefined,
): { value?: string; changed: boolean } {
	if (params.has(name)) {
		const incoming = params.get(name) ?? "";
		if (allowedValues.has(incoming)) {
			const changed = params.getAll(name).length > 1;
			if (changed) params.set(name, incoming);
			return { value: incoming, changed };
		}

		params.delete(name);
		return { changed: true };
	}

	if (sessionValue && allowedValues.has(sessionValue)) {
		params.set(name, sessionValue);
		return { value: sessionValue, changed: true };
	}

	return { changed: false };
}

function setUrlFilter(name: "topic" | "audience", value: string | undefined): void {
	const params = new URLSearchParams(window.location.search);
	if (value) params.set(name, value);
	else params.delete(name);
	replaceUrl(params);
}

function historyStateWithScroll(scrollY: number): Record<string, unknown> {
	const current = window.history.state;
	return isRecord(current) ? { ...current, scrollY } : { scrollY };
}

function initExplorer(explorer: HTMLElement): void {
	if (explorer.dataset.catalogInitialized === "true") return;

	const data = parseExplorerData(explorer);
	const input = explorer.querySelector<HTMLInputElement>("[data-catalog-search]");
	const clearQueryButton = explorer.querySelector<HTMLButtonElement>("[data-catalog-clear-query]");
	const count = explorer.querySelector<HTMLElement>("[data-catalog-count]");
	const emptyState = explorer.querySelector<HTMLElement>("[data-catalog-empty]");
	const emptyClearButton = explorer.querySelector<HTMLButtonElement>("[data-catalog-empty-clear]");
	const emptyShowAllButton = explorer.querySelector<HTMLButtonElement>("[data-catalog-empty-show-all]");
	const suggestions = explorer.querySelector<HTMLElement>("[data-catalog-suggestions]");
	const suggestionList = explorer.querySelector<HTMLUListElement>("[data-catalog-suggestion-list]");

	if (!data || !input || !clearQueryButton || !count || !emptyState || !emptyClearButton || !emptyShowAllButton || !suggestions || !suggestionList) {
		return;
	}
	const catalogData = data;
	const searchInput = input;
	const clearButton = clearQueryButton;
	const liveCount = count;
	const emptyPanel = emptyState;
	const emptyClear = emptyClearButton;
	const emptyShowAll = emptyShowAllButton;
	const suggestionPanel = suggestions;
	const suggestionItems = suggestionList;

	explorer.dataset.catalogInitialized = "true";

	const storage = getSessionStorage();
	const session = readSearchSession(storage, catalogData.sessionPath);
	const filterButtons = [...explorer.querySelectorAll<HTMLButtonElement>("[data-catalog-filter]")];
	const groupElements = [...explorer.querySelectorAll<HTMLElement>("[data-catalog-group]")];
	const rowsByKey = new Map(
		[...explorer.querySelectorAll<HTMLElement>("[data-catalog-item]")]
			.map((row) => [row.dataset.catalogItem ?? "", row] as const)
			.filter(([key]) => Boolean(key)),
	);
	const itemsByKey = new Map<string, CatalogItem>(catalogData.items.map((item) => [item.key, item]));
	const primaryFilterIds = new Set(catalogData.filters.map((filter) => filter.id));
	const topicFilterSource = catalogData.topicFilters.length > 0
		? catalogData.topicFilters
		: catalogData.filterParam === "topic" ? catalogData.filters : [];
	const topicFilterIds = new Set(topicFilterSource.map((filter) => filter.id));
	const topicLabels = new Map(topicFilterSource.map((filter) => [filter.id, filter.label]));
	const urlParams = new URLSearchParams(window.location.search);

	const topicResolution = resolveUrlFilter(urlParams, "topic", topicFilterIds, session?.topicId);
	const audienceResolution = catalogData.mode === "methods"
		? resolveUrlFilter(urlParams, "audience", primaryFilterIds, session?.audienceId)
		: { value: undefined, changed: false };
	if (topicResolution.changed || audienceResolution.changed) replaceUrl(urlParams);

	let query = session?.query ?? "";
	let topicId = topicResolution.value as TopicId | undefined;
	let audienceId = audienceResolution.value;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let restoredScroll = false;

	searchInput.value = query;

	function currentSessionState(scrollY = window.scrollY): SearchSessionState {
		return { query, scrollY, topicId, audienceId };
	}

	function saveState(scrollY = window.scrollY): void {
		writeSearchSession(storage, catalogData.sessionPath, currentSessionState(scrollY));
	}

	function updateFilterState(): void {
		const selectedId = catalogData.filterParam === "topic" ? topicId : audienceId;
		for (const button of filterButtons) {
			const selected = (button.dataset.catalogFilter ?? "") === (selectedId ?? "");
			button.setAttribute("aria-pressed", String(selected));
			for (const marker of button.querySelectorAll<HTMLElement>("[data-catalog-filter-check], [data-catalog-filter-state]")) {
				marker.hidden = !selected;
			}
		}
	}

	function updateTopicContext(): void {
		const context = explorer.querySelector<HTMLElement>("[data-catalog-topic-context]");
		const label = explorer.querySelector<HTMLElement>("[data-catalog-topic-label]");
		if (!context || !label) return;

		const topicLabel = topicId ? topicLabels.get(topicId) : undefined;
		context.hidden = !topicLabel;
		label.textContent = topicLabel ?? "";
	}

	function updateGlobalLinks(): void {
		if (catalogData.mode !== "global") return;

		for (const link of explorer.querySelectorAll<HTMLAnchorElement>("[data-catalog-show-all-link]")) {
			const sessionPath = link.dataset.sessionPath;
			if (!sessionPath) continue;

			const target = new URL(sessionPath, window.location.origin);
			if (topicId) target.searchParams.set("topic", topicId);
			link.href = `${target.pathname}${target.search}`;
		}
	}

	function renderSuggestions(): void {
		suggestionItems.replaceChildren();
		const normalizedQuery = query.trim();
		if (!normalizedQuery) {
			suggestionPanel.hidden = true;
			return;
		}

		const candidates = searchCatalog(catalogData.items, {
			kind: catalogData.mode === "communities" ? "community" : catalogData.mode === "methods" ? "method" : undefined,
			topicId,
			audienceId,
		}).map((result) => result.item);
		const suggestedItems = suggestCatalog(candidates, normalizedQuery, 3);

		for (const { item } of suggestedItems) {
			const listItem = document.createElement("li");
			const link = document.createElement("a");
			link.href = item.href;
			link.dataset.catalogResultLink = "";
			link.className = "flex min-h-11 items-center rounded-lg py-2 font-semibold text-blue-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:focus-visible:ring-blue-400";
			link.textContent = item.title;
			listItem.append(link);
			suggestionItems.append(listItem);
		}

		suggestionPanel.hidden = suggestedItems.length === 0;
	}

	function renderGroup(group: HTMLElement, resultKeys: string[], globalActive: boolean): void {
		const kind = group.dataset.catalogGroup;
		const list = group.querySelector<HTMLElement>("[data-catalog-list]");
		if (!kind || !list) return;

		const matchingKeys = resultKeys.filter((key) => itemsByKey.get(key)?.kind === kind);
		const configuredLimit = catalogData.initialGroupLimit;
		const limit = catalogData.mode === "global"
			? typeof configuredLimit === "number" && Number.isFinite(configuredLimit) && configuredLimit > 0
				? Math.min(5, Math.floor(configuredLimit))
				: 5
			: matchingKeys.length;
		const visibleKeys = matchingKeys.slice(0, limit);

		for (const row of list.querySelectorAll<HTMLElement>("[data-catalog-item]")) row.hidden = true;
		for (const key of visibleKeys) {
			const row = rowsByKey.get(key);
			if (!row) continue;
			row.hidden = false;
			list.append(row);
		}

		const groupCount = group.querySelector<HTMLElement>("[data-catalog-group-count]");
		if (groupCount) groupCount.textContent = String(matchingKeys.length);
		group.hidden = catalogData.mode === "global" ? !globalActive || matchingKeys.length === 0 : false;
	}

	function render(): void {
		const globalActive = catalogData.mode !== "global" || Boolean(query.trim() || topicId);
		const results = globalActive
			? searchCatalog(catalogData.items, {
				kind: catalogData.mode === "communities" ? "community" : catalogData.mode === "methods" ? "method" : undefined,
				query,
				topicId,
				audienceId,
			})
			: [];
		const resultKeys = results.map((result) => result.item.key);

		for (const group of groupElements) renderGroup(group, resultKeys, globalActive);

		clearButton.hidden = query.length === 0;
		updateFilterState();
		updateTopicContext();
		updateGlobalLinks();

		if (catalogData.mode === "global" && !globalActive) {
			liveCount.textContent = "Введите запрос или выберите тему";
			emptyPanel.hidden = true;
			suggestionPanel.hidden = true;
			return;
		}

		liveCount.textContent = `Найдено: ${results.length}`;
		emptyPanel.hidden = results.length > 0;
		if (results.length === 0) renderSuggestions();
		else suggestionPanel.hidden = true;
	}

	function clearQuery(): void {
		if (debounceTimer) clearTimeout(debounceTimer);
		query = "";
		searchInput.value = "";
		render();
		saveState();
		searchInput.focus();
	}

	searchInput.addEventListener("input", () => {
		query = searchInput.value;
		clearButton.hidden = query.length === 0;
		saveState();
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(render, 150);
	});

	clearButton.addEventListener("click", clearQuery);
	emptyClear.addEventListener("click", clearQuery);

	for (const button of filterButtons) {
		button.addEventListener("click", () => {
			const value = button.dataset.catalogFilter || undefined;
			if (catalogData.filterParam === "topic") topicId = value as TopicId | undefined;
			else audienceId = value;
			setUrlFilter(catalogData.filterParam, value);
			render();
			saveState();
		});
	}

	explorer.querySelector<HTMLButtonElement>("[data-catalog-clear-topic]")?.addEventListener("click", () => {
		topicId = undefined;
		setUrlFilter("topic", undefined);
		render();
		saveState();
	});

	emptyShowAll.addEventListener("click", () => {
		if (debounceTimer) clearTimeout(debounceTimer);
		query = "";
		topicId = undefined;
		audienceId = undefined;
		searchInput.value = "";
		const params = new URLSearchParams(window.location.search);
		params.delete("topic");
		if (catalogData.mode === "methods") params.delete("audience");
		replaceUrl(params);
		clearSearchSession(storage, catalogData.sessionPath);
		render();
		searchInput.focus();
	});

	explorer.addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;

		const resultLink = event.target.closest<HTMLAnchorElement>("[data-catalog-result-link]");
		if (resultLink && explorer.contains(resultLink)) {
			const scrollY = window.scrollY;
			saveState(scrollY);
			try {
				window.history.replaceState(historyStateWithScroll(scrollY), "", window.location.href);
			} catch {
				// Navigation continues when history state is unavailable.
			}
			return;
		}

		const showAllLink = event.target.closest<HTMLAnchorElement>("[data-catalog-show-all-link]");
		const targetPath = showAllLink?.dataset.sessionPath;
		if (catalogData.mode === "global" && showAllLink && targetPath && explorer.contains(showAllLink)) {
			writeSearchSession(storage, targetPath, { query, scrollY: 0, topicId });
		}
	});

	render();
	if (!restoredScroll && session) {
		restoredScroll = true;
		window.requestAnimationFrame(() => {
			window.scrollTo({ top: session.scrollY, left: 0, behavior: "auto" });
		});
	}
}

export function initCatalogExplorers(root: ParentNode = document): void {
	const explorers = root instanceof Element && root.matches("[data-catalog-explorer]")
		? [root as HTMLElement, ...root.querySelectorAll<HTMLElement>("[data-catalog-explorer]")]
		: [...root.querySelectorAll<HTMLElement>("[data-catalog-explorer]")];

	for (const explorer of explorers) initExplorer(explorer);
	initCatalogResetPaths(root);
}

initCatalogExplorers();
