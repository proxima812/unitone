import type { APIRoute } from "astro";
import { assertCsrf, getSession } from "@/lib/auth/session";
import { listAdminArticles, upsertArticle } from "@/lib/db/articles";
import { badRequest, json, unauthorized } from "@/lib/security/api";
import type { ArticleStatus } from "@/lib/types";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) return unauthorized();

  try {
    const articles = await listAdminArticles();
    return json({ items: articles });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to fetch articles" }, 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) return unauthorized();
  if (!assertCsrf(request, session)) return json({ error: "Invalid CSRF token" }, 403);

  let body: {
    title?: string;
    slug?: string;
    description?: string;
    content_html?: string;
    author_name?: string;
    status?: ArticleStatus;
  };

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON payload");
  }

  if (!body.title?.trim()) return badRequest("title is required");
  if (!body.content_html?.trim()) return badRequest("content_html is required");

  try {
    const article = await upsertArticle({
      title: body.title,
      slug: body.slug,
      description: body.description,
      content_html: body.content_html,
      author_name: body.author_name,
      status: body.status || "draft",
    });
    return json({ item: article }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to create article" }, 500);
  }
};
