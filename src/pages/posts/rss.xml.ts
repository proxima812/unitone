import rss from "@astrojs/rss"
import { getCollection } from "astro:content"

const dateNow = "Mon, 03 Feb 2025 00:00:00 +0000"
export async function GET(context: any) {
	const blog = await getCollection("centers")
	return rss({
		title: "RSS tatars.kz центры",
		description: "Татаро-Башкирские центры",
		site: context.site,
		// @ts-ignore
		items: blog.map((post: any) => ({
			title: post.data.title,
			pubDate: post.data.pubDate || dateNow,
			description: post.data.description,

			link: `/centers/${post.id}/`,
		})),
	})
}
