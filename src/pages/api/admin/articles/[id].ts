import type { APIRoute } from "astro";
import { assertCsrf, getSession } from "@/lib/auth/session";
import { deleteArticle, getAdminArticleById, upsertArticle } from "@/lib/db/articles";
import { badRequest, json, methodNotAllowed, unauthorized } from "@/lib/security/api";
import type { ArticleStatus } from "@/lib/types";

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  const method = context.request.method.toUpperCase();

  if (!["PATCH", "DELETE"].includes(method)) return methodNotAllowed();

  const session = getSession(context.cookies);
  if (!session) return unauthorized();
  if (!assertCsrf(context.request, session)) return json({ error: "Invalid CSRF token" }, 403);

  const id = context.params.id;
  if (!id) return badRequest("id is required");

  if (method === "DELETE") {
    try {
      await deleteArticle(id);
      return json({ ok: true });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Failed to delete article" }, 500);
    }
  }

  let body: {
    title?: string;
    slug?: string;
    description?: string;
    content_html?: string;
    author_name?: string;
    status?: ArticleStatus;
  };

  try {
    body = await context.request.json();
  } catch {
    return badRequest("Invalid JSON payload");
  }

  if (!body.title?.trim()) return badRequest("title is required");
  if (!body.content_html?.trim()) return badRequest("content_html is required");

  try {
    const existing = await getAdminArticleById(id);
    if (!existing) return json({ error: "Article not found" }, 404);

    const article = await upsertArticle({
      id,
      title: body.title,
      slug: body.slug,
      description: body.description,
      content_html: body.content_html,
      author_name: body.author_name,
      status: body.status || existing.status,
    });
    return json({ item: article });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to update article" }, 500);
  }
};
