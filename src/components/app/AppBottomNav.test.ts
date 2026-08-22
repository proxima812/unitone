// @ts-nocheck -- Bun test globals are not part of Astro's TypeScript environment.
import { describe, expect, test } from "bun:test";

describe("app shell", () => {
	test("renders the approved title, subtitle, and five navigation destinations", async () => {
		const root = new URL("../../../", import.meta.url);
		const home = await Bun.file(new URL("src/pages/app/index.astro", root)).text();
		const nav = await Bun.file(new URL("src/components/app/AppBottomNav.astro", root)).text();

		expect(home).toContain("12 шагов");
		expect(home).toContain("материалы · посты · полезные инструменты · опыт · и прочее");
		for (const href of ["/app/", "/app/materials/", "/app/create/", "/app/posts/", "/app/profile/"]) {
			expect(nav).toContain(`href="${href}"`);
		}
	});
});
