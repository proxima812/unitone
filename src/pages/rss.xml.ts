import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
	const posts = (await getCollection("archive")).sort((a, b) => {
		const aTime = a.data.pubDate ? new Date(a.data.pubDate).getTime() : 0;
		const bTime = b.data.pubDate ? new Date(b.data.pubDate).getTime() : 0;
		return bTime - aTime;
	});

	return rss({
		title: "Unity One Archive",
		description: "Локальные MDX-статьи проекта Unity One.",
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description || "",
			pubDate: post.data.pubDate ? new Date(post.data.pubDate) : undefined,
			link: `/archive/${post.id}/`,
		})),
	});
}
