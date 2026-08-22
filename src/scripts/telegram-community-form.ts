interface TelegramWebAppUser {
	id: number;
	first_name?: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
}

interface TelegramWebApp {
	initData: string;
	initDataUnsafe?: {
		user?: TelegramWebAppUser;
	};
	ready?: () => void;
	expand?: () => void;
	HapticFeedback?: {
		notificationOccurred?: (type: "success" | "warning" | "error") => void;
	};
}

export {};

declare global {
	interface Window {
		Telegram?: {
			WebApp?: TelegramWebApp;
		};
	}
}

const form = document.querySelector<HTMLFormElement>("[data-community-proposal-form]");
const profile = document.querySelector<HTMLElement>("[data-telegram-profile]");
const statusElement = document.querySelector<HTMLElement>("[data-community-proposal-status]");
const submitButton = form?.querySelector<HTMLButtonElement>("button[type='submit']");
const telegram = window.Telegram?.WebApp;

function setStatus(message: string, tone: "neutral" | "error" | "success" = "neutral"): void {
	if (!statusElement) return;
	statusElement.textContent = message;
	statusElement.dataset.tone = tone;
	statusElement.hidden = !message;
}

function displayProfile(): void {
	const user = telegram?.initDataUnsafe?.user;
	if (!profile) return;

	if (!telegram?.initData) {
		profile.textContent = "Откройте эту форму внутри Telegram, чтобы отправить карточку.";
		profile.dataset.state = "blocked";
		submitButton?.setAttribute("disabled", "true");
		return;
	}

	const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
	const username = user?.username ? `@${user.username}` : "";
	profile.textContent = [name || "Профиль Telegram", username].filter(Boolean).join(" · ");
	profile.dataset.state = "ready";
}

async function submitProposal(event: SubmitEvent): Promise<void> {
	event.preventDefault();
	if (!form || !submitButton) return;
	if (!telegram?.initData) {
		setStatus("Откройте приложение внутри Telegram.", "error");
		return;
	}

	const formData = new FormData(form);
	const body = {
		initData: telegram.initData,
		title: String(formData.get("title") ?? ""),
		description: String(formData.get("description") ?? ""),
		category: String(formData.get("category") ?? ""),
		since: String(formData.get("since") ?? ""),
		website: String(formData.get("website") ?? ""),
		finderUrl: String(formData.get("finderUrl") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	};

	submitButton.disabled = true;
	setStatus("Отправляем карточку…");

	try {
		const response = await fetch("/api/community-proposals", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const result = await response.json() as { ok?: boolean; error?: string };
		if (!response.ok || !result.ok) {
			throw new Error(result.error || "Не удалось отправить карточку.");
		}
		form.reset();
		telegram.HapticFeedback?.notificationOccurred?.("success");
		setStatus("Карточка отправлена на проверку.", "success");
	} catch (error) {
		telegram.HapticFeedback?.notificationOccurred?.("error");
		setStatus(error instanceof Error ? error.message : "Не удалось отправить карточку.", "error");
	} finally {
		submitButton.disabled = false;
	}
}

telegram?.ready?.();
telegram?.expand?.();
displayProfile();
form?.addEventListener("submit", (event) => void submitProposal(event));
