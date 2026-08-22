# User Content Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Unity One Telegram Mini App into «12 шагов» with moderated materials, posts, tools, experience, Telegram profiles, authoring, and in-app administration.

**Architecture:** Keep Astro SSR and the existing server-side Telegram verification. Add a focused publication domain module and Appwrite repository behind API routes; render public catalogs server-side and use small browser scripts only for Telegram-authenticated authoring, profile, and moderation actions.

**Tech Stack:** Astro 7, TypeScript, Tailwind CSS v4, Bun test, Appwrite REST API, Telegram Mini App `initData`, restricted Markdown.

**Spec:** `docs/superpowers/specs/2026-08-22-user-content-platform-design.md`

## Global Constraints

- Public application title is exactly «12 шагов».
- Home subtitle is exactly «материалы · посты · полезные инструменты · опыт · и прочее».
- Publication types are exactly `material`, `post`, `tool`, and `experience`.
- Publication statuses are exactly `draft`, `review`, `published`, and `rejected`.
- Only posts have a category and tags.
- User content supports only H2, H3, bold, italic, links, unordered lists, and ordered lists.
- Images, arbitrary HTML, code, and tables are forbidden.
- Published content is public; all author and moderator mutations require verified Telegram `initData`.
- Moderator access comes only from the comma-separated `ADMIN_TELEGRAM_IDS` environment variable.
- Preserve all unrelated dirty-worktree changes and do not include them in task commits.
- Do not add a rich-text framework or Appwrite SDK; the existing REST and browser-script patterns are sufficient.

---

### Task 1: Publication domain, validation, and Markdown rendering

**Files:**
- Create: `src/lib/publications/types.ts`
- Create: `src/lib/publications/validation.ts`
- Create: `src/lib/publications/markdown.ts`
- Test: `src/lib/publications/validation.test.ts`
- Test: `src/lib/publications/markdown.test.ts`

**Interfaces:**
- Produces: `PublicationType`, `PublicationStatus`, `PublicationRecord`, `PublicationInput`, `validatePublicationInput(input)`, `validateStatusTransition(actor, from, to)`, `renderPublicationMarkdown(source)`, and `plainTextFromMarkdown(source)`.
- Consumes: no application modules.

- [ ] **Step 1: Write failing domain validation tests**

```ts
// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { validatePublicationInput, validateStatusTransition } from "./validation";

describe("publication validation", () => {
	test("accepts category and tags only for posts", () => {
		expect(validatePublicationInput({ type: "post", title: "Заголовок", summary: "Кратко", content: "## Текст", category: "Практика", tags: ["шаги"] }).ok).toBe(true);
		expect(validatePublicationInput({ type: "tool", title: "Инструмент", summary: "Кратко", content: "## Текст", category: "Практика", tags: [] })).toEqual({ ok: false, error: "Категории и теги доступны только для постов." });
	});

	test("allows only the approved moderation transitions", () => {
		expect(validateStatusTransition("author", "draft", "review")).toBe(true);
		expect(validateStatusTransition("admin", "review", "published")).toBe(true);
		expect(validateStatusTransition("author", "review", "draft")).toBe(false);
	});
});
```

- [ ] **Step 2: Run the validation test and verify RED**

Run: `bun test src/lib/publications/validation.test.ts`

Expected: FAIL because `./validation` does not exist.

- [ ] **Step 3: Define the exact publication types**

```ts
export const publicationTypes = ["material", "post", "tool", "experience"] as const;
export const publicationStatuses = ["draft", "review", "published", "rejected"] as const;

export type PublicationType = (typeof publicationTypes)[number];
export type PublicationStatus = (typeof publicationStatuses)[number];
export type PublicationActor = "author" | "admin";

export interface PublicationInput {
	type: PublicationType;
	title: string;
	summary: string;
	content: string;
	category: string;
	tags: string[];
}

export interface PublicationRecord extends PublicationInput {
	id: string;
	status: PublicationStatus;
	authorTelegramId: string;
	authorName: string;
	authorUsername: string;
	authorPhotoUrl: string;
	moderationNote: string;
	createdAt: string;
	updatedAt: string;
	submittedAt: string;
	publishedAt: string;
}

export type PublicPublication = Omit<PublicationRecord, "authorTelegramId">;
```

- [ ] **Step 4: Implement minimal input and transition validation**

Implement `validatePublicationInput` with limits `title: 120`, `summary: 400`, `content: 30000`, `category: 80`, `tag: 40`, maximum `8` unique tags. Trim all scalar fields, normalize tags by trimming and case-insensitive deduplication, require title/summary/content, and return `{ ok: true, value } | { ok: false, error }`. Implement the exact transitions `author: draft|rejected -> review`, `author: rejected -> draft`, `admin: review -> published|rejected`.

- [ ] **Step 5: Run the validation test and verify GREEN**

Run: `bun test src/lib/publications/validation.test.ts`

Expected: PASS.

- [ ] **Step 6: Write failing restricted-Markdown tests**

```ts
// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { renderPublicationMarkdown } from "./markdown";

describe("restricted publication markdown", () => {
	test("renders the supported syntax", () => {
		const html = renderPublicationMarkdown("## Раздел\n\n**жирный** и *курсив*\n\n- один\n- два");
		expect(html).toContain("<h2>Раздел</h2>");
		expect(html).toContain("<strong>жирный</strong>");
		expect(html).toContain("<em>курсив</em>");
		expect(html).toContain("<ul>");
	});

	test("rejects html, images, and unsafe links", () => {
		expect(() => renderPublicationMarkdown("<script>alert(1)</script>")).toThrow("HTML не поддерживается");
		expect(() => renderPublicationMarkdown("![alt](https://example.com/a.jpg)")).toThrow("Изображения не поддерживаются");
		expect(() => renderPublicationMarkdown("[опасно](javascript:alert(1))")).toThrow("Недопустимая ссылка");
	});
});
```

- [ ] **Step 7: Run the Markdown test and verify RED**

Run: `bun test src/lib/publications/markdown.test.ts`

Expected: FAIL because `./markdown` does not exist.

- [ ] **Step 8: Implement the restricted parser without a dependency**

Implement a line-oriented parser that HTML-escapes first, recognizes only `##`, `###`, `- `, and `1. ` blocks, then applies inline `**bold**`, `*italic*`, and `[label](url)` formatting. Validate link protocols through `new URL`; accept only `http:`, `https:`, and `mailto:`. Reject raw `<...>`, image syntax `![`, fenced/backtick code, tables, H1, and H4-H6 before rendering. Export `plainTextFromMarkdown` for emptiness checks and summaries.

- [ ] **Step 9: Run both domain test files**

Run: `bun test src/lib/publications/validation.test.ts src/lib/publications/markdown.test.ts`

Expected: all tests PASS.

- [ ] **Step 10: Commit the domain layer**

```bash
git add src/lib/publications/types.ts src/lib/publications/validation.ts src/lib/publications/markdown.ts src/lib/publications/validation.test.ts src/lib/publications/markdown.test.ts
git commit -m "feat: add publication domain validation"
```

---

### Task 2: Telegram admin authorization and Appwrite publication repository

**Files:**
- Modify: `src/lib/server/telegram.ts`
- Modify: `src/lib/server/appwrite.ts`
- Create: `src/lib/server/publications.ts`
- Test: `src/lib/server/telegram-admin.test.ts`
- Test: `src/lib/server/publications.test.ts`

**Interfaces:**
- Consumes: `PublicationInput`, `PublicationRecord`, `PublicationStatus`, and `PublicationType` from Task 1.
- Produces: `isTelegramAdmin(telegramId)`, `createPublication(profile, input)`, `updatePublication(id, telegramId, input)`, `submitPublication(id, telegramId)`, `moderatePublication(id, action, note)`, `listPublishedPublications(filters)`, `getPublicationForViewer(id, telegramId?)`, `listAuthorPublications(telegramId)`, `getAdminAuthorOverview(telegramId)`, and `listReviewQueue()`.

- [ ] **Step 1: Write failing administrator parsing tests**

```ts
// @ts-nocheck
import { afterEach, describe, expect, test } from "bun:test";
import { isTelegramAdmin } from "./telegram";

afterEach(() => delete process.env.ADMIN_TELEGRAM_IDS);

describe("Telegram administrators", () => {
	test("matches complete IDs from a comma-separated environment value", () => {
		process.env.ADMIN_TELEGRAM_IDS = "123, 456";
		expect(isTelegramAdmin("123")).toBe(true);
		expect(isTelegramAdmin("23")).toBe(false);
	});

	test("grants nobody access when the variable is empty", () => {
		process.env.ADMIN_TELEGRAM_IDS = "";
		expect(isTelegramAdmin("123")).toBe(false);
	});
});
```

- [ ] **Step 2: Run the admin test and verify RED**

Run: `bun test src/lib/server/telegram-admin.test.ts`

Expected: FAIL because `isTelegramAdmin` is not exported.

- [ ] **Step 3: Implement `isTelegramAdmin`**

Read `ADMIN_TELEGRAM_IDS` through the existing `env` helper, split by comma, trim, keep only `/^\d+$/`, and compare exact strings.

- [ ] **Step 4: Run the admin test and verify GREEN**

Run: `bun test src/lib/server/telegram-admin.test.ts`

Expected: PASS.

- [ ] **Step 5: Write repository tests around injected transport**

Refactor `appwriteFetch` to remain private but add a `PublicationTransport` interface in `publications.ts`:

```ts
export interface PublicationTransport {
	create(data: Omit<PublicationRecord, "id">): Promise<PublicationRecord>;
	get(id: string): Promise<PublicationRecord | null>;
	update(id: string, data: Partial<PublicationRecord>): Promise<PublicationRecord>;
	list(queries: string[]): Promise<PublicationRecord[]>;
}
```

Test a real in-memory transport, not mocks, proving that an author cannot update another author's record, a submitted record cannot be edited, public lists include only `published`, and `review -> rejected` requires a moderation note.

- [ ] **Step 6: Run repository tests and verify RED**

Run: `bun test src/lib/server/publications.test.ts`

Expected: FAIL because the repository functions do not exist.

- [ ] **Step 7: Extend Appwrite configuration**

Split the current configuration reader into a shared base plus operation-specific readers so a missing publications collection never breaks profile sync or community proposals. Resolve `publicationsCollectionId` only inside `readPublicationConfig()` from `APPWRITE_PUBLICATIONS_COLLECTION_ID` or `PUBLICATIONS_COLLECTION_ID`. Keep existing aliases unchanged. Add a small exported factory that binds `PublicationTransport` to the configured database and maps Appwrite `$id` to `PublicationRecord.id`.

- [ ] **Step 8: Implement repository policy functions**

Make every write load the current record first and enforce owner/status rules in server code. Generate IDs with `randomUUID()`. Set all timestamps server-side. In public queries require `status=published`; never return `authorTelegramId` from a public DTO. Encode Appwrite query values with `URLSearchParams` instead of interpolating unescaped user input.

- [ ] **Step 9: Run server tests and full unit tests**

Run: `bun test src/lib/server/telegram-admin.test.ts src/lib/server/publications.test.ts && bun test`

Expected: all tests PASS.

- [ ] **Step 10: Commit the repository layer**

```bash
git add src/lib/server/telegram.ts src/lib/server/appwrite.ts src/lib/server/publications.ts src/lib/server/telegram-admin.test.ts src/lib/server/publications.test.ts
git commit -m "feat: add publication repository and admin access"
```

---

### Task 3: Publication, profile, and moderation API routes

**Files:**
- Create: `src/lib/server/api.ts`
- Create: `src/pages/api/publications/index.ts`
- Create: `src/pages/api/publications/[id].ts`
- Create: `src/pages/api/publications/[id]/submit.ts`
- Create: `src/pages/api/profile/publications.ts`
- Create: `src/pages/api/admin/publications/index.ts`
- Create: `src/pages/api/admin/publications/[id]/publish.ts`
- Create: `src/pages/api/admin/publications/[id]/reject.ts`
- Create: `src/pages/api/admin/authors/[telegramId].ts`
- Test: `src/pages/api/publications/publications-api.test.ts`

**Interfaces:**
- Consumes: Task 1 validation and Task 2 repository/auth functions.
- Produces: JSON endpoints from the approved specification and shared `jsonResponse`, `readJsonObject`, and `verifiedRequestProfile` helpers.

- [ ] **Step 1: Write failing API policy tests**

Create request-level tests that call exported route handlers with real `Request` objects and injected repository dependencies. Cover malformed JSON `400`, missing/invalid Telegram data `401`, non-owner update `403`, status conflict `409`, validation error `422`, and successful create `201`.

```ts
test("does not accept author identity from the request body", async () => {
	const response = await callCreate({ initData: validInitData, type: "post", title: "Пост", summary: "Кратко", content: "## Текст", category: "Опыт", tags: [], authorTelegramId: "999" });
	const payload = await response.json();
	expect(response.status).toBe(201);
	expect(payload.publication.authorName).toBe("Verified User");
	expect(payload.publication).not.toHaveProperty("authorTelegramId");
});
```

- [ ] **Step 2: Run the API test and verify RED**

Run: `bun test src/pages/api/publications/publications-api.test.ts`

Expected: FAIL because the routes do not exist.

- [ ] **Step 3: Add shared API response and auth helpers**

`verifiedRequestProfile(request, body)` must read only `body.initData`, call `verifyTelegramInitData`, convert through `telegramProfileData`, and call `upsertTelegramProfile`. `jsonResponse` always sets `application/json; charset=utf-8` and `Cache-Control: no-store` for authenticated responses.

- [ ] **Step 4: Implement public list/detail and author CRUD routes**

Use `export const prerender = false`. `GET /api/publications` accepts only `type`, `category`, and `tag`. `POST` creates `draft`. `PATCH /api/publications/[id]` accepts content fields only. `POST .../submit` performs the exact status transition and returns the updated record.

- [ ] **Step 5: Implement profile and admin routes**

Admin routes verify `initData`, then call `isTelegramAdmin` before accessing the queue. Reject requires a trimmed non-empty `moderationNote` of at most 1000 characters. Publish ignores any client-supplied dates and sets `publishedAt` in the repository. `GET /api/admin/authors/[telegramId]` returns that author's profile summary and publications only after the same admin check; this ID is never exposed by a public endpoint.

- [ ] **Step 6: Run API tests and full unit tests**

Run: `bun test src/pages/api/publications/publications-api.test.ts && bun test`

Expected: all tests PASS.

- [ ] **Step 7: Commit API routes**

```bash
git add src/lib/server/api.ts src/pages/api/publications src/pages/api/profile/publications.ts src/pages/api/admin
git commit -m "feat: add publication and moderation APIs"
```

---

### Task 4: Application shell, title, and circular bottom navigation

**Files:**
- Create: `src/components/app/AppBottomNav.astro`
- Modify: `src/layouts/AppLayout.astro`
- Modify: `src/pages/app/index.astro`
- Test: `src/components/app/AppBottomNav.test.ts`

**Interfaces:**
- Consumes: current pathname from `Astro.url.pathname`.
- Produces: reusable app shell on every `/app/` page with five navigation destinations.

- [ ] **Step 1: Write a failing source-level navigation test**

```ts
// @ts-nocheck
import { describe, expect, test } from "bun:test";

describe("app shell", () => {
	test("renders the approved title, subtitle, and five navigation destinations", async () => {
		const root = new URL("../../../", import.meta.url);
		const home = await Bun.file(new URL("src/pages/app/index.astro", root)).text();
		const nav = await Bun.file(new URL("src/components/app/AppBottomNav.astro", root)).text();
		expect(home).toContain("12 шагов");
		expect(home).toContain("материалы · посты · полезные инструменты · опыт · и прочее");
		for (const href of ["/app/", "/app/materials/", "/app/create/", "/app/posts/", "/app/profile/"]) expect(nav).toContain(`href=\"${href}\"`);
	});
});
```

- [ ] **Step 2: Run the shell test and verify RED**

Run: `bun test src/components/app/AppBottomNav.test.ts`

Expected: FAIL because the navigation component does not exist.

- [ ] **Step 3: Implement the bottom navigation**

Use inline accessible SVG icons with `aria-hidden="true"`; do not add an icon dependency. Each anchor is a `size-12 rounded-full` control with an adjacent short label. The create control is visually primary but retains the same hit area. Set `aria-current="page"` for the active destination. Wrap in a fixed container using `bottom-[max(.75rem,env(safe-area-inset-bottom))]` and reserve matching bottom padding in `AppLayout`.

- [ ] **Step 4: Update home copy without removing the existing catalog**

Add the approved title and subtitle above `CatalogExplorer`. Add compact cards linking to materials, posts, tools, and experience. Preserve the existing communities, methods, favorites, and add-community functionality.

- [ ] **Step 5: Run the shell test and existing presentation tests**

Run: `bun test src/components/app/AppBottomNav.test.ts src/components/catalog/FavoriteButton.test.ts`

Expected: all tests PASS. If the existing test asserts removed old copy, update only assertions that directly conflict with the newly approved exact copy.

- [ ] **Step 6: Commit the application shell**

```bash
git add src/components/app/AppBottomNav.astro src/components/app/AppBottomNav.test.ts src/layouts/AppLayout.astro src/pages/app/index.astro src/components/catalog/FavoriteButton.test.ts
git commit -m "feat: add 12 steps app navigation"
```

---

### Task 5: Public catalogs and publication pages

**Files:**
- Create: `src/components/publications/PublicationCard.astro`
- Create: `src/components/publications/PublicationList.astro`
- Create: `src/components/publications/PostFilters.astro`
- Create: `src/components/publications/PublicationArticle.astro`
- Create: `src/pages/app/materials/index.astro`
- Create: `src/pages/app/materials/[id].astro`
- Create: `src/pages/app/posts/index.astro`
- Create: `src/pages/app/posts/[id].astro`
- Create: `src/pages/app/tools/index.astro`
- Create: `src/pages/app/tools/[id].astro`
- Create: `src/pages/app/experience/index.astro`
- Create: `src/pages/app/experience/[id].astro`
- Create: `src/scripts/post-filters.ts`
- Test: `src/lib/publications/catalog.test.ts`

**Interfaces:**
- Consumes: public repository DTOs and `renderPublicationMarkdown`.
- Produces: four public catalogs, four detail route families, and client-only filtering of already-public post data.

- [ ] **Step 1: Write failing catalog projection tests**

Add `buildPostFacets(records)` and test that it derives sorted unique categories/tags only from published posts, ignores blank values, and never includes drafts.

```ts
expect(buildPostFacets(records)).toEqual({ categories: ["Опыт", "Практика"], tags: ["группа", "шаги"] });
```

- [ ] **Step 2: Run catalog tests and verify RED**

Run: `bun test src/lib/publications/catalog.test.ts`

Expected: FAIL because `buildPostFacets` does not exist.

- [ ] **Step 3: Implement catalog helpers and components**

Create `src/lib/publications/catalog.ts` with pure `buildPostFacets` and `filterPublishedPosts`. Cards show title, summary, author display name, and `publishedAt`; never render `authorTelegramId`. Detail pages render trusted output from `renderPublicationMarkdown` through Astro `set:html`.

- [ ] **Step 4: Implement four SSR list/detail route families**

Each file exports `prerender = false`, calls the repository server-side, uses Russian empty-state copy, and sets canonical metadata through the existing SEO helpers. A missing/non-published record returns `Astro.redirect` only for authenticated owner flows; public detail pages return a real 404 via `Astro.response.status = 404`.

- [ ] **Step 5: Implement post category/tag controls**

Render facet buttons from server-derived published records. The browser script toggles `hidden` based on `data-category` and `data-tags`, updates `aria-pressed`, and supports one category plus one tag at a time. Do not store free-text or filters in localStorage.

- [ ] **Step 6: Run catalog tests and Astro check**

Run: `bun test src/lib/publications/catalog.test.ts && bun run check`

Expected: tests PASS and Astro reports 0 errors.

- [ ] **Step 7: Commit public publication pages**

```bash
git add src/lib/publications/catalog.ts src/lib/publications/catalog.test.ts src/components/publications src/pages/app/materials src/pages/app/posts src/pages/app/tools src/pages/app/experience src/scripts/post-filters.ts
git commit -m "feat: add public publication catalogs"
```

---

### Task 6: Authoring flow and restricted formatting toolbar

**Files:**
- Create: `src/components/publications/PublicationEditor.astro`
- Create: `src/components/publications/PublicationForm.astro`
- Create: `src/pages/app/create/index.astro`
- Create: `src/pages/app/create/[type].astro`
- Create: `src/scripts/publication-editor.ts`
- Create: `src/scripts/publication-form.ts`
- Test: `src/scripts/publication-editor.test.ts`

**Interfaces:**
- Consumes: Task 3 author APIs and Telegram `WebApp.initData`.
- Produces: `applyMarkdownFormat(textarea, action)` and create/edit/submit browser behavior with session recovery.

- [ ] **Step 1: Write failing formatting tests**

```ts
// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { formatSelection } from "./publication-editor";

describe("publication editor", () => {
	test("applies only approved formatting", () => {
		expect(formatSelection("Текст", 0, 5, "bold").value).toBe("**Текст**");
		expect(formatSelection("Текст", 0, 5, "h2").value).toBe("## Текст");
		expect(formatSelection("один\nдва", 0, 8, "unordered-list").value).toBe("- один\n- два");
	});
});
```

- [ ] **Step 2: Run editor tests and verify RED**

Run: `bun test src/scripts/publication-editor.test.ts`

Expected: FAIL because the editor module does not exist.

- [ ] **Step 3: Implement pure formatting and DOM binding**

Export a pure `formatSelection` supporting exactly `h2`, `h3`, `bold`, `italic`, `link`, `unordered-list`, and `ordered-list`. Bind toolbar buttons through `data-format`. For links, use a small URL input in the toolbar rather than `window.prompt`. Restore focus and selection after formatting.

- [ ] **Step 4: Build the create and edit forms**

`/app/create/` presents four type choices. `[type].astro` rejects unknown types and reads an optional `?id=<document-id>` to load an owned `draft` or `rejected` record for editing. Show category/tags only when `type === "post"`. Add Save Draft and Submit for Review actions. There is no image input or drag/drop target.

- [ ] **Step 5: Add resilient browser submission**

Use the session key `twelve-steps.publication-draft:${type}:${id || "new"}`. Persist title, summary, content, category, and tags on input; never store Telegram `initData`. Disable buttons during requests, retain fields on error, delete the session entry after a successful server save, and redirect to `/app/profile/` after submission.

- [ ] **Step 6: Run editor tests and Astro check**

Run: `bun test src/scripts/publication-editor.test.ts && bun run check`

Expected: tests PASS and Astro reports 0 errors.

- [ ] **Step 7: Commit authoring flow**

```bash
git add src/components/publications/PublicationEditor.astro src/components/publications/PublicationForm.astro src/pages/app/create src/scripts/publication-editor.ts src/scripts/publication-form.ts src/scripts/publication-editor.test.ts
git commit -m "feat: add publication authoring flow"
```

---

### Task 7: Telegram profile and author publication dashboard

**Files:**
- Modify: `src/pages/api/telegram/profile.ts`
- Modify: `src/scripts/telegram-profile.ts`
- Create: `src/pages/app/profile/index.astro`
- Create: `src/components/profile/TelegramProfileCard.astro`
- Create: `src/components/profile/AuthorPublications.astro`
- Create: `src/scripts/profile-dashboard.ts`
- Test: `src/components/profile/profile.test.ts`

**Interfaces:**
- Consumes: existing profile upsert and Task 3 `/api/profile/publications`.
- Produces: profile response containing `createdAt`, `updatedAt`, and `isAdmin`, plus dashboard rendering grouped by status and type.

- [ ] **Step 1: Write failing profile contract tests**

Test that profile upsert preserves the original `createdAt`, advances `updatedAt`, returns no API key/config fields, and marks `isAdmin` from the verified Telegram ID. Add a source-level test asserting the page has groups for `draft`, `review`, `published`, and `rejected`.

- [ ] **Step 2: Run profile tests and verify RED**

Run: `bun test src/components/profile/profile.test.ts`

Expected: FAIL because the profile page/components do not exist.

- [ ] **Step 3: Return persisted profile dates**

Change `upsertTelegramProfile` to return the stored profile document. On PATCH, do not send `createdAt`; on POST, set it once. The profile endpoint returns public profile fields, `createdAt`, `updatedAt`, and `isAdmin` only.

- [ ] **Step 4: Build the Telegram profile page**

Render a loading skeleton server-side because identity comes from Telegram in the browser. After profile sync, fetch author publications and render avatar with safe fallback initials, name, username, registration date, last authorization, and records grouped by status/type. `draft` and `rejected` entries link back to their edit form; `review` is read-only.

- [ ] **Step 5: Run profile tests and Astro check**

Run: `bun test src/components/profile/profile.test.ts && bun run check`

Expected: tests PASS and Astro reports 0 errors.

- [ ] **Step 6: Commit profile dashboard**

```bash
git add src/lib/server/appwrite.ts src/pages/api/telegram/profile.ts src/scripts/telegram-profile.ts src/pages/app/profile src/components/profile src/scripts/profile-dashboard.ts
git commit -m "feat: add Telegram author profile"
```

---

### Task 8: In-app moderation queue

**Files:**
- Create: `src/pages/app/admin/index.astro`
- Create: `src/components/admin/ModerationQueue.astro`
- Create: `src/components/admin/ModerationCard.astro`
- Create: `src/scripts/moderation-queue.ts`
- Test: `src/scripts/moderation-queue.test.ts`

**Interfaces:**
- Consumes: Task 3 admin APIs and Task 1 safe Markdown renderer.
- Produces: authenticated moderator queue with publish and reject actions.

- [ ] **Step 1: Write failing moderation state tests**

Create a pure `applyModerationResult(queue, id, result)` helper and test that publishing/remanding removes only the acted-on item, duplicate responses are ignored, and a rejection without a note is blocked client-side.

- [ ] **Step 2: Run moderation tests and verify RED**

Run: `bun test src/scripts/moderation-queue.test.ts`

Expected: FAIL because the moderation module does not exist.

- [ ] **Step 3: Build the protected moderation screen**

The page initially shows an authorization state. Browser code posts verified Telegram `initData` to the queue endpoint. A `403` renders «Нет доступа» and no controls. Each card shows type, author display data, submitted date, title, summary, and server-rendered safe content. The author control opens an admin-only panel loaded from `/api/admin/authors/[telegramId]` with profile details and the author's other records.

- [ ] **Step 4: Implement publish and reject interactions**

Publish requires confirmation. Reject requires a visible textarea with 1-1000 characters. Disable the card while a request runs, remove it after success, and retain it with an inline error after failure. Do not optimistically mark a record published before the API succeeds.

- [ ] **Step 5: Run moderation tests and Astro check**

Run: `bun test src/scripts/moderation-queue.test.ts && bun run check`

Expected: tests PASS and Astro reports 0 errors.

- [ ] **Step 6: Commit moderation UI**

```bash
git add src/pages/app/admin src/components/admin src/scripts/moderation-queue.ts src/scripts/moderation-queue.test.ts
git commit -m "feat: add Telegram moderation queue"
```

---

### Task 9: Appwrite schema documentation, environment contract, and end-to-end verification

**Files:**
- Modify: `README.md`
- Create: `docs/appwrite-publications-schema.md`
- Test: `src/lib/publications/config-contract.test.ts`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: exact deployment configuration and verified end-to-end feature.

- [ ] **Step 1: Write a failing environment-contract test**

Test that publication operations report missing `PUBLICATIONS_COLLECTION_ID`, that the `APPWRITE_` and Appwrite Sites aliases resolve identically, that profile sync still works without a publications collection variable, and that empty `ADMIN_TELEGRAM_IDS` grants no admin.

- [ ] **Step 2: Run the contract test and verify RED**

Run: `bun test src/lib/publications/config-contract.test.ts`

Expected: FAIL until all aliases and missing-variable names are stable.

- [ ] **Step 3: Document the exact Appwrite collection**

Document attributes and limits matching the spec and Task 1: strings for type/status/title/summary/content/category/author fields/moderation note/timestamps, string array for tags, and indexes `type_status_publishedAt` plus `authorTelegramId_updatedAt`. Include the two profile timestamp fields and state that collection permissions remain server-only because all access uses the API key.

- [ ] **Step 4: Update README environment variables and routes**

Add `APPWRITE_PUBLICATIONS_COLLECTION_ID` / `PUBLICATIONS_COLLECTION_ID` and `ADMIN_TELEGRAM_IDS`. Describe public routes, author flow, moderator flow, and the restricted editor. Preserve the existing Appwrite/Telegram aliases and current hosting address.

- [ ] **Step 5: Run the complete automated verification**

Run: `bun test && bun run check && bun run build`

Expected: all tests PASS, Astro check reports 0 errors, and build exits 0 with all public and authenticated routes present.

- [ ] **Step 6: Run local API smoke requests**

With a valid local Telegram fixture and Appwrite test collection, verify: create draft; edit own draft; reject editing another user's draft; submit; admin list; reject with note; edit and resubmit; publish; public list/detail; profile grouping. Record only response statuses and document IDs—never print bot tokens, API keys, or raw `initData`.

- [ ] **Step 7: Run browser verification in Telegram-sized viewports**

At 390x844 and 768x1024 verify the exact title/subtitle, five circular navigation controls, active state, safe-area spacing, all four catalogs, restricted toolbar, session draft recovery, Telegram profile fields, admin denial for a normal user, moderation for the configured admin, and publication appearing after approval. Confirm keyboard focus indicators and that every icon control has an accessible name.

- [ ] **Step 8: Commit documentation and final contract tests**

```bash
git add README.md docs/appwrite-publications-schema.md src/lib/publications/config-contract.test.ts
git commit -m "docs: add publication deployment contract"
```

- [ ] **Step 9: Inspect final repository state**

Run: `git status --short && git log --oneline -10`

Expected: only the user's pre-existing unrelated changes remain; task commits are visible and no secrets or generated `dist` files are tracked.
