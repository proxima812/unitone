// @ts-nocheck -- Bun test globals are not part of Astro's TypeScript environment.
import { describe, expect, test } from "bun:test";

const root = new URL("../../../", import.meta.url);

describe("favorite button presentation", () => {
	test("uses a visible filled icon and green selected state in every favorite button template", async () => {
		const sources = await Promise.all([
			Bun.file(new URL("src/components/catalog/FavoriteButton.astro", root)).text(),
			Bun.file(new URL("src/components/catalog/PersonalShelf.astro", root)).text(),
			Bun.file(new URL("src/pages/app/favorites.astro", root)).text(),
		]);

		for (const source of sources) {
			expect(source).toContain("aria-pressed:bg-green-");
			expect(source).toContain("aria-pressed:text-green-");
			expect(source).toMatch(/data-favorite-icon="filled"[^>]* hidden(?: |>)/u);
			expect(source).not.toMatch(/data-favorite-icon="filled"[^>]*class="[^"]*\bhidden\b/u);
		}
	});

	test("does not render the removed introductory copy on the app home page", async () => {
		const source = await Bun.file(new URL("src/pages/app/index.astro", root)).text();

		expect(source).not.toContain(">Unity One<");
		expect(source).not.toMatch(/<h1[^>]*>Материалы<\/h1>/u);
		expect(source).not.toContain("Найдите сообщество или способ работы по названию либо жизненной ситуации.");
	});
});
