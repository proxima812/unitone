import { getBookmarks, isBookmarked, removeBookmark, toggleBookmark, type BookmarkItem } from "@/lib/bookmarks";

function initServiceWorker() {
	if (!("serviceWorker" in navigator)) return;
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js");
	});
}

function initPwaInstallBanner() {
	const installBanner = document.getElementById("pwa-install");
	const installBtn = document.getElementById("pwa-install-btn");
	if (!installBanner || !installBtn) return;

	const PWA_SHOW_DELAY_MS = 8_000;
	let deferredPrompt: BeforeInstallPromptEvent | null = null;

	const showPwaBanner = () => installBanner.classList.remove("hidden");
	const updateInstallBtnState = () => {
		installBtn.toggleAttribute("disabled", !deferredPrompt);
		installBtn.classList.toggle("opacity-60", !deferredPrompt);
		installBtn.classList.toggle("cursor-not-allowed", !deferredPrompt);
		installBtn.setAttribute(
			"title",
			deferredPrompt ? "Установить приложение" : "Установка пока недоступна в этом браузере",
		);
	};

	setTimeout(() => {
		showPwaBanner();
		updateInstallBtnState();
	}, PWA_SHOW_DELAY_MS);

	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		updateInstallBtnState();
	});

	installBtn.addEventListener("click", async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		await deferredPrompt.userChoice;
		deferredPrompt = null;
		updateInstallBtnState();
		installBanner.classList.add("hidden");
	});
}

function initCookieBanner() {
	const COOKIE_CONSENT_KEY = "cookieConsent_v1";
	const cookieBanner = document.getElementById("cookie-banner");
	const cookieSettings = document.getElementById("cookie-settings");
	const cookieOpenSettings = document.getElementById("cookie-open-settings");
	const cookieCloseSettings = document.getElementById("cookie-close-settings");
	const cookieAcceptAll = document.getElementById("cookie-accept-all");
	const cookieEssentialOnly = document.getElementById("cookie-essential-only");
	const cookieSaveSettings = document.getElementById("cookie-save-settings");
	const cookieAnalytics = document.getElementById("cookie-analytics") as HTMLInputElement | null;
	const cookieAds = document.getElementById("cookie-ads") as HTMLInputElement | null;

	if (!cookieBanner) return;

	const hideCookieBanner = () => cookieBanner.classList.add("hidden");
	const showCookieBanner = () => cookieBanner.classList.remove("hidden");
	const saveCookieConsent = (value: Record<string, unknown>) => {
		localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
		hideCookieBanner();
	};

	try {
		const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
		if (!savedConsent) showCookieBanner();
		else {
			const parsed = JSON.parse(savedConsent) as { analytics?: boolean; ads?: boolean };
			if (cookieAnalytics && typeof parsed.analytics === "boolean") cookieAnalytics.checked = parsed.analytics;
			if (cookieAds && typeof parsed.ads === "boolean") cookieAds.checked = parsed.ads;
		}
	} catch {
		showCookieBanner();
	}

	cookieOpenSettings?.addEventListener("click", () => cookieSettings?.classList.toggle("hidden"));
	cookieCloseSettings?.addEventListener("click", () => cookieSettings?.classList.add("hidden"));
	cookieAcceptAll?.addEventListener("click", () => {
		saveCookieConsent({ essential: true, analytics: true, ads: true, updatedAt: Date.now() });
	});
	cookieEssentialOnly?.addEventListener("click", () => {
		saveCookieConsent({ essential: true, analytics: false, ads: false, updatedAt: Date.now() });
	});
	cookieSaveSettings?.addEventListener("click", () => {
		saveCookieConsent({
			essential: true,
			analytics: Boolean(cookieAnalytics?.checked),
			ads: Boolean(cookieAds?.checked),
			updatedAt: Date.now(),
		});
	});
}

function setToggleVisualState(button: HTMLButtonElement, active: boolean) {
	button.setAttribute("aria-pressed", active ? "true" : "false");
	button.textContent = active ? "В закладках" : "В закладки";
	button.classList.toggle("border-[color:var(--text)]", active);
	button.classList.toggle("bg-[color:var(--text)]", active);
	button.classList.toggle("text-[color:var(--surface)]", active);
	button.classList.toggle("border-[color:var(--border)]", !active);
	button.classList.toggle("bg-[color:var(--surface)]", !active);
	button.classList.toggle("text-[color:var(--text)]", !active);
	button.classList.toggle("hover:border-[color:var(--accent)]", !active);
}

function initBookmarkToggles() {
	const buttons = Array.from(document.querySelectorAll("[data-bookmark-toggle]")) as HTMLButtonElement[];
	if (!buttons.length) return;

	const syncButtons = () => {
		buttons.forEach((button) => {
			const id = button.dataset.bookmarkId || "";
			setToggleVisualState(button, id ? isBookmarked(id) : false);
		});
	};

	buttons.forEach((button) => {
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			const item: BookmarkItem = {
				id: button.dataset.bookmarkId || "",
				title: button.dataset.bookmarkTitle || "",
				description: button.dataset.bookmarkDescription || "",
				date: button.dataset.bookmarkDate || "",
				href: button.dataset.bookmarkHref || "",
			};
			if (!item.id || !item.href) return;
			toggleBookmark(item);
			syncButtons();
		});
	});

	window.addEventListener("bookmarks-updated", syncButtons);
	window.addEventListener("storage", (event) => {
		if (event.key === "unitone_bookmarks") syncButtons();
	});
	syncButtons();
}

function renderBookmarksList(root: HTMLElement) {
	const empty = root.querySelector("[data-bookmarks-empty]") as HTMLElement | null;
	const grid = root.querySelector("[data-bookmarks-grid]") as HTMLElement | null;
	if (!empty || !grid) return;

	const list = getBookmarks();
	if (!list.length) {
		empty.classList.remove("hidden");
		grid.classList.add("hidden");
		grid.innerHTML = "";
		return;
	}

	empty.classList.add("hidden");
	grid.classList.remove("hidden");
	grid.innerHTML = list
		.map((item) => {
			const safeTitle = escapeHtml(item.title || "Без названия");
			const safeDesc = escapeHtml(item.description || "");
			const safeHref = escapeAttr(item.href || "/");
			const safeId = escapeAttr(item.id);
			return `
				<article class="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
					<h3 class="mb-2 text-xl font-semibold text-[color:var(--text)]">${safeTitle}</h3>
					${safeDesc ? `<p class="mb-4 line-clamp-3 text-sm text-[color:var(--muted)]">${safeDesc}</p>` : ""}
					<div class="flex items-center gap-3">
						<a class="text-sm font-medium text-[color:var(--accent)] hover:underline" href="${safeHref}">Открыть</a>
						<button type="button" data-bookmarks-remove-id="${safeId}" class="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]">Удалить</button>
					</div>
				</article>
			`;
		})
		.join("");

	grid.querySelectorAll("[data-bookmarks-remove-id]").forEach((button) => {
		button.addEventListener("click", () => {
			const id = (button as HTMLElement).getAttribute("data-bookmarks-remove-id") || "";
			if (!id) return;
			removeBookmark(id);
			renderBookmarksList(root);
		});
	});
}

function initBookmarksLists() {
	const lists = Array.from(document.querySelectorAll("[data-bookmarks-list]")) as HTMLElement[];
	if (!lists.length) return;
	const renderAll = () => lists.forEach((root) => renderBookmarksList(root));
	window.addEventListener("bookmarks-updated", renderAll);
	window.addEventListener("storage", (event) => {
		if (event.key === "unitone_bookmarks") renderAll();
	});
	renderAll();
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: string; platform: string }>;
};

function initClient() {
	initServiceWorker();
	initPwaInstallBanner();
	initCookieBanner();
	initBookmarkToggles();
	initBookmarksLists();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initClient, { once: true });
} else {
	initClient();
}
