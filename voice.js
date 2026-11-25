/* بنك الأصوات — النواة المشتركة بين «استوديو التسجيل» (studio.html) والدروس (index.html)
   التسجيل، قصّ الصمت، بصمة الصوت (MFCC)، المقارنة (DTW)، حفظ التسجيلات على الجهاز، وجلب البنك وأفضل صوت من السجل
   كل التحليل داخل الجهاز. من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
(function () {
"use strict";
const SR = 16000;

/* ---------- المقاطع: الحروف (كما في الدرس الرابع) × الحركات ---------- */
const HAR = [{ k: "fatha", m: "َ", name: "فتحة", hamza: "أ" }, { k: "kasra", m: "ِ", name: "كسرة", hamza: "إ" }, { k: "damma", m: "ُ", name: "ضمة", hamza: "أ" }];
const LET = [["ء", "همزة"], ["ب", "با"], ["ت", "تا"], ["ث", "ثا"], ["ج", "جيم"], ["ح", "حا"], ["خ", "خا"], ["د", "دال"], ["ذ", "ذال"], ["ر", "را"],
  ["ز", "زاي"], ["س", "سين"], ["ش", "شين"], ["ص", "صاد"], ["ض", "ضاد"], ["ط", "طا"], ["ظ", "ظا"], ["ع", "عين"], ["غ", "غين"], ["ف", "فا"],
  ["ق", "قاف"], ["ك", "كاف"], ["ل", "لام"], ["م", "ميم"], ["ن", "نون"], ["ه", "ها"], ["و", "واو"], ["ي", "يا"], ["ة", "تاء مربوطة"]].map(([c, name]) => ({ c, name }));
const syl = (c, h) => (c === "ء" ? h.hamza : c) + h.m;
// كل مقطع: k = المفتاح في البنك («بِ»)، sp = التهجئة كما في الكتاب («با كسرة بِ»)
const ITEMS = [];
LET.forEach(L => HAR.forEach(h => ITEMS.push({ k: syl(L.c, h), c: L.c, name: L.name, h: h.name, hk: h.k, sp: L.name + " " + h.name + " " + syl(L.c, h) })));
const spKey = (k) => "sp:" + k;

/* ---------- التسجيل ---------- */
let stream = null;
async function record(ms, onLevel) {
  stream = stream && stream.active ? stream : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 } });
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an);
  const buf = new Uint8Array(an.fftSize);
  const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", ""].find(t => !t || (window.MediaRecorder && MediaRecorder.isTypeSupported(t)));
  const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined), chunks = [];
  mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const t0 = performance.now(); let raf = 0;
  const tick = () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); if (onLevel) onLevel(m / 128, (performance.now() - t0) / ms); raf = requestAnimationFrame(tick); };
  const done = new Promise(res => mr.onstop = res);
  mr.start(); tick();
  await new Promise(r => setTimeout(r, ms)); mr.stop(); await done; cancelAnimationFrame(raf);
  const blob = new Blob(chunks, { type: mr.mimeType || type || "audio/webm" });
  const dec = await ac.decodeAudioData(await blob.arrayBuffer()); ac.close();
  const off = new OfflineAudioContext(1, Math.ceil(dec.duration * SR), SR);
  const src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0).slice();
}
function stopMic() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }

/* ---------- قصّ الصمت (يبقي 60 مللي ثانية قبل الكلام وبعده) ---------- */
function trim(x) {
  const F = 400, H = 160, n = Math.max(0, Math.floor((x.length - F) / H) + 1), e = [];
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < F; j++) { const v = x[i * H + j]; s += v * v; } e.push(Math.sqrt(s / F)); }
  if (!e.length) return null;
  const sorted = e.slice().sort((a, b) => a - b), noise = sorted[Math.floor(sorted.length * .1)], peak = sorted[sorted.length - 1];
  const th = Math.max(noise * 3, peak * .12, .004);
  let a = e.findIndex(v => v > th), b = e.length - 1 - e.slice().reverse().findIndex(v => v > th);
  if (a < 0 || peak < .01) return null;
  a = Math.max(0, a - 6); b = Math.min(e.length - 1, b + 6);
  if ((b - a) * H < SR * .12) return null;
  return x.slice(a * H, b * H + F);
}

/* ---------- بصمة الصوت MFCC: 25 مللي ثانية كل 10، 26 مرشح ميل، 12 معاملاً مع إزالة المتوسط ---------- */
const NFFT = 512, NMEL = 26, NCEP = 12;
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) { const a = i + j, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
const hz2mel = (f) => 2595 * Math.log10(1 + f / 700), mel2hz = (m) => 700 * (10 ** (m / 2595) - 1);
const MELB = (() => { const lo = hz2mel(80), hi = hz2mel(7600), pts = Array.from({ length: NMEL + 2 }, (_, i) => Math.floor((NFFT + 1) * mel2hz(lo + (hi - lo) * i / (NMEL + 1)) / SR));
  return Array.from({ length: NMEL }, (_, m) => { const w = new Float32Array(NFFT / 2 + 1);
    for (let k = pts[m]; k < pts[m + 1]; k++) w[k] = (k - pts[m]) / Math.max(1, pts[m + 1] - pts[m]);
    for (let k = pts[m + 1]; k < pts[m + 2]; k++) w[k] = (pts[m + 2] - k) / Math.max(1, pts[m + 2] - pts[m + 1]); return w; }); })();
const HAMM = Float32Array.from({ length: 400 }, (_, i) => .54 - .46 * Math.cos(2 * Math.PI * i / 399));
function mfcc(x) {
  const F = 400, H = 160, frames = [];
  for (let s = 0; s + F <= x.length; s += H) {
    const re = new Float32Array(NFFT), im = new Float32Array(NFFT);
    for (let i = 0; i < F; i++) re[i] = (x[s + i] - .97 * (x[s + i - 1] || 0)) * HAMM[i];
    fft(re, im);
    const pw = new Float32Array(NFFT / 2 + 1); for (let k = 0; k <= NFFT / 2; k++) pw[k] = re[k] * re[k] + im[k] * im[k];
    const mel = MELB.map(w => { let s2 = 1e-10; for (let k = 0; k < w.length; k++) s2 += w[k] * pw[k]; return Math.log(s2); });
    const c = []; for (let n = 1; n <= NCEP; n++) { let v = 0; for (let m = 0; m < NMEL; m++) v += mel[m] * Math.cos(Math.PI * n * (m + .5) / NMEL); c.push(v); }
    frames.push(c);
  }
  const mean = Array(NCEP).fill(0); frames.forEach(f => f.forEach((v, i) => mean[i] += v / frames.length));
  return frames.map(f => f.map((v, i) => Math.round((v - mean[i]) * 10) / 10));
}
/* ---------- DTW: المسافة بين تسجيلين مع مطّ الزمن ---------- */
function dtw(a, b) {
  const n = a.length, m = b.length, D = new Float32Array((n + 1) * (m + 1)).fill(Infinity), L = new Uint16Array((n + 1) * (m + 1));
  D[0] = 0;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const p = a[i - 1], q = b[j - 1]; let s = 0; for (let k = 0; k < NCEP; k++) { const d = p[k] - q[k]; s += d * d; }
    const x = (i - 1) * (m + 1) + j, y = i * (m + 1) + j - 1, z = (i - 1) * (m + 1) + j - 1;
    let best = z; if (D[x] < D[best]) best = x; if (D[y] < D[best]) best = y;
    D[i * (m + 1) + j] = D[best] + Math.sqrt(s); L[i * (m + 1) + j] = L[best] + 1;
  }
  return D[n * (m + 1) + m] / Math.max(1, L[n * (m + 1) + m]);
}
// refsOf(key) ← قائمة بصمات؛ يعيد المرشحين مرتبين من الأقرب مع نسبة ثقة
function classify(feat, cands, refsOf) {
  const rows = cands.map(k => ({ k, d: Math.min(...(refsOf(k) || []).map(f => dtw(feat, f))) })).filter(r => isFinite(r.d)).sort((a, b) => a.d - b.d);
  if (!rows.length) return [];
  const T = Math.max(.5, rows[0].d * .12), ex = rows.map(r => Math.exp(-(r.d - rows[0].d) / T)), sum = ex.reduce((a, b) => a + b, 0);
  return rows.map((r, i) => Object.assign(r, { p: Math.round(ex[i] / sum * 100) }));
}
// يحكم على آخر الكلام (الصوت الأخير في التهجئة)
function tail(seg, refLens) {
  const s = refLens.slice().sort((a, b) => a - b), L = Math.round(s[s.length >> 1] * 1.3);
  return seg.subarray(Math.max(0, seg.length - (L * 160 + 240)));
}

/* ---------- ملف WAV (16 كيلوهرتز أحادي) للمقطع المقصوص: يعمل على كل الأجهزة ---------- */
function wav(x) {
  const b = new ArrayBuffer(44 + x.length * 2), v = new DataView(b), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + x.length * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, x.length * 2, true);
  let peak = 0; for (const s of x) peak = Math.max(peak, Math.abs(s)); const g = peak > 0 ? Math.min(4, .9 / peak) : 1;
  for (let i = 0; i < x.length; i++) { const e = Math.min(1, i / 320, (x.length - i) / 480); v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i] * g * e)) * 32767, true); }
  return new Blob([b], { type: "audio/wav" });
}
const toB64 = (blob) => new Promise(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.readAsDataURL(blob); });
const fromB64 = (b64, mime) => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new Blob([a], { type: mime || "audio/wav" }); };

/* ---------- تسجيلات الاستوديو على الجهاز (IndexedDB) ---------- */
let dbp = null;
const idb = () => dbp = dbp || new Promise((res, rej) => { const r = indexedDB.open("rehla-voices", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("recs", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction("recs", mode), s = t.objectStore("recs"), out = fn(s);
  t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
const store = {
  put: (rec) => tx("readwrite", s => s.put(rec)),
  all: () => tx("readonly", s => s.getAll()),
  del: (id) => tx("readwrite", s => s.delete(id)),
  clear: () => tx("readwrite", s => s.clear())
};

/* ---------- البنك من السجل: بصمات التسجيلات المقبولة، وأفضل صوت لكل مقطع ---------- */
const CFG = () => window.QAIDA_CONFIG || {};
const api = (q) => CFG().backendUrl + (CFG().backendUrl.includes("?") ? "&" : "?") + q;
const BANK_CACHE = "rehla-bank-v1";
const bank = { data: {}, loaded: {} };
// يجلب بنك مجموعة مقاطع (من الشبكة، وإلا من النسخة المحفوظة على الجهاز)
async function loadBank(keys) {
  const want = keys.filter(k => !bank.loaded[k]);
  if (!want.length || !CFG().backendUrl) return bank.data;
  const url = api("action=bank&keys=" + encodeURIComponent(want.join(",")));
  let j = null;
  try {
    if (navigator.onLine) { const r = await fetch(url, { cache: "no-store" }); j = await r.clone().json(); if (j && j.bank && "caches" in window) (await caches.open(BANK_CACHE)).put(url, r); }
  } catch (e) {}
  if (!j && "caches" in window) { try { const hit = await (await caches.open(BANK_CACHE)).match(url); if (hit) j = await hit.json(); } catch (e) {} }
  if (j && j.bank) { want.forEach(k => bank.loaded[k] = true); Object.assign(bank.data, j.bank); }
  return bank.data;
}
const bankRefs = (k) => (bank.data[k] && bank.data[k].f) || [];
const hasBank = (keys) => keys.every(k => bankRefs(k).length);
// رابط أفضل صوت لمقطع (يُحفظ على الجهاز بعد أول تحميل)
const bestUrls = {};
async function bestUrl(k) {
  if (bestUrls[k]) return bestUrls[k];
  if (!CFG().backendUrl || !(bank.data[k] && bank.data[k].best)) return null;
  const url = api("action=voice&k=" + encodeURIComponent(k) + "&v=" + encodeURIComponent(bank.data[k].best));
  let j = null;
  try {
    const c = "caches" in window ? await caches.open(BANK_CACHE) : null, hit = c && await c.match(url);
    if (hit) j = await hit.json();
    else if (navigator.onLine) { const r = await fetch(url); j = await r.clone().json(); if (c && j && j.b64) c.put(url, r); }
  } catch (e) {}
  if (!j || !j.b64) return null;
  return bestUrls[k] = URL.createObjectURL(fromB64(j.b64, j.mime));
}

window.Voice = { SR, HAR, LET, ITEMS, syl, spKey, record, stopMic, trim, mfcc, dtw, classify, tail, wav, toB64, fromB64, store, loadBank, bankRefs, hasBank, bestUrl, bank };
})();
