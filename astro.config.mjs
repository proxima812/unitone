import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import embeds from "astro-embed/integration";
import icon from "astro-icon";
import indexnow from "astro-indexnow";
import astroNoEmail from "astro-noemail";
import { defineConfig } from "astro/config";

const enableIndexNow = process.env.INDEXNOW_ENABLED === "true";

export default defineConfig({
	site: "https://unityone.space",
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
		sitemap(),
		icon(),
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
});
