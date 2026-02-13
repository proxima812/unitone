export type ArticleStatus = "draft" | "published";

export interface AdminUser {
  id: string;
  telegram_id: number;
  username: string | null;
  role: "admin" | string;
  is_active: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_html: string;
  author_name: string | null;
  status: ArticleStatus;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface TelegramVerifyRequest {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
}

export interface SessionPayload {
  telegramId: number;
  username: string | null;
  role: string;
  csrfToken: string;
  iat: number;
}

export interface EditorLinkMeta {
  href: string;
  displayText: string;
  host: string;
  faviconUrl: string;
  isExternal: boolean;
}
