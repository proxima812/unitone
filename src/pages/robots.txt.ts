import type { APIRoute } from "astro"

const getRobotsTxt = (sitemapURL: URL) => `

User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
Host: ${sitemapURL.origin.replace(/^https?:\/\//, "")}
`

export const GET: APIRoute = ({ site }) => {
	const sitemapURL = new URL("sitemap-index.xml", site)
	return new Response(getRobotsTxt(sitemapURL))
}
