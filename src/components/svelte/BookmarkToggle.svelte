<script>
	import { onMount } from "svelte"
	import { t, DEFAULT_LOCALE } from "@/lib/i18n-runtime"
	import { bookmarks, initBookmarksStore, toggleBookmark } from "@/lib/bookmarks"

	export let id
	export let title
	export let description = ""
	export let date = ""
	export let href
	export let variant = "article"
	let locale = DEFAULT_LOCALE

	onMount(() => {
		initBookmarksStore()
		const sync = (event) => {
			locale = event?.detail?.locale || document.documentElement.getAttribute("data-locale") || DEFAULT_LOCALE
		}
		sync()
		window.addEventListener("unitone:locale-updated", sync)
		return () => window.removeEventListener("unitone:locale-updated", sync)
	})

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
	{exists ? t(locale, "bookmark.exists") : t(locale, "bookmark.add")}
</button>
