import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import embeds from "astro-embed/integration";
import icon from "astro-icon";
import metaTags from "astro-meta-tags";
import astroNoEmail from "astro-noemail";
import indexnow from "astro-indexnow";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://unitone.vercel.app",
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
