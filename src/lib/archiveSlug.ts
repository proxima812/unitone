const MARKDOWN_EXTENSION = /\.(?:md|mdx)$/i;

export function getArchiveSlug(id: string): string {
	return id.replace(MARKDOWN_EXTENSION, "");
}
