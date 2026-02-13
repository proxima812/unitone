-- Enable extension for UUID generation
create extension if not exists pgcrypto;

-- Admin users whitelist
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Articles source of truth
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  content_html text not null,
  author_name text,
  status text not null check (status in ('draft', 'published')) default 'draft',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Optional link metadata/cache table
create table if not exists public.article_links (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  url text not null,
  host text not null,
  display_text text not null,
  favicon_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_articles_status_published_at on public.articles(status, published_at desc);
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_article_links_article_id on public.article_links(article_id);

-- Optional RLS (recommended). If you use service role on server API, this is enough for public reads.
alter table public.articles enable row level security;
alter table public.admin_users enable row level security;
alter table public.article_links enable row level security;

-- Public can read only published articles
create policy if not exists "public_can_read_published_articles"
on public.articles
for select
using (status = 'published');

-- Public can read link cache rows (optional)
create policy if not exists "public_can_read_article_links"
on public.article_links
for select
using (true);
