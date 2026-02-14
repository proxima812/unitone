import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import embeds from "astro-embed/integration";
import icon from "astro-icon";
import indexnow from "astro-indexnow";
import metaTags from "astro-meta-tags";
import astroNoEmail from "astro-noemail";
import { defineConfig } from "astro/config";

const enableIndexNow = process.env.INDEXNOW_ENABLED === "true";

function shouldIncludeInSitemap(page) {
	try {
		const pathname = new URL(page).pathname;
		return !pathname.startsWith("/admin") && !pathname.startsWith("/api");
	} catch {
		return !page.startsWith("/admin") && !page.startsWith("/api");
	}
}

function sanitizeSitemapItem(item) {
	try {
		const pathname = new URL(item.url, "https://unity-one.space").pathname;
		if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return undefined;
		return item;
	} catch {
		return item;
	}
}

export default defineConfig({
	// https://unity-one.space/
	// https://unity-one.space
	site: "https://unity-one.space",
	compressHTML: true,
	vite: {
		plugins: [tailwindcss()],
	},
	devToolbar: {
		enabled: true,
	},
	prefetch: {
		defaultStrategy: "hover",
		prefetchAll: false,
	},
	integrations: [
		embeds(),
		mdx(),
		sitemap({
			filter: shouldIncludeInSitemap,
			serialize: sanitizeSitemapItem,
		}),
		icon(),
		metaTags(),
		react(),
		astroNoEmail(),
		...(enableIndexNow
			? [
					indexnow({
						key: "768bcd3539c74c6198b5f8a42ef7a64c",
					}),
				]
			: []),
	],
	output: "static",
	adapter: vercel(),
});
