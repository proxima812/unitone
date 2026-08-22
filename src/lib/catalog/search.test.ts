// Bun provides this module at test runtime; the project intentionally has no Bun type dependency.
// @ts-ignore
import { describe, expect, test } from "bun:test";
import { buildCatalogIndex } from "./catalog";
import { normalizeSearchText, searchCatalog, suggestCatalog } from "./search";

const index = buildCatalogIndex({
	communities: [
		{
			id: "anonimnye-alkogoliki",
			title: "Анонимные Алкоголики",
			description: "Сообщество для людей с алкогольной зависимостью.",
			category: "🍷 Алкогольные зависимости",
			since: "1935",
		wikipedia: "",
		find: true,
		sources: [{ title: "Источник", url: "https://example.com/aa" }],
		},
		{
			id: "anonimnye-narkomany",
			title: "Анонимные Наркоманы",
			description: "Сообщество для людей с наркотической зависимостью.",
			category: "💊 Наркотические зависимости",
			since: "1953",
		wikipedia: "",
		find: true,
		sources: [{ title: "Источник", url: "https://example.com/na" }],
		},
		{
			id: "al-anon",
			title: "Ал-Анон",
			description: "Поддержка для семей и близких алкоголиков.",
			category: "👪 Поддержка для близких",
			since: "1951",
		wikipedia: "",
		find: true,
		sources: [{ title: "Источник", url: "https://example.com/al-anon" }],
		},
		{
			id: "anonimnye-igroki",
			title: "Анонимные Игроки",
			description: "Поддержка при зависимости от азартных игр.",
			category: "💊 Наркотические зависимости",
			since: "1957",
		wikipedia: "",
		find: true,
		sources: [{ title: "Источник", url: "https://example.com/ga" }],
		},
		{
			id: "anonimnye-internet-zavisimye",
			title: "Анонимные Интернет-Зависимые",
			description: "Поддержка при интернет-зависимости.",
			category: "♻ Общие зависимости",
			since: "",
		wikipedia: "",
		find: true,
		sources: [{ title: "Источник", url: "https://example.com/itaa" }],
		},
	],
	methods: [
		{ id: "aa-guide", title: "Руководство АА", description: "Материал для выздоровления", community: ["AA"] },
		{ id: "aa-workbook", title: "Тетрадь АА", description: "Работа по шагам", community: ["АА"] },
		{ id: "na-guide", title: "Руководство АН", description: "Материал для выздоровления", community: ["NA"] },
	],
});

describe("catalog search", () => {
	test("считает е и ё одинаковыми", () => {
		expect(normalizeSearchText("Надёжность")).toBe("надежность");
	});

	test.each(["АА", "AA"])("%s находит Анонимных Алкоголиков первыми", (query: string) => {
		const [result] = searchCatalog(index.items, { query });
		expect(result.item.id).toBe("anonimnye-alkogoliki");
	});

	test.each(["АН", "NA"])("%s находит Анонимных Наркоманов первыми", (query: string) => {
		const [result] = searchCatalog(index.items, { query });
		expect(result.item.id).toBe("anonimnye-narkomany");
	});

	test("находит помощь близким по проблемной фразе", () => {
		const ids = searchCatalog(index.items, { query: "помощь мужу алкоголика" }).slice(0, 3).map(({ item }) => item.id);
		expect(ids).toContain("al-anon");
	});

	test("исправляет небольшую опечатку", () => {
		const [result] = searchCatalog(index.items, { query: "анонимные алкаголики" });
		expect(result.item.id).toBe("anonimnye-alkogoliki");
		expect(result.score).toBeGreaterThan(0);
	});

	test("применяет тему до ранжирования", () => {
		const results = searchCatalog(index.items, { topicId: "gambling" });
		expect(results.every(({ item }) => item.topicIds.includes("gambling"))).toBe(true);
	});

	test("без запроса сортирует по русскому алфавиту", () => {
		const titles = searchCatalog(index.communities, {}).map(({ item }) => item.title);
		expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "ru")));
	});

	test("точное совпадение выше нечёткого", () => {
		const results = searchCatalog(index.items, { query: "Ал-Анон" });
		expect(results[0]).toMatchObject({ item: { id: "al-anon" }, reason: "exact" });
	});

	test("ограничивает suggestions тремя результатами при большем limit", () => {
		expect(suggestCatalog(index.items, "анонимые", 10)).toHaveLength(3);
	});

	test("не предлагает точное длинное название", () => {
		const ids = suggestCatalog(index.items, "Анонимные Алкоголики").map(({ item }) => item.id);
		expect(ids).not.toContain("anonimnye-alkogoliki");
	});
});
