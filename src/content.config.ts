import { glob } from "astro/loaders"
import { defineCollection, z } from "astro:content"

const archive = defineCollection({
	loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/archive/" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
    pubDate: z.union([z.string(), z.date()]).optional(),
    author: z.string().default('UnitOne').optional(),
		ogImage: z.any().optional(),
	}),
})

const methods = defineCollection({
	loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/methods/" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		ogImage: z.any().optional(),
		community: z.array(z.string()).optional(),
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

export const collections = { archive, pages, methods }
