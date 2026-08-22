interface TelegramUnsafeUser {
	first_name?: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
}

function telegramUser(): TelegramUnsafeUser | undefined {
	return window.Telegram?.WebApp?.initDataUnsafe?.user;
}

function initials(user: TelegramUnsafeUser): string {
	const chars = [user.first_name, user.last_name]
		.map((part) => (part ?? "").trim().charAt(0))
		.filter(Boolean)
		.join("")
		.slice(0, 2);
	return (chars || (user.username ?? "").trim().charAt(0) || "?").toLocaleUpperCase("ru-RU");
}

function safeAvatarUrl(value: string | undefined): string | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : null;
	} catch {
		return null;
	}
}

document.querySelectorAll<HTMLElement>("[data-home-greeting]").forEach((root) => {
	const user = telegramUser();
	if (!user) return;

	const firstName = (user.first_name ?? "").trim();
	if (firstName) {
		const nameWrap = root.querySelector<HTMLElement>("[data-greeting-name-wrap]");
		const name = root.querySelector<HTMLElement>("[data-greeting-name]");
		if (name) name.textContent = firstName;
		if (nameWrap) nameWrap.hidden = false;
	}

	const avatarWrap = root.querySelector<HTMLElement>("[data-greeting-avatar-wrap]");
	const avatar = root.querySelector<HTMLImageElement>("[data-greeting-avatar]");
	const initialsEl = root.querySelector<HTMLElement>("[data-greeting-initials]");
	if (avatarWrap) avatarWrap.hidden = false;
	if (initialsEl) initialsEl.textContent = initials(user);

	const avatarUrl = safeAvatarUrl(user.photo_url);
	if (avatar && initialsEl && avatarUrl) {
		avatar.src = avatarUrl;
		avatar.hidden = false;
		initialsEl.hidden = true;
		avatar.addEventListener("error", () => {
			avatar.hidden = true;
			initialsEl.hidden = false;
		}, { once: true });
	}
});
