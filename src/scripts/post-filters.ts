function readTags(card: HTMLElement): string[] {
	try {
		const tags: unknown = JSON.parse(card.dataset.tags ?? "[]");
		return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
	} catch {
		return [];
	}
}

for (const filters of document.querySelectorAll<HTMLElement>("[data-post-filters]")) {
	if (filters.dataset.ready === "true") continue;
	filters.dataset.ready = "true";

	const targetId = filters.dataset.targetId;
	const target = targetId ? document.getElementById(targetId) : null;
	if (!target) continue;

	let activeCategory = "";
	let activeTag = "";
	const cards = [...target.querySelectorAll<HTMLElement>("[data-publication-card]")];
	const emptyState = target.querySelector<HTMLElement>("[data-filter-empty]");

	const applyFilters = () => {
		let visibleCount = 0;
		for (const card of cards) {
			const matchesCategory = !activeCategory || card.dataset.category === activeCategory;
			const matchesTag = !activeTag || readTags(card).includes(activeTag);
			card.hidden = !(matchesCategory && matchesTag);
			if (!card.hidden) visibleCount += 1;
		}
		if (emptyState) emptyState.hidden = visibleCount > 0;
	};

	for (const button of filters.querySelectorAll<HTMLButtonElement>("button[data-filter-kind]")) {
		button.addEventListener("click", () => {
			const kind = button.dataset.filterKind;
			const value = button.dataset.filterValue ?? "";
			if (kind === "category") activeCategory = value;
			if (kind === "tag") activeTag = value;

			for (const peer of filters.querySelectorAll<HTMLButtonElement>(`button[data-filter-kind="${kind}"]`)) {
				peer.setAttribute("aria-pressed", String((peer.dataset.filterValue ?? "") === value));
			}
			applyFilters();
		});
	}
}
