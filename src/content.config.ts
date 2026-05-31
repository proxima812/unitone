import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

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
			ogImage: z.any().optional(),
			tags: z.array(z.string()).optional(),
			// viewMainPage: z.boolean().default(false).optional(),
		})
		.transform((data) => ({
			...data,
			date: new Date(data.pubDate),
			publishedDate: new Date(data.pubDate),
		})),
});

export const collections = { archive };
