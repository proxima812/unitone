import type { APIRoute } from "astro";
import { getReleaseMeta } from "@/lib/release";

export const prerender = false;

export const GET: APIRoute = async () => {
	const { version } = getReleaseMeta();

	return new Response(
		JSON.stringify({
			schemaVersion: 1,
			label: "version",
			message: `v${version}`,
			color: "0ea5e9",
			cacheSeconds: 300,
		}),
		{
			headers: {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store, max-age=0, must-revalidate",
			},
		},
	);
};
