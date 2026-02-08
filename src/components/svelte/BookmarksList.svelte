<script>
	import { onMount } from "svelte"
	import { bookmarks, initBookmarksStore, removeBookmark } from "@/lib/bookmarks"

	onMount(() => {
		initBookmarksStore()
	})
</script>

{#if $bookmarks.length === 0}
	<p class="text-[color:var(--muted)]">Пока нет закладок.</p>
{:else}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each $bookmarks as item (item.id)}
			<article class="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
				<h3 class="mb-2 text-xl font-semibold text-[color:var(--text)]">{item.title || "Без названия"}</h3>
				{#if item.description}
					<p class="mb-4 line-clamp-3 text-sm text-[color:var(--muted)]">{item.description}</p>
				{/if}
				<div class="flex items-center gap-3">
					<a class="text-sm font-medium text-[color:var(--accent)] hover:underline" href={item.href}>Открыть</a>
					<button
						type="button"
						on:click={() => removeBookmark(item.id)}
						class="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
					>
						Удалить
					</button>
				</div>
			</article>
		{/each}
	</div>
{/if}
