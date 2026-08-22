import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import dualmark from "@dualmark/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://unityone.appwrite.network",
	output: "static",
	adapter: node({ mode: "standalone" }),
	integrations: [
		mdx(),
		dualmark({
			siteUrl: "https://unityone.appwrite.network",
			collections: {
				archive: {
					converter: "blog",
					listingMetadata: {
						title: "Архив Unity One",
						description: "Архив материалов Unity One.",
					},
				},
				communities: {
					converter: "docs",
					route: "app/communities",
					slugStrategy: "single",
					listingMetadata: {
						title: "Сообщества",
						description: "Каталог сообществ взаимопомощи Unity One.",
					},
				},
				methods: {
					converter: "docs",
					route: "app/methods",
					slugStrategy: "single",
					listingMetadata: {
						title: "Методы",
						description: "Каталог методов восстановления Unity One.",
					},
				},
			},
			llmsTxt: {
				enabled: true,
				brandName: "Unity One",
				description: "Каталог сообществ взаимопомощи и методов восстановления.",
				sections: [
					{
						title: "Каталог",
						links: [
							{
								title: "Сообщества",
								href: "https://unityone.appwrite.network/app/communities.md",
							},
							{
								title: "Методы",
								href: "https://unityone.appwrite.network/app/methods.md",
							},
						],
					},
				],
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
