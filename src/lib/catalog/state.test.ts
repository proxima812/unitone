// Bun provides this module at test runtime; the project intentionally has no Bun type dependency.
// @ts-ignore
import { describe, expect, test } from "bun:test";
import {
	PERSONAL_STATE_KEY,
	SEARCH_SESSION_PREFIX,
	clearRecent,
	clearSearchSession,
	readPersonalState,
	readSearchSession,
	recordRecent,
	toggleFavorite,
	writeSearchSession,
} from "./state";
import type { SearchSessionState } from "./state";

class MemoryStorage implements Storage {
	private readonly values = new Map<string, string>();

	get length(): number {
		return this.values.size;
	}

	clear(): void {
		this.values.clear();
	}

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.values.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.values.delete(key);
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

class UnavailableStorage extends MemoryStorage {
	override getItem(): string | null {
		throw new DOMException("Storage is unavailable", "SecurityError");
	}

	override setItem(): void {
		throw new DOMException("Storage is unavailable", "SecurityError");
	}

	override removeItem(): void {
		throw new DOMException("Storage is unavailable", "SecurityError");
	}
}

describe("catalog personal state", () => {
	test("добавляет и удаляет избранное без дублей", () => {
		const storage = new MemoryStorage();

		expect(toggleFavorite(storage, "community:al-anon").value.favorites).toEqual(["community:al-anon"]);
		expect(toggleFavorite(storage, "community:al-anon").value.favorites).toEqual([]);
	});

	test("держит не больше восьми недавних и поднимает дубль наверх", () => {
		const storage = new MemoryStorage();

		for (let index = 0; index < 9; index += 1) {
			recordRecent(storage, `method:item-${index}`, index);
		}

		const state = recordRecent(storage, "method:item-2", 99).value;
		expect(state.recent).toHaveLength(8);
		expect(state.recent[0]).toEqual({ key: "method:item-2", viewedAt: 99 });
		expect(state.recent.filter((item) => item.key === "method:item-2")).toHaveLength(1);
	});

	test("возвращает пустое состояние при повреждённом JSON", () => {
		const storage = new MemoryStorage();
		storage.setItem(PERSONAL_STATE_KEY, "{");

		expect(readPersonalState(storage)).toEqual({ version: 1, favorites: [], recent: [] });
	});

	test("перезаписывает повреждённое состояние только при следующей успешной записи", () => {
		const storage = new MemoryStorage();
		storage.setItem(PERSONAL_STATE_KEY, "{");

		readPersonalState(storage);
		expect(storage.getItem(PERSONAL_STATE_KEY)).toBe("{");

		toggleFavorite(storage, "community:al-anon");
		expect(storage.getItem(PERSONAL_STATE_KEY)).toBe('{"version":1,"favorites":["community:al-anon"],"recent":[]}');
	});

	test("очищает историю, сохраняя избранное", () => {
		const storage = new MemoryStorage();
		toggleFavorite(storage, "community:al-anon");
		recordRecent(storage, "method:living-sober", 42);

		expect(clearRecent(storage).value).toEqual({
			version: 1,
			favorites: ["community:al-anon"],
			recent: [],
		});
	});

	test("отбрасывает повреждённые поля личного состояния", () => {
		const storage = new MemoryStorage();
		storage.setItem(
			PERSONAL_STATE_KEY,
			JSON.stringify({
				version: 1,
				favorites: ["community:al-anon", 7, "method:living-sober"],
				recent: [
					{ key: "method:living-sober", viewedAt: 10 },
					{ key: "community:al-anon", viewedAt: "now" },
				],
				extra: true,
			}),
		);

		expect(readPersonalState(storage)).toEqual({
			version: 1,
			favorites: ["community:al-anon", "method:living-sober"],
			recent: [{ key: "method:living-sober", viewedAt: 10 }],
		});
	});

	test("не падает при недоступном хранилище", () => {
		expect(toggleFavorite(null, "community:al-anon")).toMatchObject({ persisted: false });
		expect(recordRecent(new UnavailableStorage(), "method:living-sober", 1)).toMatchObject({ persisted: false });
	});
});

describe("catalog search session", () => {
	test("пишет запрос только в переданное сессионное хранилище", () => {
		const session = new MemoryStorage();
		writeSearchSession(session, "/app/communities/", { query: "муж алкоголик", scrollY: 320, topicId: "family" });

		expect(readSearchSession(session, "/app/communities/")).toEqual({
			query: "муж алкоголик",
			scrollY: 320,
			topicId: "family",
		});
		expect(session.getItem(`${SEARCH_SESSION_PREFIX}/app/communities/`)).toContain("муж алкоголик");
	});

	test("отбрасывает фильтры с недопустимым типом или значением", () => {
		const session = new MemoryStorage();
		session.setItem(`${SEARCH_SESSION_PREFIX}/app/methods/`, JSON.stringify({
			query: "трезвость",
			scrollY: 64,
			topicId: "unknown-topic",
			audienceId: "",
		}));

		expect(readSearchSession(session, "/app/methods/")).toEqual({
			query: "трезвость",
			scrollY: 64,
		});
	});

	test("не записывает недопустимые опциональные фильтры", () => {
		const session = new MemoryStorage();
		const value = writeSearchSession(session, "/app/", {
			query: "трезвость",
			scrollY: 64,
			topicId: "unknown-topic",
			audienceId: "  ",
		} as unknown as SearchSessionState).value;

		expect(value).toEqual({ query: "трезвость", scrollY: 64 });
		expect(JSON.parse(session.getItem(`${SEARCH_SESSION_PREFIX}/app/`)!)).toEqual({ query: "трезвость", scrollY: 64 });
	});

	test("обрезает допустимый audienceId перед записью", () => {
		const session = new MemoryStorage();
		const value = writeSearchSession(session, "/app/methods/", {
			query: "трезвость",
			scrollY: 64,
			topicId: "alcohol",
			audienceId: "  aa  ",
		}).value;

		expect(value).toEqual({ query: "трезвость", scrollY: 64, topicId: "alcohol", audienceId: "aa" });
		expect(JSON.parse(session.getItem(`${SEARCH_SESSION_PREFIX}/app/methods/`)!)).toEqual({
			query: "трезвость",
			scrollY: 64,
			topicId: "alcohol",
			audienceId: "aa",
		});
	});

	test("не восстанавливает повреждённую сессию", () => {
		const session = new MemoryStorage();
		session.setItem(`${SEARCH_SESSION_PREFIX}/app/`, JSON.stringify({ query: 4, scrollY: -1, topicId: "family" }));

		expect(readSearchSession(session, "/app/")).toBeUndefined();
	});

	test("удаляет только сессию заданного пути", () => {
		const session = new MemoryStorage();
		writeSearchSession(session, "/app/", { query: "one", scrollY: 1 });
		writeSearchSession(session, "/app/methods/", { query: "two", scrollY: 2 });

		expect(clearSearchSession(session, "/app/")).toBe(true);
		expect(readSearchSession(session, "/app/")).toBeUndefined();
		expect(readSearchSession(session, "/app/methods/")).toEqual({ query: "two", scrollY: 2 });
	});

	test("продолжает работу при недоступной сессии", () => {
		const session = new UnavailableStorage();

		expect(writeSearchSession(session, "/app/", { query: "поиск", scrollY: 0 }).persisted).toBe(false);
		expect(readSearchSession(session, "/app/")).toBeUndefined();
		expect(clearSearchSession(session, "/app/")).toBe(false);
	});
});
