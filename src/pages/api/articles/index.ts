import type { APIRoute } from "astro";
import { listPublishedArticles } from "@/lib/db/articles";
import { json } from "@/lib/security/api";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const items = await listPublishedArticles();
    return json({ items });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load published articles" }, 500);
  }
};
