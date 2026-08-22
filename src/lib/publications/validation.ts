import {
	publicationTypes,
	type PublicationActor,
	type PublicationInput,
	type PublicationStatus,
} from "./types";

type ValidationResult =
	| { ok: true; value: PublicationInput }
	| { ok: false; error: string };

const limits = {
	title: 120,
	summary: 400,
	content: 30_000,
	category: 80,
	tag: 40,
	tags: 8,
} as const;

function invalid(error: string): ValidationResult {
	return { ok: false, error };
}

function normalizeTags(tags: unknown): string[] | null {
	if (!Array.isArray(tags)) return null;

	const unique = new Map<string, string>();
	for (const tag of tags) {
		if (typeof tag !== "string") return null;
		const value = tag.trim();
		if (!value) continue;
		if (value.length > limits.tag) return null;
		const key = value.toLocaleLowerCase();
		if (!unique.has(key)) unique.set(key, value);
	}

	const values = [...unique.values()];
	return values.length <= limits.tags ? values : null;
}

export function validatePublicationInput(input: unknown): ValidationResult {
	if (!input || typeof input !== "object") return invalid("Некорректные данные публикации.");

	const value = input as Record<string, unknown>;
	if (typeof value.type !== "string" || !publicationTypes.includes(value.type as PublicationInput["type"])) {
		return invalid("Выберите тип публикации.");
	}

	const fields = ["title", "summary", "content", "category"] as const;
	const normalized = {} as Record<(typeof fields)[number], string>;
	for (const field of fields) {
		if (typeof value[field] !== "string") return invalid("Некорректные данные публикации.");
		normalized[field] = value[field].trim();
	}

	if (!normalized.title) return invalid("Укажите заголовок.");
	if (!normalized.summary) return invalid("Укажите краткое описание.");
	if (!normalized.content) return invalid("Укажите текст публикации.");
	if (normalized.title.length > limits.title) return invalid("Заголовок не должен быть длиннее 120 символов.");
	if (normalized.summary.length > limits.summary) return invalid("Краткое описание не должно быть длиннее 400 символов.");
	if (normalized.content.length > limits.content) return invalid("Текст публикации не должен быть длиннее 30000 символов.");
	if (normalized.category.length > limits.category) return invalid("Категория не должна быть длиннее 80 символов.");

	const tags = normalizeTags(value.tags);
	if (!tags) return invalid("Теги должны содержать до 8 уникальных значений не длиннее 40 символов.");
	if (value.type !== "post" && (normalized.category || tags.length > 0)) {
		return invalid("Категории и теги доступны только для постов.");
	}

	return {
		ok: true,
		value: {
			type: value.type as PublicationInput["type"],
			title: normalized.title,
			summary: normalized.summary,
			content: normalized.content,
			category: normalized.category,
			tags,
		},
	};
}

export function validateStatusTransition(
	actor: PublicationActor,
	from: PublicationStatus,
	to: PublicationStatus,
): boolean {
	if (actor === "author") {
		return (from === "draft" || from === "rejected") && to === "review"
			|| from === "rejected" && to === "draft";
	}

	return from === "review" && (to === "published" || to === "rejected");
}
