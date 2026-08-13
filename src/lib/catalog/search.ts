import { TOPICS } from "./taxonomy";
import type { CatalogItem, CatalogKind, TopicId } from "./types";

export interface SearchOptions {
	query?: string;
	kind?: CatalogKind;
	topicId?: TopicId;
	audienceId?: string;
	limit?: number;
}

export type MatchReason = "exact" | "title" | "alias" | "topic" | "description" | "fuzzy" | "alphabetical";

export interface SearchResult {
	item: CatalogItem;
	score: number;
	reason: MatchReason;
}

const SCORE = {
	exact: 1_000,
	titlePrefix: 850,
	titleTokens: 700,
	alias: 650,
	topic: 500,
	description: 350,
	allTokens: 250,
	fuzzy: 100,
} as const;

interface Match {
	score: number;
	reason: Exclude<MatchReason, "exact" | "alphabetical">;
}

interface SearchDocument {
	title: string;
	aliases: string[];
	topics: string[];
	audiences: string[];
	description: string;
}

function compareByScore(left: SearchResult, right: SearchResult): number {
	return right.score - left.score || left.item.title.localeCompare(right.item.title, "ru");
}

function words(value: string): string[] {
	return normalizeSearchText(value).split(" ").filter(Boolean);
}

function sharesWordStem(left: string, right: string): boolean {
	if (left === right) return true;
	const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
	return shorter.length >= 4 && longer.startsWith(shorter);
}

function levenshteinDistance(left: string, right: string): number {
	const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

	for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
		let diagonal = previous[0];
		previous[0] = leftIndex;

		for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
			const above = previous[rightIndex];
			previous[rightIndex] = Math.min(
				previous[rightIndex] + 1,
				previous[rightIndex - 1] + 1,
				diagonal + Number(left[leftIndex - 1] !== right[rightIndex - 1]),
			);
			diagonal = above;
		}
	}

	return previous[right.length];
}

function isFuzzyMatch(query: string, value: string, requireDifference = false): boolean {
	if (query.length < 5) return false;
	const maximumDistance = query.length <= 7 ? 1 : 2;
	const distance = levenshteinDistance(query, value);
	return distance <= maximumDistance && (!requireDifference || distance > 0);
}

function hasWordMatch(query: string, values: readonly string[]): boolean {
	return values.some((value) => words(value).some((word) => sharesWordStem(query, word)));
}

function hasFuzzyWordMatch(query: string, values: readonly string[], requireDifference = false): boolean {
	return values.some((value) => words(value).some((word) => isFuzzyMatch(query, word, requireDifference)));
}

function getSearchDocument(item: CatalogItem): SearchDocument {
	const topics = item.topicIds.flatMap((topicId) => {
		const topic = TOPICS.find((candidate) => candidate.id === topicId);
		return topic ? [topic.label, ...topic.aliases] : [];
	});

	return {
		title: item.title,
		aliases: item.aliases,
		topics,
		audiences: item.audienceLabels,
		description: item.description,
	};
}

function findTokenMatch(token: string, document: SearchDocument): Match | undefined {
	if (hasWordMatch(token, [document.title])) return { score: SCORE.titleTokens, reason: "title" };
	if (hasWordMatch(token, [...document.aliases, ...document.audiences])) return { score: SCORE.alias, reason: "alias" };
	if (hasWordMatch(token, document.topics)) return { score: SCORE.topic, reason: "topic" };
	if (hasWordMatch(token, [document.description])) return { score: SCORE.description, reason: "description" };

	const allFields = [document.title, ...document.aliases, ...document.topics, ...document.audiences, document.description];
	if (hasFuzzyWordMatch(token, allFields)) return { score: SCORE.fuzzy, reason: "fuzzy" };
}

function findFuzzyMatch(token: string, document: SearchDocument): Match | undefined {
	const allFields = [document.title, ...document.aliases, ...document.topics, ...document.audiences, document.description];
	return hasFuzzyWordMatch(token, allFields, true) ? { score: SCORE.fuzzy, reason: "fuzzy" } : undefined;
}

function filterItems(items: CatalogItem[], options: SearchOptions): CatalogItem[] {
	return items.filter((item) => {
		if (options.kind && item.kind !== options.kind) return false;
		if (options.topicId && !item.topicIds.includes(options.topicId)) return false;
		if (options.audienceId && !item.audienceIds.includes(options.audienceId)) return false;
		return true;
	});
}

function clampLimit(results: SearchResult[], limit: number | undefined): SearchResult[] {
	if (limit === undefined) return results;
	return results.slice(0, Math.max(0, Math.floor(limit)));
}

export function normalizeSearchText(value: string): string {
	return value
		.toLocaleLowerCase("ru")
		.replace(/ё/gu, "е")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
}

export function searchCatalog(items: CatalogItem[], options: SearchOptions): SearchResult[] {
	const filteredItems = filterItems(items, options);
	const query = normalizeSearchText(options.query ?? "");

	if (!query) {
		return clampLimit(
			filteredItems
				.map((item) => ({ item, score: 0, reason: "alphabetical" as const }))
				.sort((left, right) => left.item.title.localeCompare(right.item.title, "ru")),
			options.limit,
		);
	}

	const queryTokens = words(query);
	const results = filteredItems.flatMap((item): SearchResult[] => {
		const document = getSearchDocument(item);
		const title = normalizeSearchText(document.title);
		const aliases = [...document.aliases, ...document.audiences].map(normalizeSearchText);

		if (title === query || aliases.includes(query)) {
			return [{ item, score: SCORE.exact, reason: "exact" }];
		}

		const matches = queryTokens.map((token) => findTokenMatch(token, document));
		const matchedScores = matches.map((match) => match?.score ?? 0);
		const highestMatch = matches.reduce<Match | undefined>((best, match) => !best || (match && match.score > best.score) ? match : best, undefined);
		const allTokensMatched = matches.every(Boolean);
		const tokenScore = matchedScores.reduce((sum, score) => sum + score, 0) / queryTokens.length;
		const titlePrefixScore = title.startsWith(query) ? SCORE.titlePrefix : 0;
		const score = Math.max(tokenScore + (allTokensMatched ? SCORE.allTokens : 0), titlePrefixScore);

		if (!score || !highestMatch) return [];
		return [{ item, score, reason: titlePrefixScore > tokenScore ? "title" : highestMatch.reason }];
	});

	return clampLimit(results.sort(compareByScore), options.limit);
}

export function suggestCatalog(items: CatalogItem[], query: string, limit = 3): SearchResult[] {
	const queryTokens = words(query);
	if (queryTokens.length === 0) return [];

	const results = items.flatMap((item): SearchResult[] => {
		const matches = queryTokens.map((token) => findFuzzyMatch(token, getSearchDocument(item)));
		const score = matches.reduce((sum, match) => sum + (match?.score ?? 0), 0) / queryTokens.length;

		return score > 0 ? [{ item, score, reason: "fuzzy" }] : [];
	});

	return results.sort(compareByScore).slice(0, Math.min(3, Math.max(0, Math.floor(limit))));
}
