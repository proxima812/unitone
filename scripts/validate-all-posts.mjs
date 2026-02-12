import fs from "node:fs"
import { spawnSync } from "node:child_process"

const EXCLUDE_FILE = "docs/CONTENT_EXCLUDE.md"

function loadExcludeSet() {
	if (!fs.existsSync(EXCLUDE_FILE)) return new Set()
	const raw = fs.readFileSync(EXCLUDE_FILE, "utf8")
	const items = raw
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#") && line.startsWith("src/"))
	return new Set(items)
}

const listRaw = spawnSync("rg", ["-l", "^author:", "src/data", "-S"], { encoding: "utf8" })
if (listRaw.status !== 0) {
	console.error(listRaw.stderr || "Failed to list files")
	process.exit(1)
}

const excluded = loadExcludeSet()
const files = listRaw.stdout
	.trim()
	.split("\n")
	.filter(Boolean)
	.filter((file) => !excluded.has(file))
	.sort()
let failed = 0

function extractAuthor(content) {
	const lines = content.split("\n")
	const i = lines.findIndex((l) => /^author:\s*$/.test(l))
	if (i !== -1 && /^\s+-\s+\S/.test(lines[i + 1] || "")) {
		return lines[i + 1].replace(/^\s+-\s+/, "").trim()
	}
	const inline = content.match(/^author:\s*(\S.+)$/m)
	return inline ? inline[1].trim() : "Klia78"
}

for (const file of files) {
	const content = fs.readFileSync(file, "utf8")
	const author = extractAuthor(content)
	const r = spawnSync("bun", ["validate-post.ts", "--author", author, "--file", file], { encoding: "utf8" })
	if (r.status !== 0) {
		failed++
		console.error(`\\n[FAILED] ${file} (${author})`)
		process.stderr.write(r.stderr || r.stdout)
	}
}

if (failed > 0) {
	console.error(`\\nValidation failed in ${failed} file(s).`)
	process.exit(1)
}

console.log(`All good. Checked ${files.length} file(s). Excluded: ${excluded.size}.`)
