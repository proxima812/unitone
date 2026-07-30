export const ARCHIVE_PUBLISH_TIME_ZONE = "Asia/Almaty";

function dateKeyInTimeZone(value = new Date(), timeZone = ARCHIVE_PUBLISH_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat("en", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(value);

	const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${byType.year}-${byType.month}-${byType.day}`;
}

export function getArchivePublishDateKey(value) {
	if (!value) return "";

	if (typeof value === "string") {
		const match = value.match(/^\d{4}-\d{2}-\d{2}/);
		if (match) return match[0];
	}

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	return dateKeyInTimeZone(date);
}

export function isArchiveEntryPublished(entry, now = new Date()) {
	const publishDate = entry?.data?.pubDate ?? entry?.data?.date ?? entry?.pubDate ?? entry?.date;
	const publishDateKey = getArchivePublishDateKey(publishDate);

	if (!publishDateKey) return true;

	return publishDateKey <= dateKeyInTimeZone(now);
}

export function filterPublishedArchiveEntries(entries, now = new Date()) {
	return entries.filter((entry) => isArchiveEntryPublished(entry, now));
}
