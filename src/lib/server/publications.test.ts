// @ts-nocheck
import { describe, expect, test } from "bun:test";
import type { PublicationRecord } from "../publications/types";
import {
	createPublicationRepository,
	type PublicationTransport,
} from "./publications";

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

const alice = {
	telegramId: "100",
	firstName: "Alice",
	lastName: "Author",
	username: "alice",
	languageCode: "ru",
	photoUrl: "https://example.com/alice.jpg",
	isPremium: false,
};

const bob = { ...alice, telegramId: "200", firstName: "Bob", username: "bob" };

const input = {
	type: "post",
	title: "Первый пост",
	summary: "Краткое описание",
	content: "## Текст",
	category: "Опыт",
	tags: ["шаги"],
};

function setup() {
	const transport = new InMemoryPublicationTransport();
	return { transport, repository: createPublicationRepository(transport) };
}

describe("publication repository policy", () => {
	test("forbids an author from updating another author's record", async () => {
		const { repository } = setup();
		const publication = await repository.createPublication(alice, input);

		await expect(repository.updatePublication(publication.id, bob.telegramId, { ...input, title: "Чужая правка" }))
			.rejects.toMatchObject({ code: "forbidden" });
	});

	test("does not edit a submitted record", async () => {
		const { repository } = setup();
		const publication = await repository.createPublication(alice, input);
		await repository.submitPublication(publication.id, alice.telegramId);

		await expect(repository.updatePublication(publication.id, alice.telegramId, { ...input, title: "Поздняя правка" }))
			.rejects.toMatchObject({ code: "conflict" });
	});

	test("returns only published records from public lists without Telegram IDs", async () => {
		const { repository } = setup();
		await repository.createPublication(alice, { ...input, title: "Черновик" });
		const published = await repository.createPublication(alice, input);
		await repository.submitPublication(published.id, alice.telegramId);
		await repository.moderatePublication(published.id, "published", "");

		const publications = await repository.listPublishedPublications({ type: "post" });

		expect(publications).toHaveLength(1);
		expect(publications[0]).toMatchObject({ id: published.id, status: "published" });
		expect(publications[0]).not.toHaveProperty("authorTelegramId");
	});

	test("requires a moderation note when rejecting a reviewed record", async () => {
		const { repository } = setup();
		const publication = await repository.createPublication(alice, input);
		await repository.submitPublication(publication.id, alice.telegramId);

		await expect(repository.moderatePublication(publication.id, "rejected", "   "))
			.rejects.toMatchObject({ code: "validation" });
	});
});
