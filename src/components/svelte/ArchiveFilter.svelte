<script>
	import { onMount } from "svelte"

	export let tags = []

	let search = ""
	let activeTags = []
	let visibleCount = 0
	let scroller
	let canScrollLeft = false
	let canScrollRight = false

	function toggleTag(tag) {
		if (activeTags.includes(tag)) {
			activeTags = activeTags.filter((item) => item !== tag)
		} else {
			activeTags = [...activeTags, tag]
		}
	}

	function resetFilters() {
		activeTags = []
		search = ""
	}

	function applyFilters() {
		if (typeof document === "undefined") return

		const postsRoot = document.querySelector("[data-posts]")
		if (!postsRoot) return

		const activeTagsLower = activeTags.map((tag) => tag.toLowerCase().trim())
		const query = search.toLowerCase().trim()
		let nextCount = 0

		postsRoot.querySelectorAll("[data-tag]").forEach((post) => {
			const postTags = (post.dataset.tag || "")
				.split(",")
				.map((tag) => tag.toLowerCase().trim())
			const text = (post.innerText || "").toLowerCase()

			const tagMatch =
				activeTagsLower.length === 0 || activeTagsLower.some((tag) => postTags.includes(tag))
			const queryMatch = query.length === 0 || text.includes(query)

			if (tagMatch && queryMatch) {
				post.classList.remove("hidden")
				nextCount += 1
			} else {
				post.classList.add("hidden")
			}
		})

		visibleCount = nextCount
	}

	function updateScrollHints() {
		if (!scroller) return
		const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
		canScrollLeft = scroller.scrollLeft > 2
		canScrollRight = scroller.scrollLeft < maxScrollLeft - 2
	}

	onMount(() => {
		applyFilters()
		updateScrollHints()
		window.addEventListener("resize", updateScrollHints)
		return () => {
			window.removeEventListener("resize", updateScrollHints)
		}
	})

	$: search, applyFilters()
	$: activeTags, applyFilters()
</script>

<section class="flex flex-col gap-4" data-filter>
	<div class="flex flex-col gap-2 text-center">
		<p class="text-sm text-[color:var(--muted)]">
			Выберите теги или введите слово, результат обновится автоматически.
		</p>
	</div>
	<div class="flex flex-wrap items-center justify-center gap-2">
		<input
			type="search"
			placeholder="Поиск по заголовку и описанию"
			aria-label="Поиск по архиву"
			bind:value={search}
			class="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm md:w-96 focus:border-[color:var(--accent)] focus:outline-none"
		/>
		<button
			type="button"
			on:click={resetFilters}
			class="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
		>
			Сбросить
		</button>
	</div>
	<div class="relative w-full">
		{#if canScrollLeft}
			<div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 rounded-l-xl bg-gradient-to-r from-[color:var(--bg)] to-transparent"></div>
		{/if}
		{#if canScrollRight}
			<div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 rounded-r-xl bg-gradient-to-l from-[color:var(--bg)] to-transparent"></div>
		{/if}
		<div bind:this={scroller} on:scroll={updateScrollHints} class="w-full overflow-x-auto pb-1">
			<div class="flex w-max min-w-full items-center gap-2 whitespace-nowrap">
			{#each tags as tag}
				<button
					type="button"
					on:click={() => toggleTag(tag)}
					class={`rounded-full border px-3 py-1.5 text-sm transition ${
						activeTags.includes(tag)
							? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
							: "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:border-[color:var(--accent)]"
					}`}
				>
					{tag}
				</button>
			{/each}
			</div>
		</div>
	</div>
	<div class="text-center text-sm text-[color:var(--muted)]">
		Найдено: <span>{visibleCount}</span>
	</div>
</section>
