import {
	canonicalizeMethodAudience,
	getCommunityAbbreviations,
	getCommunityAudience,
	getCommunityTopicIds,
	TOPICS,
} from "./taxonomy";
import type {
	CatalogFilter,
	CatalogIndex,
	CatalogItem,
	CatalogKey,
	CatalogSource,
	CanonicalAudience,
	TopicId,
} from "./types";

const topicLabelById = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic.label]));

function compareByTitle(left: CatalogItem, right: CatalogItem): number {
	return left.title.localeCompare(right.title, "ru");
}

function unique<T>(values: readonly T[]): T[] {
	return [...new Set(values)];
}

function topicIdsForRelatedCommunities(communities: CatalogItem[]): TopicId[] {
	const topicIds = unique(communities.flatMap((community) => community.topicIds));
	return topicIds.length > 0 ? topicIds : ["general"];
}

export function buildCatalogIndex(input: CatalogSource): CatalogIndex {
	const communities = [...input.communities]
		.sort((left, right) => left.title.localeCompare(right.title, "ru"))
		.map((community): CatalogItem => {
			const topicIds = getCommunityTopicIds(community);
			const audience = getCommunityAudience(community.id);
			return {
				key: `community:${community.id}`,
				kind: "community",
				id: community.id,
				title: community.title,
				description: community.description,
				href: `/app/communities/${community.id}/`,
				topicIds,
				aliases: unique([community.title, ...(audience ? getCommunityAbbreviations(audience.id) : [])]),
				audienceIds: audience ? [audience.id] : [],
				audienceLabels: audience ? [audience.label] : [],
				relatedKeys: [],
				primaryLabel: topicLabelById[topicIds[0]],
			};
		});

	const communityByAudienceId = new Map(
		communities.flatMap((community) => community.audienceIds.map((audienceId) => [audienceId, community] as const)),
	);

	const methodAudiences = new Map<string, CanonicalAudience>();
	const methods = [...input.methods]
		.sort((left, right) => left.title.localeCompare(right.title, "ru"))
		.map((method): CatalogItem => {
			const audiences = unique(method.community.map(canonicalizeMethodAudience));
			for (const audience of audiences) {
				methodAudiences.set(audience.id, audience);
			}
			const relatedCommunities = audiences
				.map((audience) => audience.communityId ? communityByAudienceId.get(audience.id) : undefined)
				.filter((community): community is CatalogItem => Boolean(community));
			const audienceIds = audiences.map((audience) => audience.id);
			const audienceLabels = audiences.map((audience) => audience.label);

			return {
				key: `method:${method.id}`,
				kind: "method",
				id: method.id,
				title: method.title,
				description: method.description,
				href: `/app/methods/${method.id}/`,
				topicIds: topicIdsForRelatedCommunities(relatedCommunities),
				aliases: unique([method.title, ...method.community.map((label) => label.trim())]),
				audienceIds,
				audienceLabels,
				relatedKeys: relatedCommunities.map((community) => community.key),
				primaryLabel: audienceLabels[0] ?? topicLabelById.general,
			};
		});

	const items = [...communities, ...methods];
	const byKey = Object.fromEntries(items.map((item) => [item.key, item]));

	for (const method of methods) {
		for (const communityKey of method.relatedKeys) {
			byKey[communityKey].relatedKeys.push(method.key);
		}
	}

	for (const item of items) {
		item.relatedKeys.sort((left, right) => compareByTitle(byKey[left], byKey[right]));
	}

	const methodFilters = [...methodAudiences.values()].map((audience) => {
		return {
			id: audience.id,
			label: audience.label,
			count: methods.filter((method) => method.audienceIds.includes(audience.id)).length,
		};
	});

	return { items, communities, methods, topics: TOPICS, methodFilters, byKey };
}

export function getRelatedItems(index: CatalogIndex, key: CatalogKey): CatalogItem[] {
	return (index.byKey[key]?.relatedKeys ?? [])
		.map((relatedKey) => index.byKey[relatedKey])
		.filter((item): item is CatalogItem => Boolean(item));
}

export function getTopicFilters(items: CatalogItem[]): CatalogFilter[] {
	const uniqueItems = [...new Map(items.map((item) => [item.key, item])).values()];

	return TOPICS.map((topic) => ({
		id: topic.id,
		label: topic.label,
		count: uniqueItems.filter((item) => item.topicIds.includes(topic.id)).length,
	})).filter((filter) => filter.count > 0);
}
