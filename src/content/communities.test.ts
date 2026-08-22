// Bun provides this module at test runtime; the project intentionally has no Bun type dependency.
// @ts-ignore
import { describe, expect, test } from "bun:test";
// Bun resolves this built-in module during tests; production dependencies do not include Node typings.
// @ts-ignore
import { readdir, readFile } from "node:fs/promises";

interface CommunitySource {
	title: string;
	url: string;
}

interface CommunityFrontmatter {
	id: string;
	sources?: CommunitySource[];
}

async function readCommunities(): Promise<Array<{ file: string; data: CommunityFrontmatter }>> {
	const directory = new URL("./communities/", import.meta.url);
	const files = (await readdir(directory)).filter((file: string) => file.endsWith(".mdx")).sort();

	return Promise.all(files.map(async (file: string) => {
		const source = await readFile(new URL(`./communities/${file}`, import.meta.url), "utf8");
		const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/);
		if (!frontmatter) throw new Error(`Missing JSON frontmatter: ${file}`);
		return { file, data: JSON.parse(frontmatter[1]) as CommunityFrontmatter };
	}));
}

describe("community sources", () => {
	test("every production community has at least one unique valid source", async () => {
		for (const { file, data } of await readCommunities()) {
			expect(data.sources?.length, `${file} must declare sources`).toBeGreaterThanOrEqual(1);

			const urls = (data.sources ?? []).map((source) => {
				expect(source.title.trim().length, `${file} source title`).toBeGreaterThan(0);
				expect(() => new URL(source.url), `${file} source URL`).not.toThrow();
				return source.url;
			});

			expect(new Set(urls).size, `${file} source URLs must be unique`).toBe(urls.length);
		}
	});
});
