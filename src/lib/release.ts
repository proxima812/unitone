import { config } from "@/config";

function computeVersion(step: number) {
	const normalized = Number.isFinite(step) ? Math.max(0, Math.floor(step)) : 0;
	const baseMajor = 2;
	const baseMinor = 4;
	const basePatch = 0;

	const patchTotal = basePatch + normalized;
	const patchCarry = Math.floor(patchTotal / 6);
	const patch = patchTotal % 6;

	const minorTotal = baseMinor + patchCarry;
	const majorCarry = Math.floor(minorTotal / 6);
	const minor = minorTotal % 6;
	const major = baseMajor + majorCarry;

	// Формат:
	// - старт: 2.4.0
	// - далее: 2.4.1 ... 2.4.5 -> 2.5 -> 2.5.1 ...
	// - на границе major: 4.0.0
	if (patch === 0) {
		if (normalized === 0 || minor === 0) return `${major}.${minor}.0`;
		return `${major}.${minor}`;
	}

	return `${major}.${minor}.${patch}`;
}

export function getReleaseMeta(now = new Date()) {
	const release = config.release;
	const version = computeVersion(release.versionStep ?? 0);
	const pushedAt = release.lastPushedAt ? new Date(release.lastPushedAt) : now;
	const sourceDate = Number.isNaN(pushedAt.getTime()) ? now : pushedAt;
	const date = new Intl.DateTimeFormat(release.locale || "ru-RU", {
		timeZone: release.timeZone || "Asia/Almaty",
		day: "2-digit",
		month: "short",
		year: "numeric",
	})
		.format(sourceDate)
		.replace(" г.", "");
	const time = new Intl.DateTimeFormat(release.locale || "ru-RU", {
		timeZone: release.timeZone || "Asia/Almaty",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(sourceDate);

	return {
		version,
		stamp: `${date} - ${time} (${release.utcOffsetLabel || "UTC+5"})`,
	};
}
