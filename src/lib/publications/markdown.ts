const allowedProtocols = new Set(["http:", "https:", "mailto:"]);

function validateSource(source: string): void {
	if (/<[^>]*>/.test(source)) throw new Error("HTML не поддерживается");
	if (/!\[/.test(source)) throw new Error("Изображения не поддерживаются");
	if (/`{1,}/.test(source)) throw new Error("Код не поддерживается");
	if (/^\s*\|.*\|\s*$/m.test(source) || /^\s*\|?\s*:?-{3,}/m.test(source)) throw new Error("Таблицы не поддерживаются");

	for (const line of source.split("\n")) {
		const heading = /^(#{1,6})\s+/.exec(line);
		if (heading && heading[1].length !== 2 && heading[1].length !== 3) {
			throw new Error("Этот уровень заголовка не поддерживается");
		}
	}

	for (const match of source.matchAll(/\[[^\]]*\]\(([^)]*)\)/g)) {
		let url: URL;
		try {
			url = new URL(match[1]);
		} catch {
			throw new Error("Недопустимая ссылка");
		}
		if (!allowedProtocols.has(url.protocol)) throw new Error("Недопустимая ссылка");
	}
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function renderInline(value: string): string {
	const escaped = escapeHtml(value);
	return escaped
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

type ListBlock = { tag: "ul" | "ol"; items: string[] };

export function renderPublicationMarkdown(source: string): string {
	validateSource(source);

	const blocks: string[] = [];
	const lines = source.replaceAll("\r\n", "\n").split("\n");
	let paragraph: string[] = [];
	let list: ListBlock | null = null;

	const flushParagraph = () => {
		if (paragraph.length) {
			blocks.push(`<p>${renderInline(paragraph.join("\n")).replaceAll("\n", "<br>")}</p>`);
			paragraph = [];
		}
	};
	const flushList = () => {
		if (list) {
			blocks.push(`<${list.tag}>${list.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${list.tag}>`);
			list = null;
		}
	};

	for (const line of lines) {
		const heading = /^(#{2,3})\s+(.+)$/.exec(line);
		const unordered = /^-\s+(.+)$/.exec(line);
		const ordered = /^1\.\s+(.+)$/.exec(line);
		if (heading) {
			flushParagraph();
			flushList();
			blocks.push(`<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`);
		} else if (unordered || ordered) {
			flushParagraph();
			const tag = unordered ? "ul" : "ol";
			let nextList = list as ListBlock | null;
			if (nextList?.tag !== tag) {
				flushList();
				nextList = { tag, items: [] };
				list = nextList;
			}
			nextList.items.push((unordered ?? ordered)![1]);
		} else if (!line.trim()) {
			flushParagraph();
			flushList();
		} else {
			flushList();
			paragraph.push(line);
		}
	}

	flushParagraph();
	flushList();
	return blocks.join("\n");
}

export function plainTextFromMarkdown(source: string): string {
	validateSource(source);
	return source
		.replace(/^#{2,3}\s+/gm, "")
		.replace(/^[-]\s+/gm, "")
		.replace(/^1\.\s+/gm, "")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/\*([^*]+)\*/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}
