// @ts-nocheck
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { PublicationRecord } from "../publications/types";
import { verifiedAuthorizationProfile, verifiedRequestProfile } from "./api";
import {
	createPublicationRepository,
	type PublicationRepository,
	type PublicationTransport,
} from "./publications";
import { createAdminAuthorHandlers } from "../../pages/api/admin/authors/[telegramId]";
import { createAdminPublicationHandlers } from "../../pages/api/admin/publications/index";
import { createPublishHandlers } from "../../pages/api/admin/publications/[id]/publish";
import { createRejectHandlers } from "../../pages/api/admin/publications/[id]/reject";
import { createProfilePublicationHandlers } from "../../pages/api/profile/publications";
import { createPublicationDetailHandlers } from "../../pages/api/publications/[id]";
import { createSubmitHandlers } from "../../pages/api/publications/[id]/submit";
import { createPublicationIndexHandlers } from "../../pages/api/publications/index";

class InMemoryPublicationTransport implements PublicationTransport {
	readonly records = new Map<string, PublicationRecord>();
	#nextId = 1;

	async create(data: Omit<PublicationRecord, "id">): Promise<PublicationRecord> {
		const record = { id: `publication-${this.#nextId++}`, ...structuredClone(data) };
		this.records.set(record.id, record);
		return structuredClone(record);
	}

	async get(id: string): Promise<PublicationRecord | null> {
		const record = this.records.get(id);
		return record ? structuredClone(record) : null;
	}

	async update(id: string, data: Partial<PublicationRecord>): Promise<PublicationRecord> {
		const current = this.records.get(id);
		if (!current) throw new Error("Record not found");
		const record = { ...current, ...structuredClone(data), id };
		this.records.set(id, record);
		return structuredClone(record);
	}

	async list(queries: string[]): Promise<PublicationRecord[]> {
		let records = [...this.records.values()];
		for (const query of queries) {
			const equal = /^equal\(("[^"]+"),(\[.*\])\)$/u.exec(query);
			if (equal) {
				const field = JSON.parse(equal[1]);
				const values = JSON.parse(equal[2]);
				records = records.filter((record) => {
					const current = record[field];
					return Array.isArray(current)
						? current.some((value) => values.includes(value))
						: values.includes(current);
				});
			}
		}
		return structuredClone(records);
	}
}

const profiles = {
	verified: {
		telegramId: "100",
		firstName: "Verified",
		lastName: "User",
		username: "verified",
		languageCode: "ru",
		photoUrl: "https://example.com/verified.jpg",
		isPremium: false,
	},
	other: {
		telegramId: "200",
		firstName: "Other",
		lastName: "User",
		username: "other",
		languageCode: "ru",
		photoUrl: "",
		isPremium: false,
	},
	admin: {
		telegramId: "300",
		firstName: "Admin",
		lastName: "User",
		username: "admin",
		languageCode: "ru",
		photoUrl: "",
		isPremium: false,
	},
};

const validInput = {
	type: "post",
	title: "Пост",
	summary: "Кратко",
	content: "## Текст",
	category: "Опыт",
	tags: [],
};

const originalBotToken = process.env.TELEGRAM_BOT_TOKEN;

function signedInitData(profile = profiles.verified): string {
	const user = JSON.stringify({
		id: Number(profile.telegramId),
		first_name: profile.firstName,
		last_name: profile.lastName,
		username: profile.username,
		language_code: profile.languageCode,
		photo_url: profile.photoUrl,
		is_premium: profile.isPremium,
	});
	const authDate = String(Math.floor(Date.now() / 1000));
	const pairs = [`auth_date=${authDate}`, `user=${user}`];
	const secretKey = createHmac("sha256", "WebAppData").update("test-bot-token").digest();
	const hash = createHmac("sha256", secretKey).update(pairs.join("\n")).digest("hex");
	return new URLSearchParams({ auth_date: authDate, user, hash }).toString();
}

function setup() {
	const transport = new InMemoryPublicationTransport();
	const repository = createPublicationRepository(transport);
	const authenticateBody = (request: Request, body: Record<string, unknown>) => verifiedRequestProfile(request, body, {
		upsertTelegramProfile: async () => {},
	});
	const authenticateHeader = (request: Request) => verifiedAuthorizationProfile(request, {
		upsertTelegramProfile: async () => {},
	});
	return {
		transport,
		repository,
		services: {
			repository,
			authenticateBody,
			authenticateHeader,
			isAdmin: (telegramId: string) => telegramId === profiles.admin.telegramId,
		},
	};
}

function jsonRequest(url: string, method: string, body: unknown, init: RequestInit = {}): Request {
	return new Request(url, {
		...init,
		method,
		headers: { "Content-Type": "application/json", ...init.headers },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

function context(request: Request, params: Record<string, string | undefined> = {}) {
	return { request, params, url: new URL(request.url) };
}

async function createDraft(repository: PublicationRepository, profile = profiles.verified) {
	return repository.createPublication(profile, validInput);
}

beforeEach(() => {
	process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
});

afterEach(() => {
	if (originalBotToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
	else process.env.TELEGRAM_BOT_TOKEN = originalBotToken;
});

describe("publication API policy", () => {
	test("returns 400 for malformed JSON", async () => {
		const { services } = setup();
		const { POST } = createPublicationIndexHandlers(services);
		const request = jsonRequest("https://example.com/api/publications", "POST", "{");

		const response = await POST(context(request));

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ ok: false });
	});

	test("returns 401 when Telegram data is missing or invalid", async () => {
		const { services } = setup();
		const { POST } = createPublicationIndexHandlers(services);

		for (const initData of ["", "auth_date=1&hash=invalid"]) {
			const request = jsonRequest("https://example.com/api/publications", "POST", { ...validInput, initData });
			const response = await POST(context(request));
			expect(response.status).toBe(401);
		}
	});

	test("does not accept author identity from the request body", async () => {
		const { services } = setup();
		const { POST } = createPublicationIndexHandlers(services);
		const request = jsonRequest("https://example.com/api/publications", "POST", {
			...validInput,
			initData: signedInitData(),
			authorTelegramId: "999",
			authorName: "Forged User",
			status: "published",
		});

		const response = await POST(context(request));
		const payload = await response.json();

		expect(response.status).toBe(201);
		expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(payload.publication).toMatchObject({ authorName: "Verified User", status: "draft" });
		expect(payload.publication).not.toHaveProperty("authorTelegramId");
	});

	test("returns 422 for invalid publication content", async () => {
		const { services } = setup();
		const { POST } = createPublicationIndexHandlers(services);
		const request = jsonRequest("https://example.com/api/publications", "POST", {
			...validInput,
			title: "   ",
			initData: signedInitData(),
		});

		const response = await POST(context(request));

		expect(response.status).toBe(422);
	});

	test("returns 403 when an author updates another author's draft", async () => {
		const { repository, services } = setup();
		const publication = await createDraft(repository, profiles.other);
		const { PATCH } = createPublicationDetailHandlers(services);
		const request = jsonRequest(`https://example.com/api/publications/${publication.id}`, "PATCH", {
			...validInput,
			initData: signedInitData(),
		});

		const response = await PATCH(context(request, { id: publication.id }));

		expect(response.status).toBe(403);
	});

	test("returns 409 when an author edits a submitted record", async () => {
		const { repository, services } = setup();
		const publication = await createDraft(repository);
		await repository.submitPublication(publication.id, profiles.verified.telegramId);
		const { PATCH } = createPublicationDetailHandlers(services);
		const request = jsonRequest(`https://example.com/api/publications/${publication.id}`, "PATCH", {
			...validInput,
			initData: signedInitData(),
		});

		const response = await PATCH(context(request, { id: publication.id }));

		expect(response.status).toBe(409);
	});

	test("submits an owned draft and keeps repeated submission idempotent", async () => {
		const { repository, services } = setup();
		const publication = await createDraft(repository);
		const { POST } = createSubmitHandlers(services);
		const makeRequest = () => jsonRequest(`https://example.com/api/publications/${publication.id}/submit`, "POST", {
			initData: signedInitData(),
		});

		const first = await POST(context(makeRequest(), { id: publication.id }));
		const second = await POST(context(makeRequest(), { id: publication.id }));

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect((await second.json()).publication.status).toBe("review");
	});

	test("never exposes Telegram author IDs from public list or detail JSON", async () => {
		const { repository, services } = setup();
		const publication = await createDraft(repository);
		await repository.submitPublication(publication.id, profiles.verified.telegramId);
		await repository.moderatePublication(publication.id, "published", "");
		const listHandlers = createPublicationIndexHandlers(services);
		const detailHandlers = createPublicationDetailHandlers(services);

		const list = await listHandlers.GET(context(new Request("https://example.com/api/publications?type=post")));
		const detail = await detailHandlers.GET(context(new Request(`https://example.com/api/publications/${publication.id}`), { id: publication.id }));
		const listPayload = await list.json();
		const detailPayload = await detail.json();

		expect(list.status).toBe(200);
		expect(detail.status).toBe(200);
		expect(listPayload.publications[0]).not.toHaveProperty("authorTelegramId");
		expect(detailPayload.publication).not.toHaveProperty("authorTelegramId");
	});

	test("rejects unsupported public-list query parameters", async () => {
		const { services } = setup();
		const { GET } = createPublicationIndexHandlers(services);

		const response = await GET(context(new Request("https://example.com/api/publications?status=draft")));

		expect(response.status).toBe(400);
	});

	test("ignores query initData and accepts only tma Authorization for authenticated GET", async () => {
		const { repository, services } = setup();
		await createDraft(repository);
		const { GET } = createProfilePublicationHandlers(services);
		const initData = signedInitData();

		const queryResponse = await GET(context(new Request(`https://example.com/api/profile/publications?initData=${encodeURIComponent(initData)}`)));
		const headerResponse = await GET(context(new Request("https://example.com/api/profile/publications", {
			headers: { Authorization: `tma ${initData}` },
		})));

		expect(queryResponse.status).toBe(401);
		expect(headerResponse.status).toBe(200);
		expect((await headerResponse.json()).publications).toHaveLength(1);
	});

	test("denies the moderation queue before reading it for a non-admin", async () => {
		const { services } = setup();
		const { POST } = createAdminPublicationHandlers(services);
		const request = jsonRequest("https://example.com/api/admin/publications", "POST", {
			initData: signedInitData(),
		});

		const response = await POST(context(request));

		expect(response.status).toBe(403);
	});

	test("publishes only through the repository and ignores client dates", async () => {
		const { repository, services } = setup();
		const publication = await createDraft(repository);
		await repository.submitPublication(publication.id, profiles.verified.telegramId);
		const { POST } = createPublishHandlers(services);
		const request = jsonRequest(`https://example.com/api/admin/publications/${publication.id}/publish`, "POST", {
			initData: signedInitData(profiles.admin),
			publishedAt: "1900-01-01T00:00:00.000Z",
		});

		const response = await POST(context(request, { id: publication.id }));
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.publication.status).toBe("published");
		expect(payload.publication.publishedAt).not.toBe("1900-01-01T00:00:00.000Z");
	});

	test("requires a trimmed rejection note no longer than 1000 characters", async () => {
		const { repository, services } = setup();
		const first = await createDraft(repository);
		const second = await createDraft(repository);
		await repository.submitPublication(first.id, profiles.verified.telegramId);
		await repository.submitPublication(second.id, profiles.verified.telegramId);
		const { POST } = createRejectHandlers(services);

		for (const [id, moderationNote] of [[first.id, "   "], [second.id, "x".repeat(1001)]]) {
			const request = jsonRequest(`https://example.com/api/admin/publications/${id}/reject`, "POST", {
				initData: signedInitData(profiles.admin),
				moderationNote,
			});
			const response = await POST(context(request, { id }));
			expect(response.status).toBe(422);
		}
	});

	test("returns an author overview only to an authenticated admin", async () => {
		const { repository, services } = setup();
		await createDraft(repository);
		const { GET } = createAdminAuthorHandlers(services);
		const initData = signedInitData(profiles.admin);
		const request = new Request(`https://example.com/api/admin/authors/${profiles.verified.telegramId}`, {
			headers: { Authorization: `tma ${initData}` },
		});

		const response = await GET(context(request, { telegramId: profiles.verified.telegramId }));
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.author).toMatchObject({ telegramId: profiles.verified.telegramId, name: "Verified User" });
		expect(payload.author.publications).toHaveLength(1);
	});
});
