export type CatalogKind = "community" | "method";
export type TopicId =
	| "alcohol"
	| "substances"
	| "nicotine"
	| "food"
	| "gambling"
	| "digital"
	| "relationships"
	| "mental-health"
	| "family"
	| "finance"
	| "social"
	| "general";

export type CatalogKey = `${CatalogKind}:${string}`;

export interface CatalogTopic {
	id: TopicId;
	label: string;
	aliases: readonly string[];
}

export interface RawCommunity {
	id: string;
	title: string;
	description: string;
	category: string;
	since: string;
	wikipedia: string;
	find: boolean;
	sources: CommunitySource[];
}

export interface CommunitySource {
	title: string;
	url: string;
}

export interface RawMethod {
	id: string;
	title: string;
	description: string;
	community: string[];
}

export interface CanonicalAudience {
	id: string;
	label: string;
	communityId?: string;
	isFormat: boolean;
}

export interface CatalogItem {
	key: CatalogKey;
	kind: CatalogKind;
	id: string;
	title: string;
	description: string;
	href: string;
	topicIds: TopicId[];
	aliases: string[];
	audienceIds: string[];
	audienceLabels: string[];
	relatedKeys: CatalogKey[];
	primaryLabel: string;
}

export interface CatalogFilter {
	id: string;
	label: string;
	count: number;
}

export interface CatalogSource {
	communities: RawCommunity[];
	methods: RawMethod[];
}

export interface CatalogIndex {
	items: CatalogItem[];
	communities: CatalogItem[];
	methods: CatalogItem[];
	topics: readonly CatalogTopic[];
	methodFilters: CatalogFilter[];
	byKey: Record<string, CatalogItem>;
}
