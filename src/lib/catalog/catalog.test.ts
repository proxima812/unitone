// Bun provides this module at test runtime; the project intentionally has no Bun type dependency.
// @ts-ignore
import { describe, expect, test } from "bun:test";
import { buildCatalogIndex, getRelatedItems, getTopicFilters } from "./catalog";

const communities = [
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
		id: "anonimnye-kompyuternye-igroki",
		title: "Анонимные Компьютерные Игроки",
		description: "Поддержка при зависимости от видеоигр.",
		category: "🎨 Творческие зависимости",
		since: "",
		wikipedia: "",
		find: true,
		sources: [{ title: "Источник", url: "https://example.com/gaa" }],
	},
];

const methods = [
	{ id: "living-sober", title: "Living Sober", description: "Ежедневная трезвость", community: ["AA"] },
	{ id: "bkaa", title: "БКАА", description: "Работа по шагам", community: ["АА"] },
	{ id: "workbook", title: "Workbook", description: "Рабочая тетрадь", community: ["Workbook"] },
];

describe("buildCatalogIndex", () => {
	test("исправляет очевидные ошибки тем", () => {
		const index = buildCatalogIndex({ communities, methods });
		expect(index.byKey["community:anonimnye-igroki"].topicIds).toEqual(["gambling"]);
		expect(index.byKey["community:anonimnye-kompyuternye-igroki"].topicIds).toEqual(["digital"]);
	});

	test("даёт близким одновременно семейную и предметную тему", () => {
		const index = buildCatalogIndex({ communities, methods });
		expect(index.byKey["community:al-anon"].topicIds).toEqual(expect.arrayContaining(["family", "alcohol"]));
	});

	test("объединяет AA и АА в одно направление", () => {
		const index = buildCatalogIndex({ communities, methods });
		expect(index.byKey["method:living-sober"].audienceIds).toEqual(["aa"]);
		expect(index.byKey["method:bkaa"].audienceIds).toEqual(["aa"]);
	});

	test("добавляет канонические сокращения к связанному сообществу", () => {
		const index = buildCatalogIndex({
			communities: [
				...communities,
				{
					id: "anonimnye-narkomany",
					title: "Анонимные Наркоманы",
					description: "Поддержка при наркотической зависимости.",
					category: "💊 Наркотические зависимости",
					since: "1953",
					wikipedia: "",
					find: true,
					sources: [{ title: "Источник", url: "https://example.com/na" }],
				},
			],
			methods,
		});

		expect(index.byKey["community:anonimnye-narkomany"].aliases).toEqual(expect.arrayContaining(["АН", "NA"]));
	});

	test("не выдаёт формат за сообщество", () => {
		const index = buildCatalogIndex({ communities, methods });
		expect(index.byKey["method:workbook"].relatedKeys).toEqual([]);
		expect(index.byKey["method:workbook"].audienceLabels).toEqual(["Рабочая тетрадь"]);
	});

	test("сохраняет метку неизвестного формата в фильтре", () => {
		const index = buildCatalogIndex({
			communities,
			methods: [
				...methods,
				{
					id: "custom-format",
					title: "Custom Format",
					description: "Пользовательский формат",
					community: ["My Custom Format"],
				},
			],
		});

		expect(index.methodFilters.find((filter) => filter.id === "my-custom-format")).toEqual({
			id: "my-custom-format",
			label: "My Custom Format",
			count: 1,
		});
	});

	test("строит двустороннюю связь сообщества и метода", () => {
		const index = buildCatalogIndex({ communities, methods });
		const methodIds = getRelatedItems(index, "community:anonimnye-alkogoliki").map((item) => item.id);
		expect(methodIds).toHaveLength(2);
		expect(methodIds).toEqual(expect.arrayContaining(["bkaa", "living-sober"]));
		expect(getRelatedItems(index, "method:living-sober").map((item) => item.id)).toEqual(["anonimnye-alkogoliki"]);
	});

	test("считает фильтры по уникальным материалам", () => {
		const index = buildCatalogIndex({ communities, methods });
		expect(getTopicFilters(index.communities).find((filter) => filter.id === "gambling")?.count).toBe(1);
	});
});
