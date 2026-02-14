import { config } from "@/config";

function computeVersion(step: number) {
	const normalized = Number.isFinite(step) ? Math.max(0, Math.floor(step)) : 0;
	const major = 2 + Math.floor((normalized + 1) / 6);
	const minor = (normalized + 1) % 6;
	return `${major}.${minor}`;
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
