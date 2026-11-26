// يحفظ الموقع والأصوات والخطوط على الجهاز ليعمل دون إنترنت
// من إنشاء م. كريم عادل اللوح
const CACHE = "rehlat-v32";
const LETTER_IDS = "alif ba ta tha jim hha kha dal dhal ra zay sin shin sad dad tta dha ain ghain fa qaf kaf lam mim nun ha waw hamza ya".split(" ");
const CORE = ["./", "index.html", "teacher.html", "about.html", "cert.js", "intro.js", "write.js", "icons.js", "voice.js", "studio.html", "voices.html", "vendor/anime.umd.min.js", "config.js", "manifest.webmanifest",
  "favicon.ico", "icons/rehla-32.png", "icons/rehla.svg", "icons/rehla-192.png", "icons/rehla-512.png", "icons/rehla-touch.png", "icons/wordmark-light.svg", "icons/wordmark-dark.svg", "icons/mark-stamp.svg", "lessons-meta.js", "audio/intro/1.mp3", "audio/intro/2.mp3", "audio/intro/3b.mp3", "audio/intro/4.mp3", "audio/intro/5.mp3", "audio/intro/l-alif.mp3", "audio/intro/l-qaf.mp3", "audio/intro/l-ra.mp3", "audio/intro/l-hamza.mp3", "vendor/qrcode.js", "report.html",
  ...LETTER_IDS.map(id => `audio/letters/${id}.mp3`)];
const FONTS_CSS = "https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;700;800&family=Noto+Naskh+Arabic:wght@700&display=swap";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([
    ...CORE.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})),
    // الخطوط: ملف الوصف وملفات الخط نفسها
    fetch(FONTS_CSS).then(async r => {
      if (!r.ok) return;
      await c.put(FONTS_CSS, r.clone());
      const css = await r.text();
      const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]);
      await Promise.all(urls.map(u => c.add(u).catch(() => {})));
    }).catch(() => {})
  ])));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const put = (req, res) => {
  if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
};

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // سجل المعلم (Google): لا يُخزَّن، فالبيانات يجب أن تكون حديثة
  if (url.hostname.endsWith("google.com") || url.hostname.endsWith("googleusercontent.com")) return;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const fresh = !isFont && (req.mode === "navigate" || /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/"));
  if (fresh) {
    // الصفحات: من الشبكة أولاً حتى تصل التحديثات، ومن الذاكرة عند انقطاع الإنترنت
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => put(req, res)).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(h => h || (req.mode === "navigate" ? caches.match("index.html") : undefined))));
  } else {
    // الأصوات والخطوط والأيقونات: من الذاكرة أولاً
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
  }
});
