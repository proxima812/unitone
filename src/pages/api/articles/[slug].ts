import type { APIRoute } from "astro";
import { getPublishedArticleBySlug } from "@/lib/db/articles";
import { json } from "@/lib/security/api";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, 400);

  try {
    const item = await getPublishedArticleBySlug(slug);
    if (!item) return json({ error: "Article not found" }, 404);
    return json({ item });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load article" }, 500);
  }
};
