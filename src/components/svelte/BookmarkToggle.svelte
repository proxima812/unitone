<script>
	import { bookmarks, initBookmarksStore, toggleBookmark } from "@/lib/bookmarks"

	export let id
	export let title
	export let description = ""
	export let date = ""
	export let href
	export let variant = "article"

	$: exists = $bookmarks.some((item) => item.id === id)
	$: isCard = variant === "card"
	$: bookmarkData = {
		id,
		title,
		description,
		date,
		href,
	}

	function handleToggle(event) {
		event.preventDefault()
		event.stopPropagation()
		toggleBookmark(bookmarkData)
	}

	initBookmarksStore()
</script>

<button
	type="button"
	on:click={handleToggle}
	aria-pressed={exists}
	class={`bookmark-toggle rounded-full border px-3 py-1.5 text-sm transition ${
		exists
			? "border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--surface)]"
			: "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:border-[color:var(--accent)]"
	} ${isCard ? "relative z-10" : ""}`}
>
	{exists ? "В закладках" : "В закладки"}
</button>
