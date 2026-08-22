interface PostCatalogRecord {
	type: string;
	status: string;
	category: string;
	tags: readonly string[];
}

export interface PostFilters {
	category?: string;
	tag?: string;
}

function clean(value: string | undefined): string {
	return value?.trim() ?? "";
}

function isPublishedPost(record: PostCatalogRecord): boolean {
	return record.type === "post" && record.status === "published";
}

export function buildPostFacets(records: readonly PostCatalogRecord[]): { categories: string[]; tags: string[] } {
	const categories = new Set<string>();
	const tags = new Set<string>();

	for (const record of records) {
		if (!isPublishedPost(record)) continue;

		const category = clean(record.category);
		if (category) categories.add(category);
		for (const value of record.tags) {
			const tag = clean(value);
			if (tag) tags.add(tag);
		}
	}

	return {
		categories: [...categories].sort((left, right) => left.localeCompare(right, "ru")),
		tags: [...tags].sort((left, right) => left.localeCompare(right, "ru")),
	};
}

export function filterPublishedPosts<T extends PostCatalogRecord>(records: readonly T[], filters: PostFilters = {}): T[] {
	const category = clean(filters.category);
	const tag = clean(filters.tag);

	return records.filter((record) => {
		if (!isPublishedPost(record)) return false;
		if (category && clean(record.category) !== category) return false;
		if (tag && !record.tags.some((value) => clean(value) === tag)) return false;
		return true;
	});
}
