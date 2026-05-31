# Methods, Ads, and Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify incomplete method pages, highlight the archive advertising block, and add four web search actions to every finder card.

**Architecture:** Keep the existing static Astro structure. Update catalog content in `src/data/methods.ts` and make narrow template changes in the two existing Astro pages without adding components or dependencies.

**Tech Stack:** Astro, TypeScript, Tailwind CSS v4

---

### Task 1: Clarify incomplete methods

**Files:**
- Modify: `src/data/methods.ts`

- [x] Replace only the existing generic placeholder body with the approved assumption section.
- [x] Run `rg -n "Описание метода сохранено в каталоге" src/data/methods.ts` and confirm there are no matches.

### Task 2: Highlight archive advertising

**Files:**
- Modify: `src/pages/archive/[slug].astro`

- [x] Change the existing advertising aside to green border and background utility classes.
- [x] Preserve its text, spacing, and structure.

### Task 3: Add finder search actions

**Files:**
- Modify: `src/pages/finder.astro`

- [x] Add encoded search URLs for Google, Yandex, Bing, and DuckDuckGo to each prepared community.
- [x] Render all four search links in every card while preserving the Wikipedia action.

### Task 4: Verify and commit

**Files:**
- Include user change: `src/components/Article.astro`

- [x] Run `git diff --check`.
- [x] Run `bun run build`.
- [x] Review `git diff --stat` and commit the scoped implementation plus the user-approved `Article.astro` change.
