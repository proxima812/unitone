// @ts-nocheck -- Bun test globals are not part of Astro's TypeScript environment.
import { describe, expect, test } from "bun:test";

const root = new URL("../../../", import.meta.url);

describe("app shell", () => {
	test("renders the approved title, subtitle, and five navigation destinations", async () => {
		const home = await Bun.file(new URL("src/pages/app/index.astro", root)).text();
		const nav = await Bun.file(new URL("src/components/app/AppBottomNav.astro", root)).text();

		expect(home).toContain("12 шагов");
		expect(home).toContain("материалы · посты · полезные инструменты · опыт · и прочее");
		for (const href of ["/app/", "/app/materials/", "/app/create/", "/app/posts/", "/app/profile/"]) {
			expect(nav).toContain(`href="${href}"`);
		}
		expect(nav).toContain('aria-label="Основная навигация"');
		expect(nav).toContain("aria-current={isActive(");
		expect(nav).toContain("bottom-[max(.75rem,env(safe-area-inset-bottom))]");
	});

	test("uses the approved public app name and reserves the bottom safe area", async () => {
		const layout = await Bun.file(new URL("src/layouts/AppLayout.astro", root)).text();

		expect(layout).toContain('description = "12 шагов"');
		expect(layout).toContain('const pageTitle = `${title} — 12 шагов`;');
		expect(layout).toContain('<meta property="og:site_name" content="12 шагов" />');
		expect(layout).toContain("pb-[calc(7rem+env(safe-area-inset-bottom))]");
		expect(layout).not.toContain("Unity One");
	});
});
