export type BookmarkItem = {
	id: string;
	title: string;
	description?: string;
	date?: string;
	href: string;
};

export const BOOKMARKS_KEY = "unitone_bookmarks";

function sanitizeList(value: unknown): BookmarkItem[] {
	if (!Array.isArray(value)) return [];

	return value
		.filter((item) => item && typeof item === "object")
		.map((item) => {
			const record = item as Record<string, unknown>;
			return {
				id: String(record.id || ""),
				title: String(record.title || ""),
				description: record.description ? String(record.description) : "",
				date: record.date ? String(record.date) : "",
				href: String(record.href || ""),
			};
		})
		.filter((item) => item.id && item.href);
}

export function getBookmarks(): BookmarkItem[] {
	if (typeof window === "undefined") return [];

	try {
		return sanitizeList(JSON.parse(window.localStorage.getItem(BOOKMARKS_KEY) || "[]"));
	} catch {
		return [];
	}
}

export function setBookmarks(list: BookmarkItem[]): void {
	if (typeof window === "undefined") return;
	const sanitized = sanitizeList(list);
	window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(sanitized));
	window.dispatchEvent(
		new CustomEvent("bookmarks-updated", {
			detail: { count: sanitized.length },
		}),
	);
}

export function isBookmarked(id: string): boolean {
	return getBookmarks().some((item) => item.id === id);
}

export function toggleBookmark(item: BookmarkItem): void {
	const list = getBookmarks();
	const index = list.findIndex((entry) => entry.id === item.id);
	if (index > -1) {
		setBookmarks(list.filter((entry) => entry.id !== item.id));
		return;
	}
	setBookmarks([...list, item]);
}

export function removeBookmark(id: string): void {
	setBookmarks(getBookmarks().filter((entry) => entry.id !== id));
}
