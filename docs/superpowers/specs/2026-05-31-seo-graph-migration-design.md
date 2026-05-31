# SEO Graph Migration

## Goal

Replace the existing SEO implementation with `@jdevalk/astro-seo-graph` as the single SEO layer.

## Scope

- Install `@jdevalk/astro-seo-graph`.
- Remove the standalone `astro-indexnow` dependency and configuration.
- Configure the new integration with IndexNow using the current verification key.
- Replace the existing `src/components/SEO.astro` implementation with a new local adapter around the package API, then remove the old component.
- Preserve current page title, description, keywords, robots, canonical URL, Open Graph, Twitter card, verification tags, RSS link, sitemap link, favicon, and generator metadata.
- Move page JSON-LD, breadcrumb JSON-LD, and FAQ JSON-LD into the SEO graph.
- Keep the visible breadcrumb navigation unchanged.
- Replace `public/og.png` with the provided `Frame 956.png` asset.
- Do not add the optional agent-ready endpoints during this migration.

## Data Flow

`Layout.astro` remains the common entry point for SEO data. It builds shared SEO props for each page, receives breadcrumb graph data from the breadcrumb helper, and renders the new adapter in `<head>`. The FAQ page passes FAQ graph data through `Layout.astro`.

## Validation

- Run `git diff --check`.
- Run `bun run build`.
- Confirm the generated HTML contains one SEO graph JSON-LD block without the old standalone FAQ or breadcrumb schema scripts.
- Confirm `public/og.png` remains `1200x630`.
