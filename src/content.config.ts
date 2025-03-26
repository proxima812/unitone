import { glob } from "astro/loaders"
import { defineCollection, z } from "astro:content"

const posts = defineCollection({
	loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/posts/" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.union([z.string(), z.date()]),
		ogImage: z.any().optional(),
	}),
})



const pages = defineCollection({
	loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/pages/" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		// keyswords: z.string().default("").optional(),
		ogImage: z.any().optional(),
	}),
})

export const collections = { posts, pages }
