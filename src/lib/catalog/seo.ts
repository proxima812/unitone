import type { CatalogItem } from "./types";

const SITE_NAME = "Unity One";
const SITE_URL = "https://unityone.space";

export const appSeo = {
	home: {
		title: "Каталог 12 шагов",
		description:
			"Каталог Unity One: сообщества 12 шагов, группы взаимопомощи и методы работы по шагам для АА, АН, Ал-Анон, CoDA и других направлений.",
		keywords: [
			"12 шагов",
			"программа 12 шагов",
			"сообщества 12 шагов",
			"группы взаимопомощи",
			"анонимные алкоголики",
			"анонимные наркоманы",
			"работа по шагам",
		],
	},
	communities: {
		title: "Сообщества 12 шагов",
		description:
			"Справочник сообществ 12 шагов: Анонимные Алкоголики, Анонимные Наркоманы, Ал-Анон, CoDA, OA, SLAA и другие группы взаимопомощи.",
		keywords: [
			"сообщества 12 шагов",
			"группы анонимных",
			"анонимные алкоголики",
			"анонимные наркоманы",
			"группы взаимопомощи зависимости",
		],
	},
	methods: {
		title: "Методы работы по 12 шагам",
		description:
			"Практические материалы для работы по 12 шагам: воркбуки, дневники, форматы групп, семинары и руководства для разных сообществ.",
		keywords: [
			"работа по шагам",
			"12 шагов воркбук",
			"12 step workbook",
			"метод 12 шагов",
			"вопросы по 12 шагам",
		],
	},
};

export function buildCanonical(path: string): string {
	return new URL(path, SITE_URL).toString();
}

export function buildItemDescription(item: CatalogItem): string {
	const labels = [...item.audienceLabels, item.primaryLabel].filter(Boolean);
	const suffix = labels.length > 0 ? ` Подходит для направления: ${labels.join(", ")}.` : "";
	return `${item.description}${suffix} В каталоге Unity One: связанные сообщества, методы и материалы по 12 шагам.`;
}

export function buildItemKeywords(item: CatalogItem): string[] {
	return [
		item.title,
		...item.aliases,
		...item.audienceLabels,
		item.primaryLabel,
		item.kind === "community" ? "сообщество 12 шагов" : "метод 12 шагов",
		item.kind === "community" ? "группа взаимопомощи" : "работа по шагам",
		"программа 12 шагов",
	].filter((keyword, index, keywords): keyword is string => Boolean(keyword) && keywords.indexOf(keyword) === index);
}

export function buildJsonLd(path: string, title: string, description: string) {
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: title,
		description,
		url: buildCanonical(path),
		isPartOf: {
			"@type": "WebSite",
			name: SITE_NAME,
			url: SITE_URL,
		},
		inLanguage: "ru",
	};
}
