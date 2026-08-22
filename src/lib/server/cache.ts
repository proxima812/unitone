interface CacheEntry {
	value: unknown;
	expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
	const entry = store.get(key);
	if (entry && entry.expiresAt > Date.now()) return entry.value as T;

	const inflight = pending.get(key) as Promise<T> | undefined;
	if (inflight) return inflight;

	const promise = load()
		.then((value) => {
			store.set(key, { value, expiresAt: Date.now() + ttlMs });
			return value;
		})
		.finally(() => pending.delete(key));
	pending.set(key, promise);
	return promise;
}

export function invalidateCache(prefix?: string): void {
	if (!prefix) {
		store.clear();
		return;
	}
	for (const key of store.keys()) {
		if (key.startsWith(prefix)) store.delete(key);
	}
}
