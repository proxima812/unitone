import { TOPICS } from "./taxonomy";
import type { CatalogKey, TopicId } from "./types";

export const PERSONAL_STATE_KEY = "unityone.catalog.v1";
export const SEARCH_SESSION_PREFIX = "unityone.search:";

export interface RecentEntry {
	key: CatalogKey;
	viewedAt: number;
}

export interface PersonalState {
	version: 1;
	favorites: CatalogKey[];
	recent: RecentEntry[];
}

export interface SearchSessionState {
	query: string;
	scrollY: number;
	topicId?: TopicId;
	audienceId?: string;
}

export interface StorageWriteResult<T> {
	value: T;
	persisted: boolean;
}

const catalogKeyPattern = /^(community|method):.+$/u;
const topicIds = new Set<string>(TOPICS.map((topic) => topic.id));

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCatalogKey(value: unknown): value is CatalogKey {
	return typeof value === "string" && catalogKeyPattern.test(value);
}

function emptyPersonalState(): PersonalState {
	return { version: 1, favorites: [], recent: [] };
}

function readJson(storage: Storage | null | undefined, key: string): unknown {
	if (!storage) return undefined;

	try {
		const value = storage.getItem(key);
		return value === null ? undefined : JSON.parse(value);
	} catch {
		return undefined;
	}
}

function writeJson<T>(storage: Storage | null | undefined, key: string, value: T): StorageWriteResult<T> {
	if (!storage) return { value, persisted: false };

	try {
		storage.setItem(key, JSON.stringify(value));
		return { value, persisted: true };
	} catch {
		return { value, persisted: false };
	}
}

function uniqueCatalogKeys(values: unknown): CatalogKey[] {
	if (!Array.isArray(values)) return [];

	const keys = new Set<CatalogKey>();
	for (const value of values) {
		if (isCatalogKey(value)) keys.add(value);
	}
	return [...keys];
}

function validRecentEntries(values: unknown): RecentEntry[] {
	if (!Array.isArray(values)) return [];

	const seen = new Set<CatalogKey>();
	const entries: RecentEntry[] = [];
	for (const value of values) {
		if (!isRecord(value) || !isCatalogKey(value.key) || typeof value.viewedAt !== "number" || !Number.isFinite(value.viewedAt)) {
			continue;
		}
		if (seen.has(value.key)) continue;
		seen.add(value.key);
		entries.push({ key: value.key, viewedAt: value.viewedAt });
	}
	return entries.slice(0, 8);
}

function parsePersonalState(value: unknown): PersonalState {
	if (!isRecord(value) || value.version !== 1) return emptyPersonalState();

	return {
		version: 1,
		favorites: uniqueCatalogKeys(value.favorites),
		recent: validRecentEntries(value.recent),
	};
}

function parseSearchSession(value: unknown): SearchSessionState | undefined {
	if (!isRecord(value) || typeof value.query !== "string" || typeof value.scrollY !== "number" || !Number.isFinite(value.scrollY) || value.scrollY < 0) {
		return undefined;
	}

	const state: SearchSessionState = { query: value.query, scrollY: value.scrollY };
	if (typeof value.topicId === "string" && topicIds.has(value.topicId)) {
		state.topicId = value.topicId as TopicId;
	}
	if (typeof value.audienceId === "string" && value.audienceId.trim()) {
		state.audienceId = value.audienceId;
	}
	return state;
}

function searchSessionKey(pathname: string): string {
	return `${SEARCH_SESSION_PREFIX}${pathname}`;
}

export function readPersonalState(storage: Storage | null | undefined): PersonalState {
	return parsePersonalState(readJson(storage, PERSONAL_STATE_KEY));
}

export function toggleFavorite(storage: Storage | null | undefined, key: CatalogKey): StorageWriteResult<PersonalState> {
	const state = readPersonalState(storage);
	const favorites = state.favorites.includes(key) ? state.favorites.filter((favorite) => favorite !== key) : [...state.favorites, key];
	return writeJson(storage, PERSONAL_STATE_KEY, { ...state, favorites });
}

export function recordRecent(storage: Storage | null | undefined, key: CatalogKey, viewedAt: number): StorageWriteResult<PersonalState> {
	const state = readPersonalState(storage);
	const recent = [{ key, viewedAt }, ...state.recent.filter((entry) => entry.key !== key)].slice(0, 8);
	return writeJson(storage, PERSONAL_STATE_KEY, { ...state, recent });
}

export function clearRecent(storage: Storage | null | undefined): StorageWriteResult<PersonalState> {
	const state = readPersonalState(storage);
	return writeJson(storage, PERSONAL_STATE_KEY, { ...state, recent: [] });
}

export function readSearchSession(storage: Storage | null | undefined, pathname: string): SearchSessionState | undefined {
	return parseSearchSession(readJson(storage, searchSessionKey(pathname)));
}

export function writeSearchSession(
	storage: Storage | null | undefined,
	pathname: string,
	state: SearchSessionState,
): StorageWriteResult<SearchSessionState> {
	const value: SearchSessionState = { query: state.query, scrollY: state.scrollY };
	if (topicIds.has(state.topicId ?? "")) value.topicId = state.topicId!;

	const audienceId = state.audienceId?.trim();
	if (audienceId) value.audienceId = audienceId;

	return writeJson(storage, searchSessionKey(pathname), value);
}

export function clearSearchSession(storage: Storage | null | undefined, pathname: string): boolean {
	if (!storage) return false;

	try {
		storage.removeItem(searchSessionKey(pathname));
		return true;
	} catch {
		return false;
	}
}
