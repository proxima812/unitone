import { sanitizeArticleHtml } from "@/lib/content/sanitize";
import { env } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Article, ArticleStatus } from "@/lib/types";

const TABLE = env.supabaseArticlesTable;

function withSchemaHint(error: unknown) {
  const err = error as { code?: string; message?: string };
  if (err?.code === "PGRST205") {
    throw new Error(
      `Supabase table "${TABLE}" was not found. Create it first or set SUPABASE_ARTICLES_TABLE in .env.`,
    );
  }
  throw error;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listPublishedArticles() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) withSchemaHint(error);
  return (data ?? []) as Article[];
}

export async function listAdminArticles() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) withSchemaHint(error);
  return (data ?? []) as Article[];
}

export async function getPublishedArticleBySlug(slug: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) withSchemaHint(error);
  return (data ?? null) as Article | null;
}

export async function getAdminArticleById(id: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) withSchemaHint(error);
  return (data ?? null) as Article | null;
}

async function resolveUniqueSlug(baseSlug: string, excludeId?: string) {
  const supabase = getSupabaseServerClient();
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase.from(TABLE).select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== "PGRST116") withSchemaHint(error);
    if (!data) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export interface UpsertArticleInput {
  id?: string;
  title: string;
  slug?: string;
  description?: string;
  content_html: string;
  author_name?: string;
  status: ArticleStatus;
}

export async function upsertArticle(input: UpsertArticleInput) {
  const supabase = getSupabaseServerClient();
  const baseSlug = normalizeSlug(input.slug || input.title);
  const uniqueSlug = await resolveUniqueSlug(baseSlug || "post", input.id);
  const now = new Date().toISOString();
  const contentHtml = sanitizeArticleHtml(input.content_html);

  const payload = {
    title: input.title.trim(),
    slug: uniqueSlug,
    description: input.description?.trim() || null,
    content_html: contentHtml,
    author_name: input.author_name?.trim() || null,
    status: input.status,
    published_at: input.status === "published" ? now : null,
    updated_at: now,
  };

  if (input.id) {
    const { data, error } = await supabase.from(TABLE).update(payload).eq("id", input.id).select("*").single();
    if (error) withSchemaHint(error);
    return data as Article;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, created_at: now })
    .select("*")
    .single();
  if (error) withSchemaHint(error);
  return data as Article;
}

export async function deleteArticle(id: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) withSchemaHint(error);
}
