import { get, writable } from "svelte/store"

export type BookmarkItem = {
	id: string
	title: string
	description?: string
	date?: string
	href: string
}

export const BOOKMARKS_KEY = "unitone_bookmarks"
export const bookmarks = writable<BookmarkItem[]>([])

let initialized = false

function sanitizeList(value: unknown): BookmarkItem[] {
	if (!Array.isArray(value)) return []

	return value
		.filter((item) => item && typeof item === "object")
		.map((item) => {
			const record = item as Record<string, unknown>
			return {
				id: String(record.id || ""),
				title: String(record.title || ""),
				description: record.description ? String(record.description) : "",
				date: record.date ? String(record.date) : "",
				href: String(record.href || ""),
			}
		})
		.filter((item) => item.id && item.href)
}

function readFromStorage(): BookmarkItem[] {
	if (typeof window === "undefined") return []

	try {
		return sanitizeList(JSON.parse(window.localStorage.getItem(BOOKMARKS_KEY) || "[]"))
	} catch {
		return []
	}
}

function writeToStorage(list: BookmarkItem[]): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list))
	window.dispatchEvent(
		new CustomEvent("bookmarks-updated", {
			detail: { count: list.length },
		}),
	)
}

export function initBookmarksStore(): void {
	if (initialized || typeof window === "undefined") return
	initialized = true

	bookmarks.set(readFromStorage())

	window.addEventListener("storage", (event) => {
		if (event.key === BOOKMARKS_KEY) {
			bookmarks.set(readFromStorage())
		}
	})

	bookmarks.subscribe((items) => {
		if (!initialized) return
		writeToStorage(items)
	})
}

export function isBookmarked(id: string): boolean {
	return get(bookmarks).some((item) => item.id === id)
}

export function toggleBookmark(item: BookmarkItem): void {
	const list = get(bookmarks)
	const index = list.findIndex((entry) => entry.id === item.id)

	if (index > -1) {
		bookmarks.set(list.filter((entry) => entry.id !== item.id))
		return
	}

	bookmarks.set([...list, item])
}

export function removeBookmark(id: string): void {
	bookmarks.set(get(bookmarks).filter((entry) => entry.id !== id))
}
