export interface TelegramWebApp {
	initData: string;
	ready?: () => void;
	expand?: () => void;
}

interface TelegramWindow extends Window {
	Telegram?: {
		WebApp?: TelegramWebApp;
	};
}

const telegram = (window as TelegramWindow).Telegram?.WebApp;
const syncKey = "unityone.telegram.profile.synced";

export interface TelegramProfileResponse {
	ok: true;
	profile: {
		firstName: string;
		lastName: string;
		username: string;
		photoUrl: string;
		createdAt: string;
		updatedAt: string;
		isAdmin: boolean;
	};
}

interface TelegramProfileErrorResponse {
	ok: false;
	error: string;
}

let currentRequest: Promise<TelegramProfileResponse | TelegramProfileErrorResponse | null> | null = null;
let currentResult: TelegramProfileResponse | null = null;

export function telegramWebApp(): TelegramWebApp | undefined {
	return telegram;
}

export function syncTelegramProfile(
	options: { force?: boolean } = {},
): Promise<TelegramProfileResponse | TelegramProfileErrorResponse | null> {
	if (!telegram?.initData) return Promise.resolve(null);
	if (currentResult) return Promise.resolve(currentResult);
	if (currentRequest) return currentRequest;

	const request = (async () => {
	try {
		const storage = window.sessionStorage;
		if (!options.force && storage.getItem(syncKey) === telegram.initData) return null;

		const response = await fetch("/api/telegram/profile", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ initData: telegram.initData }),
		});
		const payload = await response.json() as TelegramProfileResponse | TelegramProfileErrorResponse;

		if (response.ok && payload.ok) {
			storage.setItem(syncKey, telegram.initData);
			currentResult = payload;
		}
		return payload;
	} catch {
		// Profile sync is retried on the next page load; the form still reports submit errors explicitly.
		return null;
	}
	})();

	currentRequest = request;
	void request.then(() => {
		if (currentRequest === request) currentRequest = null;
	});
	return request;
}

telegram?.ready?.();
telegram?.expand?.();
void syncTelegramProfile();
