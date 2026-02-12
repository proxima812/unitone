<script>
	import { onMount } from "svelte"
	import { t, DEFAULT_LOCALE } from "@/lib/i18n-runtime"
	import { bookmarks, initBookmarksStore, removeBookmark } from "@/lib/bookmarks"
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
</script>

{#if $bookmarks.length === 0}
	<p class="text-[color:var(--muted)]">{t(locale, "bookmarks.empty")}</p>
{:else}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each $bookmarks as item (item.id)}
			<article class="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
				<h3 class="mb-2 text-xl font-semibold text-[color:var(--text)]">{item.title || t(locale, "bookmarks.untitled")}</h3>
				{#if item.description}
					<p class="mb-4 line-clamp-3 text-sm text-[color:var(--muted)]">{item.description}</p>
				{/if}
				<div class="flex items-center gap-3">
					<a class="text-sm font-medium text-[color:var(--accent)] hover:underline" href={item.href}>{t(locale, "bookmarks.open")}</a>
					<button
						type="button"
						on:click={() => removeBookmark(item.id)}
						class="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
					>
						{t(locale, "bookmarks.remove")}
					</button>
				</div>
			</article>
		{/each}
	</div>
{/if}
