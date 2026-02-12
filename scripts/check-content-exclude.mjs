import fs from "node:fs"

const EXCLUDE_FILE = "docs/CONTENT_EXCLUDE.md"

if (!fs.existsSync(EXCLUDE_FILE)) {
	console.error(`Missing ${EXCLUDE_FILE}`)
	process.exit(1)
}

const lines = fs
	.readFileSync(EXCLUDE_FILE, "utf8")
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith("#") && line.startsWith("src/"))

const missing = lines.filter((relPath) => !fs.existsSync(relPath))

if (missing.length > 0) {
	console.warn("Warning: missing excluded files:")
	for (const item of missing) console.warn(`- ${item}`)
	console.log(`Exclude list loaded. Entries: ${lines.length}. Missing: ${missing.length}.`)
	process.exit(0)
}

console.log(`Exclude list is valid. Entries: ${lines.length}`)
