import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import compress from "@playform/compress";
import tailwindcss from "@tailwindcss/vite";
import dualmark from "@dualmark/astro";
import embeds from "astro-embed/integration";
import feedKit from "astro-feed-kit";
import icon from "astro-icon";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
import astroNoEmail from "astro-noemail";
import { defineConfig } from "astro/config";
import { isArchiveEntryPublished } from "./src/lib/archivePublish.mjs";

const enableIndexNow = process.env.INDEXNOW_ENABLED === "true";

export default defineConfig({
	site: "https://unityone.space",
	compressHTML: true,
	markdown: {
		processor: satteri(),
	},
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				fs: "node:fs",
			},
		},
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
		dualmark({
			siteUrl: "https://unityone.space",
			collections: {
				archive: {
					converter: "blog",
					route: "archive",
					slugStrategy: "single",
					filter: isArchiveEntryPublished,
				},
			},
			llmsTxt: {
				enabled: true,
				brandName: "Unity One",
				description:
					"Единое пространство о программе 12 шагов: статьи, методы, сообщества и практики для личных изменений.",
				sections: [
					{
						title: "Основные разделы",
						links: [
							{ title: "Архив статей", href: "https://unityone.space/archive.md" },
							{ title: "Программа 12 шагов", href: "https://unityone.space/12-shagov/" },
							{ title: "Методы", href: "https://unityone.space/methods/" },
							{ title: "Сообщества", href: "https://unityone.space/communities/" },
							{ title: "Подбор группы", href: "https://unityone.space/finder/" },
							{ title: "FAQ", href: "https://unityone.space/faq/" },
						],
					},
				],
			},
			middleware: {
				injectLinkHeader: false,
			},
		}),
		feedKit({
			sources: [
				{
					collection: "archive",
					filter: isArchiveEntryPublished,
					resolveItem: ({ entry, siteUrl }) => ({
						link: new URL(`/archive/${entry.id}/`, siteUrl).toString(),
					}),
				},
			],
			feedOptions: {
				title: "Unity One Archive",
				description: "Статьи проекта Unity One о программе 12 шагов.",
				link: "https://unityone.space",
			},
		}),
		compress({
			Exclude: (file) => file.endsWith(".ts"),
			CSS: false,
		}),
	],
	output: "static",
});
