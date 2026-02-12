import fs from "node:fs";

type Author = "Klia78" | "SamGold" | "just_green1" | "Xima" | "yuliaM" | "Svetlana";

function getArg(name: string): string | undefined {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

function readInput(): string {
	const file = getArg("file");
	if (file) return fs.readFileSync(file, "utf8");
	try {
		const stdin = fs.readFileSync(0, "utf8");
		if (stdin?.trim().length) return stdin;
	} catch {
		// noop
	}
	throw new Error("No input. Provide --file post.md or pipe markdown to stdin.");
}

function stripFrontmatter(md: string): string {
	if (!md.startsWith("---\n")) return md;
	const end = md.indexOf("\n---\n", 4);
	if (end === -1) return md;
	return md.slice(end + 5);
}

const EMOJI_RE = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

function countEmojis(s: string): number {
	const m = s.match(EMOJI_RE);
	return m ? m.length : 0;
}

function countH2Headings(md: string): number {
	return md.split("\n").filter((l) => /^##\s+\S/.test(l.trim())).length;
}

function findPracticalList(md: string): { ok: boolean; items: number } {
	const lines = md.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		const isBullet = /^-\s+\S/.test(line);
		const isNum = /^\d+\.\s+\S/.test(line);
		if (!isBullet && !isNum) continue;

		let j = i;
		let items = 0;
		while (j < lines.length) {
			const l = lines[j].trim();
			if (/^-\s+\S/.test(l) || /^\d+\.\s+\S/.test(l)) {
				items++;
				j++;
				continue;
			}
			if (items > 0 && l === "") break;
			if (items > 0) break;
			j++;
		}
		return { ok: items === 3, items };
	}
	return { ok: false, items: 0 };
}

function hasIntroAndClosing(md: string): { introOk: boolean; closingOk: boolean } {
	const text = md.trim();
	const parts = text.split(/\n##\s+/);
	const beforeFirstH2 = parts[0]?.trim() ?? "";
	const introOk = beforeFirstH2.length > 40 && /[А-Яа-яЁё]/.test(beforeFirstH2);

	const lines = text.split("\n").filter((l) => l.trim() !== "");
	const tail = lines.slice(-8).join("\n");
	const closingOk = tail.length > 40 && /[А-Яа-яЁё]/.test(tail);

	return { introOk, closingOk };
}

function checkSvetlanaLowercase(md: string): { ok: boolean; count: number } {
	const re = /\. +([а-яё])/g;
	let m: RegExpExecArray | null;
	let count = 0;
	while ((m = re.exec(md)) !== null) count++;
	return { ok: count === 4, count };
}

function mustEndWithSvetlana(md: string): boolean {
	return md.trimEnd().endsWith("Писала Светлана. Спасибо за прочтение!");
}

function validate(md: string, author: Author) {
	const errors: string[] = [];

	const h2 = countH2Headings(md);
	if (h2 < 2 || h2 > 4) errors.push(`Expected 2-4 H2 sections (##). Found: ${h2}`);

	const list = findPracticalList(md);
	if (!list.ok)
		errors.push(`Expected one practical list with exactly 3 items. Found: ${list.items}`);

	const introClosing = hasIntroAndClosing(md);
	if (!introClosing.introOk)
		errors.push("Intro paragraph missing/too short (before first ##).");
	if (!introClosing.closingOk)
		errors.push("Closing paragraph missing/too short (tail of post).");

	const emojis = countEmojis(md);

	if (author === "SamGold") {
		if (emojis !== 4) errors.push(`SamGold: expected exactly 4 emojis. Found: ${emojis}`);
	}

	if (author === "yuliaM") {
		if (emojis < 8 || emojis > 14)
			errors.push(`yuliaM: expected 8-14 emojis. Found: ${emojis}`);
	}

	if (author === "Klia78" || author === "just_green1") {
		if (emojis !== 0) errors.push(`${author}: emojis forbidden. Found: ${emojis}`);
	}

	if (author === "Svetlana") {
		if (emojis !== 0) errors.push(`Svetlana: emojis forbidden. Found: ${emojis}`);

		const lc = checkSvetlanaLowercase(md);
		if (!lc.ok)
			errors.push(
				`Svetlana: expected exactly 4 lowercase-after-period cases. Found: ${lc.count}`,
			);

		if (!mustEndWithSvetlana(md)) errors.push("Svetlana: missing mandatory ending line.");
	}

	return { ok: errors.length === 0, errors, meta: { h2, emojis, listItems: list.items } };
}

const author = (getArg("author") as Author | undefined) ?? "Klia78";
const md = stripFrontmatter(readInput());

const res = validate(md, author);
if (res.ok) {
	console.log("OK");
	console.log(JSON.stringify(res.meta, null, 2));
	process.exit(0);
} else {
	console.error("FAILED");
	for (const e of res.errors) console.error("- " + e);
	console.error(JSON.stringify(res.meta, null, 2));
	process.exit(1);
}
