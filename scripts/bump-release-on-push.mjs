#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_PATH = resolve(process.cwd(), "src/config.ts");

function hasHead() {
	try {
		execSync("git rev-parse --verify HEAD", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function getAstanaIsoStamp(now = new Date()) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Almaty",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	})
		.formatToParts(now)
		.reduce((acc, part) => {
			if (part.type !== "literal") acc[part.type] = part.value;
			return acc;
		}, {});

	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00+05:00`;
}

function bumpReleaseConfig(source) {
	const stepMatch = source.match(/versionStep:\s*(\d+)/);
	if (!stepMatch) throw new Error("versionStep not found in src/config.ts");
	const currentStep = Number(stepMatch[1]);
	const nextStep = Number.isFinite(currentStep) ? currentStep + 1 : 1;

	const nextStamp = getAstanaIsoStamp();
	let updated = source.replace(/versionStep:\s*\d+/, `versionStep: ${nextStep}`);

	if (/lastPushedAt:\s*"[^"]*"/.test(updated)) {
		updated = updated.replace(/lastPushedAt:\s*"[^"]*"/, `lastPushedAt: "${nextStamp}"`);
	} else {
		updated = updated.replace(
			/versionStep:\s*\d+,/,
			(match) => `${match}\n\t\tlastPushedAt: "${nextStamp}",`,
		);
	}

	return { updated, nextStep, nextStamp };
}

if (!hasHead()) process.exit(0);

const original = readFileSync(CONFIG_PATH, "utf8");
const { updated, nextStep, nextStamp } = bumpReleaseConfig(original);

if (updated === original) process.exit(0);

writeFileSync(CONFIG_PATH, updated, "utf8");
execSync("git add src/config.ts", { stdio: "inherit" });
execSync('git commit --amend --no-edit --no-verify', { stdio: "inherit" });
console.log(`[release] bumped versionStep -> ${nextStep}, lastPushedAt -> ${nextStamp}`);
