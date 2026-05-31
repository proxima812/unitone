import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import embeds from "astro-embed/integration";
import icon from "astro-icon";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
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
		seoGraph({
			validateH1: false,
			validateUniqueMetadata: false,
			validateImageAlt: false,
			validateMetadataLength: false,
			validateInternalLinks: false,
			...(enableIndexNow
				? {
						indexNow: {
							key: "839ab5750df943cf871f6ecf8519e449",
							host: "unityone.space",
							siteUrl: "https://unityone.space",
						},
					}
				: {}),
		}),
	],
	output: "static",
});
