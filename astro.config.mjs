import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import embeds from "astro-embed/integration";
import icon from "astro-icon";
import indexnow from "astro-indexnow";
import metaTags from "astro-meta-tags";
import astroNoEmail from "astro-noemail";
import { defineConfig } from "astro/config";

export default defineConfig({
	// https://unity-one.space/
	// https://unity-one.space
	site: "https://unity-one.space",
	vite: {
		plugins: [tailwindcss()],
	},
	devToolbar: {
		enabled: true,
	},
	prefetch: {
		defaultStrategy: "viewport",
		prefetchAll: true,
	},
	integrations: [
		embeds(),
		mdx(),
		sitemap(),
		icon(),
		metaTags(),
		react(),
		svelte(),
		astroNoEmail(),
		indexnow({
			key: "768bcd3539c74c6198b5f8a42ef7a64c",
		}),
	],
	output: "static",
	adapter: vercel(),
});
