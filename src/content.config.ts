import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const archive = defineCollection({
	loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/archive/" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		keywords: z.string().optional(),
		pubDate: z.union([z.string(), z.date()]).optional(),
		author: z.array(z.string()).optional(),
		relatedPosts: z.array(z.string()).optional(),
		ogImage: z.any().optional(),
		tags: z.array(z.string()).optional(),
		// viewMainPage: z.boolean().default(false).optional(),
	}),
});

export const collections = { archive };
