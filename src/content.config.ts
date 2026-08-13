import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const archive = defineCollection({
	loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/content/archive/" }),
	schema: z
		.object({
			title: z.string(),
			description: z.string().optional(),
			keywords: z.string().optional(),
			pubDate: z.union([z.string(), z.date()]),
			author: z.array(z.string()).optional(),
			relatedPosts: z.array(z.string()).optional(),
			ogImage: z.string().optional(),
			tags: z.array(z.string()).optional(),
		})
		.transform((data) => ({
			...data,
			date: new Date(data.pubDate),
			publishedDate: new Date(data.pubDate),
		})),
});

const authors = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/authors/" }),
	schema: z.object({
		name: z.string(),
		avatarUrl: z.string(),
	}),
});

const communities = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/communities/" }),
	schema: z.object({
		id: z.string(),
		title: z.string(),
		description: z.string(),
		since: z.string(),
		wikipedia: z.string(),
		find: z.boolean(),
		category: z.string(),
	}),
});

const methods = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/methods/" }),
	schema: z.object({
		slug: z.string(),
		title: z.string(),
		description: z.string(),
		community: z.array(z.string()),
	}),
});

export const collections = { archive, authors, communities, methods };
