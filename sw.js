const V = "es26-44af94d9d2";
const CORE = ["./", "index.html", "data.enc", "manifest.webmanifest", "icon-192.d24e61ab.png", "icon-512.d24e61ab.png", "apple-touch-icon.d24e61ab.png", ];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(V) && k !== "es26-files").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (/\/f\/[0-9a-f]+\.bin$/.test(url.pathname)) {   // 원본 PDF: 한 번 받으면 계속 보관 (배포가 바뀌어도)
      e.respondWith(caches.open("es26-files").then(c => c.match(req).then(m => m || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
      return;
    }
    const fresh = req.mode === "navigate" || /(index\.html|data\.enc|\/)$/.test(url.pathname);
    if (fresh) {
      e.respondWith(timeout(fetch(url.href, { cache: "no-cache", credentials: "same-origin" }), 4000).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req.mode === "navigate" ? "index.html" : req, c)); return r; })
        .catch(() => caches.match(req.mode === "navigate" ? "index.html" : req, { ignoreSearch: true })));
    } else {
      e.respondWith(caches.match(req).then(m => m || fetch(req)));
    }
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(V + "-font").then(c => c.match(req).then(m => {
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => m);
      return m || net;
    })));
  }
});
