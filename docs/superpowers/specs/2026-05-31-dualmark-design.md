# DualMark Astro Integration

## Goal

Add DualMark markdown twins and `llms.txt` generation without changing the existing SEO graph implementation.

## Scope

- Install `@dualmark/astro`.
- Add `dualmark()` to `astro.config.mjs`.
- Configure the existing `archive` content collection with the `blog` converter.
- Generate markdown twin routes for archive entries and the archive listing.
- Enable `/llms.txt` with the Unity One brand name and project description.
- Keep middleware disabled for the current static build.
- Preserve the existing `public/ai.txt`.

## Validation

- Run `git diff --check`.
- Run `bun run build`.
- Confirm `dist/archive.md`, an archive entry markdown twin, and `dist/llms.txt` exist.
- Confirm the existing SEO graph build still succeeds.
