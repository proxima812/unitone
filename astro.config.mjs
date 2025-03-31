import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import vercel from "@astrojs/vercel"
import keystatic from "@keystatic/astro"
import tailwindcss from "@tailwindcss/vite"
import icon from "astro-icon"
import metaTags from "astro-meta-tags"
import { defineConfig } from "astro/config"

export default defineConfig({
	site: "https://unitone.vercel.app",
	vite: {
		plugins: [tailwindcss()],
	},
	prefetch: {
		defaultStrategy: "viewport",
		prefetchAll: true,
	},
	integrations: [mdx(), sitemap(), keystatic(), icon(), metaTags(), react()],
	output: "static",
	adapter: vercel(),
})
