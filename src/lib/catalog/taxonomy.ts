import type { CanonicalAudience, CatalogTopic, RawCommunity, TopicId } from "./types";

export const TOPICS = [
	{ id: "alcohol", label: "Алкоголь", aliases: ["алкоголь", "спиртное", "выпивка", "пьянство"] },
	{ id: "substances", label: "Наркотики и вещества", aliases: ["наркотики", "вещества", "пав", "кокаин", "героин", "таблетки", "марихуана"] },
	{ id: "nicotine", label: "Никотин", aliases: ["никотин", "курение", "сигареты", "вейп"] },
	{ id: "food", label: "Пищевое поведение", aliases: ["еда", "переедание", "пища", "рпп", "анорексия"] },
	{ id: "gambling", label: "Игры и ставки", aliases: ["азарт", "ставки", "казино", "игровая зависимость"] },
	{ id: "digital", label: "Интернет и технологии", aliases: ["интернет", "соцсети", "смартфон", "компьютер", "видеоигры", "медиа"] },
	{ id: "relationships", label: "Отношения и сексуальное поведение", aliases: ["отношения", "любовь", "секс", "созависимость", "контрзависимость"] },
	{ id: "mental-health", label: "Эмоции и психическое здоровье", aliases: ["эмоции", "тревога", "депрессия", "психика", "прокрастинация"] },
	{ id: "family", label: "Помощь близким", aliases: ["близкие", "семья", "муж", "жена", "родитель", "ребенок", "дети"] },
	{ id: "finance", label: "Деньги, работа и долги", aliases: ["долги", "деньги", "работа", "заработок", "безработица"] },
	{ id: "social", label: "Социальные трудности", aliases: ["изоляция", "насилие", "общество", "домосед", "одиночество"] },
	{ id: "general", label: "Универсальные и альтернативные подходы", aliases: ["любые зависимости", "универсальная", "светская", "духовная", "выздоровление"] },
] as const satisfies readonly CatalogTopic[];

export const CATEGORY_DEFAULTS: Readonly<Record<string, readonly TopicId[]>> = {
	"🍷 Алкогольные зависимости": ["alcohol"],
	"💊 Наркотические зависимости": ["substances"],
	"🧠 Психические расстройства": ["mental-health"],
	"👪 Поддержка для близких": ["family"],
	"🍽️ Проблемы с пищей": ["food"],
	"♻ Общие зависимости": ["general"],
	"🔖 Другое": ["general"],
	"🌍 Социальные проблемы": ["social"],
	"💰 Финансовые трудности": ["finance"],
	"🎨 Творческие зависимости": ["general"],
};

const COMMUNITY_TOPIC_OVERRIDES: Readonly<Record<string, readonly TopicId[]>> = {
	"anonimnye-igroki": ["gambling"],
	"anonimnye-kompyuternye-igroki": ["digital"],
	"anonimnye-nekotinozavisimye": ["nicotine"],
	"anonimnye-hudozhniki": ["general"],
};

const TOPIC_RULES: ReadonlyArray<readonly [TopicId, RegExp]> = [
	["alcohol", /алкогол|трезвост/iu],
	["substances", /наркот|веществ|пав|кокаин|героин|таблет|марихуан|химическ/iu],
	["family", /близк|семь|муж|жен|родител|ребен|дет|инцест/iu],
	["relationships", /отношен|любов|секс|созависим|контрзависим/iu],
	["finance", /долг|деньг|работ|заработ|безработ|бизнес/iu],
	["digital", /интернет|соцсет|смартфон|компьютер|видеоигр|медиа|цифров/iu],
	["food", /переед|пищ|\bрпп\b|анорекс|ед[ауые]/iu],
];

export const AUDIENCES: readonly CanonicalAudience[] = [
	{ id: "aa", label: "Анонимные Алкоголики", communityId: "anonimnye-alkogoliki", isFormat: false },
	{ id: "na", label: "Анонимные Наркоманы", communityId: "anonimnye-narkomany", isFormat: false },
	{ id: "coda", label: "Анонимные Созависимые", communityId: "anonimnye-sozavisimye", isFormat: false },
	{ id: "oa", label: "Анонимные Переедающие", communityId: "anonimnye-pereedayushchie", isFormat: false },
	{ id: "ma", label: "Анонимные Марихуанисты", communityId: "ma", isFormat: false },
	{ id: "maa", label: "Анонимные Медиа Зависимые", communityId: "anonimnye-mediya-zavisimye", isFormat: false },
	{ id: "artists", label: "Анонимные Художники", communityId: "anonimnye-hudozhniki", isFormat: false },
	{ id: "app", label: "Приложение", isFormat: true },
	{ id: "digital", label: "Цифровой формат", isFormat: true },
	{ id: "guide", label: "Руководство", isFormat: true },
	{ id: "journal", label: "Дневник", isFormat: true },
	{ id: "workbook", label: "Рабочая тетрадь", isFormat: true },
];

const COMMUNITY_ABBREVIATIONS: Readonly<Record<string, readonly string[]>> = {
	aa: ["АА", "AA"],
	na: ["АН", "NA"],
	coda: ["CoDA"],
	oa: ["OA"],
	ma: ["MA"],
	maa: ["MAA"],
	artists: ["АХ"],
};

const AUDIENCE_ALIASES: Readonly<Record<string, string>> = {
	aa: "aa",
	аа: "aa",
	na: "na",
	ан: "na",
	coda: "coda",
	oa: "oa",
	ma: "ma",
	maa: "maa",
	ах: "artists",
	app: "app",
	digital: "digital",
	guide: "guide",
	journal: "journal",
	workbook: "workbook",
	artists: "artists",
};

const audienceById = Object.fromEntries(AUDIENCES.map((audience) => [audience.id, audience]));
const audienceByCommunityId = Object.fromEntries(
	AUDIENCES.filter((audience) => audience.communityId).map((audience) => [audience.communityId!, audience]),
);

function stableAudienceId(label: string): string {
	return label
		.toLocaleLowerCase("ru")
		.normalize("NFKD")
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "") || "format";
}

export function canonicalizeMethodAudience(label: string): CanonicalAudience {
	const trimmed = label.trim();
	const knownId = AUDIENCE_ALIASES[trimmed.toLocaleLowerCase("ru")];

	if (knownId) {
		return audienceById[knownId];
	}

	return { id: stableAudienceId(trimmed), label: trimmed || "Формат", isFormat: true };
}

export function getCommunityTopicIds(community: RawCommunity): TopicId[] {
	const override = COMMUNITY_TOPIC_OVERRIDES[community.id];
	if (override) return [...override];

	const topicIds = new Set<TopicId>(CATEGORY_DEFAULTS[community.category] ?? ["general"]);
	const text = `${community.title} ${community.description}`;

	for (const [topicId, rule] of TOPIC_RULES) {
		if (rule.test(text)) topicIds.add(topicId);
	}

	return TOPICS.filter((topic) => topicIds.has(topic.id)).map((topic) => topic.id);
}

export function getCommunityAudience(communityId: string): CanonicalAudience | undefined {
	return audienceByCommunityId[communityId];
}

export function getCommunityAbbreviations(audienceId: string): readonly string[] {
	return COMMUNITY_ABBREVIATIONS[audienceId] ?? [];
}
