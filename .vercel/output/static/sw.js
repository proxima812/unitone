const CACHE_NAME = "unitone-static-v1"
const ASSETS = ["/", "/offline.html", "/manifest.webmanifest", "/favicon.svg"]

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
	self.skipWaiting()
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
		),
	)
	self.clients.claim()
})

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return

	event.respondWith(
		fetch(event.request).catch(async () => {
			const cache = await caches.open(CACHE_NAME)
			const cached = await cache.match(event.request)
			return cached || cache.match("/offline.html")
		}),
	)
})
