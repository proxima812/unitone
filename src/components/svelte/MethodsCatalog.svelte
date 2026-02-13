<script>
	export let methods = []

	let query = ""
	let activeFilter = "all"

	const normalizedMethods = methods
		.map((item) => ({
			...item,
			community: Array.isArray(item.community) ? item.community : [],
			searchText: `${item.title || ""} ${item.description || ""}`.toLowerCase(),
		}))
		.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ru"))

	const communities = [...new Set(normalizedMethods.flatMap((item) => item.community))]
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, "ru"))

	const counts = Object.fromEntries(
		communities.map((community) => [
			community,
			normalizedMethods.filter((item) => item.community.includes(community)).length,
		]),
	)

	function parseDuration(description) {
		if (!description) return "Не указано"
		const match = description.match(/сроки\s*:\s*([^\.\n]+)/i)
		return match ? match[1].trim() : "Не указано"
	}

	function shortDescription(description) {
		if (!description) return "Описание скоро добавим."
		return description.replace(/^✅\s*/u, "").trim()
	}

	$: filtered = normalizedMethods.filter((item) => {
		const byFilter = activeFilter === "all" || item.community.includes(activeFilter)
		const byQuery = !query.trim() || item.searchText.includes(query.trim().toLowerCase())
		return byFilter && byQuery
	})

	function resetFilters() {
		activeFilter = "all"
		query = ""
	}
</script>

<section class="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 md:p-6">
	<h2 class="text-2xl font-bold text-[color:var(--text)] md:text-3xl">Подберите подходящий метод</h2>
	<p class="mt-2 text-[color:var(--muted)]">
		Используйте поиск и фильтр по сообществу. Каждая карточка показывает только главное: суть метода,
		сроки и для кого он чаще подходит.
	</p>

	<div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
		<input
			type="search"
			placeholder="Поиск по названию или описанию метода"
			aria-label="Поиск по методам"
			bind:value={query}
			class="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-[color:var(--text)]"
		/>
		<button
			type="button"
			on:click={resetFilters}
			class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-black"
		>
			Сбросить
		</button>
	</div>

	<div class="mt-4 flex flex-wrap gap-2">
		<button
			type="button"
			on:click={() => (activeFilter = "all")}
			class={`rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm ${
				activeFilter === "all"
					? "bg-[color:var(--text)] text-[color:var(--bg)]"
					: "bg-[color:var(--surface)] text-[color:var(--text)]"
			}`}
		>
			Все ({normalizedMethods.length})
		</button>
		{#each communities as community}
			<button
				type="button"
				on:click={() => (activeFilter = community)}
				class={`rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm ${
					activeFilter === community
						? "bg-[color:var(--text)] text-[color:var(--bg)]"
						: "bg-[color:var(--surface)] text-[color:var(--text)]"
				}`}
			>
				{community} ({counts[community] || 0})
			</button>
		{/each}
	</div>

	<p class="mt-3 text-sm text-[color:var(--muted)]">
		Найдено методов: <span class="font-semibold text-[color:var(--text)]">{filtered.length}</span>
	</p>
</section>

<section class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
	{#each filtered as item}
		<article class="flex h-full flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
			<div class="p-5">
				<h3 class="text-lg font-semibold leading-tight text-[color:var(--text)]">{item.title}</h3>
				<p class="mt-2 line-clamp-3 text-sm text-[color:var(--muted)]">{shortDescription(item.description)}</p>

				<div class="mt-4 space-y-2 text-sm">
					<p class="text-[color:var(--muted)]">
						Формат: <b class="text-[color:var(--text)]">{item.community.join(", ") || "Универсальный"}</b>
					</p>
					<p class="text-[color:var(--muted)]">
						Сроки: <b class="text-[color:var(--text)]">{parseDuration(item.description)}</b>
					</p>
				</div>
			</div>

			<div class="mt-auto border-t border-[color:var(--border)] p-4">
				<a
					href={`/methods/${item.slug}/`}
					class="inline-flex w-full items-center justify-center rounded-lg bg-[#10a8ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d9aed]"
				>
					Смотреть
				</a>
			</div>
		</article>
	{/each}
</section>

{#if filtered.length === 0}
	<div class="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-center text-[color:var(--muted)]">
		Ничего не найдено. Попробуйте убрать фильтр или изменить поисковый запрос.
	</div>
{/if}
