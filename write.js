/* «كيف يُكتب الحرف؟» — يكتب الحرف أمام الطفل بمسار القلم: الجسم أولاً ثم النقاط
   مسار القلم يُستخرج تلقائياً من خط النسخ نفسه (هيكل الحرف)، والحركة بـ Anime.js v4 (vendor/anime.umd.min.js)
   من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
(function () {
"use strict";
const S = 240;                       // حجم لوحة الرسم الداخلية
const FONT = '"Noto Naskh Arabic", "Amiri", serif';
const INK = "#23266b";
// من أين يبدأ القلم: k أكبر = يفضّل الأعلى، وأصغر = يفضّل اليمين (القيمة الافتراضية 0.5)
const START_K = { "ا": 4, "ل": 4, "ك": 1.2, "ط": 2, "ظ": 2, "ج": 4, "ح": 4, "خ": 4, "ي": 2 };
// حروف تبدأ برأس مستدير: يبدأ القلم من أعلى يمين الرأس لا من طرف الذيل
const FROM_HEAD = "وفقمهصض";
// مسار القلم المرسوم يدوياً للحروف المركّبة: كل خط = نقاط على هيكل الحرف (لوحة 240)، والقلم يمشي على الهيكل بينها.
// خطان منفصلان = رفع القلم. الحروف البسيطة (خط واحد) تُحسب تلقائياً من طرف البداية إلى أبعد طرف.
const ROUTES = {
  "ج": [[[68,57],[125,67],[180,58],[125,67],[67,150],[117,189],[170,178]]],
  "ح": [[[68,57],[125,67],[180,58],[125,67],[67,150],[117,189],[170,178]]],
  "خ": [[[79,90],[126,98],[165,91],[126,98],[80,160],[117,191],[165,180]]],
  "س": [[[193,72],[187,118],[153,117],[160,86],[153,117],[117,121],[111,96],[117,121],[110,150],[70,164],[44,119]]],
  "ش": [[[193,89],[188,135],[153,133],[160,103],[153,133],[117,138],[111,113],[117,138],[110,165],[67,181],[44,136]]],
  "ص": [[[121,119],[140,92],[170,79],[197,106],[150,122],[121,119],[107,96],[110,150],[60,160],[43,120]]],
  "ض": [[[110,137],[130,112],[169,96],[197,122],[150,140],[110,137],[106,115],[103,160],[60,180],[43,138]]],
  "ط": [[[48,172],[85,184],[140,187],[193,149],[152,121],[96,151]], [[87,48],[96,151]]],
  "ظ": [[[48,172],[85,184],[140,186],[195,150],[155,121],[96,152]], [[87,48],[96,152]]],
  "ع": [[[122,56],[98,50],[72,80],[96,108],[143,89],[96,108],[76,160],[120,190],[166,178]]],
  "غ": [[[117,86],[100,83],[83,105],[100,128],[131,117],[100,128],[85,171],[115,191],[150,185]]],
  "ف": [[[190,142],[180,112],[160,102],[138,125],[160,150],[190,142],[197,170],[100,190],[45,136]]],
  "ق": [[[161,134],[155,105],[137,93],[112,120],[131,139],[161,134],[164,160],[104,190],[74,138]]],
  "م": [[[90,74],[117,54],[150,95],[82,118],[86,180],[80,197]]],
  "ه": [[[141,88],[170,98],[192,150],[175,171],[132,158],[138,120],[141,88],[110,92],[90,130],[106,158],[49,158]]],
  "و": [[[166,118],[122,127],[93,100],[126,58],[162,95],[166,118],[168,140],[106,185],[73,176]]],
  "ي": [[[167,56],[155,51],[120,90],[160,113],[168,120],[105,155],[72,104]]],
  "ء": [[[150,91],[126,66],[71,105],[70,130],[93,161]], [[172,153],[93,161],[52,183]]]
};
// أجزاء ليست نقاطاً ولا هيكلاً واضحاً (مثل همزة الكاف): مسار مباشر
const MARKS = { "ك": [[124,100],[112,108],[116,118],[125,123],[110,135],[95,145]] };

/* ---------- تحميل Anime.js عند الحاجة فقط ---------- */
let animeP = null;
function loadAnime() {
  if (window.anime && window.anime.createTimeline) return Promise.resolve(window.anime);
  return animeP = animeP || new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "vendor/anime.umd.min.js";
    s.onload = () => res(window.anime); s.onerror = rej; document.head.appendChild(s);
  });
}

/* ---------- رسم الحرف على لوحة وقراءة بكسلاته ---------- */
function rasterize(ch) {
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const ctx = cv.getContext("2d");
  let fs = 160;
  const measure = () => { ctx.font = `700 ${fs}px ${FONT}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; return ctx.measureText(ch); };
  let m = measure();
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  fs = Math.floor(fs * Math.min(S * .7 / Math.max(w, 1), S * .7 / Math.max(h, 1)));
  m = measure();
  const W = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, Hh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const x = (S - W) / 2 + m.actualBoundingBoxLeft, y = (S - Hh) / 2 + m.actualBoundingBoxAscent;
  ctx.fillStyle = INK; ctx.fillText(ch, x, y);
  const data = ctx.getImageData(0, 0, S, S).data, bin = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) bin[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  return { url: cv.toDataURL("image/png"), bin };
}

const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
// المكوّنات المتصلة (جسم الحرف، وكل نقطة وحدها)
function components(bin) {
  const lab = new Int32Array(S * S).fill(-1), comps = [];
  for (let i = 0; i < S * S; i++) {
    if (!bin[i] || lab[i] >= 0) continue;
    const id = comps.length, px = [], st = [i]; lab[i] = id;
    while (st.length) {
      const p = st.pop(); px.push(p); const x = p % S, y = (p / S) | 0;
      for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy, q = ny * S + nx;
        if (nx >= 0 && ny >= 0 && nx < S && ny < S && bin[q] && lab[q] < 0) { lab[q] = id; st.push(q); } }
    }
    let sx = 0, sy = 0; px.forEach(p => { sx += p % S; sy += (p / S) | 0; });
    comps.push({ id, px, cx: sx / px.length, cy: sy / px.length });
  }
  return { lab, comps };
}
// المسافة إلى أقرب نقطة خارج الحرف (لمعرفة سماكة الخط)
function distance(bin) {
  const d = new Float32Array(S * S), INF = 1e9;
  for (let i = 0; i < S * S; i++) d[i] = bin[i] ? INF : 0;
  const a = 1, b = 1.414;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = y * S + x; if (!d[i]) continue;
    if (x > 0) d[i] = Math.min(d[i], d[i - 1] + a); if (y > 0) d[i] = Math.min(d[i], d[i - S] + a);
    if (x > 0 && y > 0) d[i] = Math.min(d[i], d[i - S - 1] + b); if (x < S - 1 && y > 0) d[i] = Math.min(d[i], d[i - S + 1] + b); }
  for (let y = S - 1; y >= 0; y--) for (let x = S - 1; x >= 0; x--) { const i = y * S + x; if (!d[i]) continue;
    if (x < S - 1) d[i] = Math.min(d[i], d[i + 1] + a); if (y < S - 1) d[i] = Math.min(d[i], d[i + S] + a);
    if (x < S - 1 && y < S - 1) d[i] = Math.min(d[i], d[i + S + 1] + b); if (x > 0 && y < S - 1) d[i] = Math.min(d[i], d[i + S - 1] + b); }
  return d;
}
// ترقيق Zhang-Suen: يحوّل الشكل المملوء إلى خط بعرض بكسل واحد (مسار القلم)
function thin(img) {
  const g = (x, y) => (x < 0 || y < 0 || x >= S || y >= S) ? 0 : img[y * S + x];
  let changed = true;
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      const del = [];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (!img[y * S + x]) continue;
        const p = [g(x, y - 1), g(x + 1, y - 1), g(x + 1, y), g(x + 1, y + 1), g(x, y + 1), g(x - 1, y + 1), g(x - 1, y), g(x - 1, y - 1)];
        const B = p.reduce((s, v) => s + v, 0); if (B < 2 || B > 6) continue;
        let A = 0; for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) A++;
        if (A !== 1) continue;
        if (step === 0 ? (p[0] * p[2] * p[4] || p[2] * p[4] * p[6]) : (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
        del.push(y * S + x);
      }
      if (del.length) { changed = true; del.forEach(i => img[i] = 0); }
    }
  }
  return img;
}
const nbrs = (img, p) => { const x = p % S, y = (p / S) | 0, out = [];
  for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < S && ny < S && img[ny * S + nx]) out.push(ny * S + nx); } return out; };
// إزالة الزوائد القصيرة التي يتركها الترقيق عند أطراف الخط
function prune(img, set, minLen) {
  for (let pass = 0; pass < 2; pass++) {
    const ends = [...set].filter(p => img[p] && nbrs(img, p).length === 1);
    for (const e of ends) {
      const path = [e]; let prev = -1, cur = e, junction = false;
      while (path.length <= minLen) {
        const n = nbrs(img, cur).filter(q => q !== prev && path.indexOf(q) < 0);
        if (n.length !== 1) { junction = n.length > 1; break; }
        if (nbrs(img, n[0]).length > 2) { junction = true; break; }
        prev = cur; cur = n[0]; path.push(cur);
      }
      if (junction && path.length < minLen) path.forEach(p => { img[p] = 0; set.delete(p); });
    }
  }
}
// ترتيب بكسلات الهيكل في خطوط متتالية كما يتحرك القلم
function strokesOf(img, set, k, fromHead) {
  const pts = [...set].filter(p => img[p]);
  if (!pts.length) return [];
  const score = (p) => (p % S) - k * ((p / S) | 0);
  const ends = pts.filter(p => nbrs(img, p).length === 1);
  // أفضل نقطة في الحرف كله، ثم أقرب طرف خط إليها (إن كان قريباً)
  let start = pts.reduce((a, b) => score(b) > score(a) ? b : a);
  if (!fromHead) { const d2 = (a, b) => ((a % S) - (b % S)) ** 2 + (((a / S) | 0) - ((b / S) | 0)) ** 2;
    const near = ends.filter(e => d2(e, start) < 18 * 18).sort((a, b) => d2(a, start) - d2(b, start))[0]; if (near != null) start = near; }
  const seen = new Set(), order = [], strokes = [];
  const walk = (from, prefix) => {
    const line = prefix ? [prefix, from] : [from]; seen.add(from); order.push(from);
    let cur = from;
    for (;;) {
      const cand = nbrs(img, cur).filter(q => !seen.has(q));
      if (!cand.length) break;
      // يفضّل الاستمرار في الاتجاه نفسه
      const a = line.length > 3 ? line[line.length - 4] : line[0], dx = (cur % S) - (a % S), dy = ((cur / S) | 0) - ((a / S) | 0);
      const best = cand.reduce((b, q) => { const qx = (q % S) - (cur % S), qy = ((q / S) | 0) - ((cur / S) | 0);
        const s = qx * dx + qy * dy - (qx && qy ? .3 : 0); return !b || s > b.s ? { q, s } : b; }, null).q;
      seen.add(best); order.push(best); line.push(best); cur = best;
    }
    strokes.push(line);
  };
  walk(start, null);
  for (;;) {
    let from = -1, via = -1;
    for (const p of order) { const u = nbrs(img, p).find(q => !seen.has(q)); if (u != null) { from = u; via = p; break; } }
    if (from < 0) { const rest = pts.find(p => !seen.has(p)); if (rest == null) break; from = rest; via = null; }
    walk(from, via);
  }
  return strokes.filter(l => l.length >= 3);
}
// أقصر طريق على الهيكل بين بكسلين (البحث بالعرض)
function geodesic(img, set, a, b) {
  if (a === b) return [a];
  const prev = new Map([[a, -1]]), q = [a];
  for (let h = 0; h < q.length; h++) { const p = q[h]; if (p === b) break;
    for (const n of nbrs(img, p)) if (set.has(n) && !prev.has(n)) { prev.set(n, p); q.push(n); } }
  if (!prev.has(b)) return null;
  const out = []; for (let p = b; p !== -1; p = prev.get(p)) out.push(p); return out.reverse();
}
const snap = (img, set, x, y) => { let best = -1, bd = 30 * 30;
  set.forEach(p => { if (!img[p]) return; const d = (p % S - x) ** 2 + (((p / S) | 0) - y) ** 2; if (d < bd) { bd = d; best = p; } }); return best; };
// مسار من نقاط يدوية؛ null إن لم يتطابق مع الهيكل (فيُستعمل الحساب التلقائي)
function routed(img, set, route) {
  const lines = [];
  for (const wps of route) {
    const pts = wps.map(([x, y]) => snap(img, set, x, y)); if (pts.some(p => p < 0)) return null;
    let line = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const g = geodesic(img, set, pts[i - 1], pts[i]); if (!g) return null; line = line.concat(g.slice(1)); }
    lines.push(line);
  }
  return lines;
}
// الحروف البسيطة: من طرف البداية إلى أبعد طرف على الهيكل، خطاً واحداً
function simpleRoute(img, set, k) {
  const pts = [...set].filter(p => img[p]); if (pts.length < 10) return null;
  // أبعد نقطتين على الهيكل (قطر الهيكل): طرفا الخط
  const farthest = (from) => { const seen = new Set([from]), q = [from];
    for (let h = 0; h < q.length; h++) for (const n of nbrs(img, q[h])) if (set.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
    return { last: q[q.length - 1], count: q.length }; };
  const A = farthest(pts[0]).last, B = farthest(A).last;
  const score = (p) => (p % S) - k * ((p / S) | 0);
  const line = score(A) >= score(B) ? geodesic(img, set, A, B) : geodesic(img, set, B, A);
  // يقبل فقط إن غطّى معظم الهيكل (أي أن الحرف خط واحد فعلاً)
  return line && line.length >= pts.length * .55 ? [line] : null;
}
const toPath = (line) => {
  const keep = line.filter((_, i) => i % 3 === 0 || i === line.length - 1);
  return keep.map((p, i) => `${i ? "L" : "M"}${p % S} ${(p / S) | 0}`).join(" ");
};
// الخط مقسّماً قطعاً صغيرة، لكل قطعة عرض فرشاة بقدر سماكة الحرف في موضعها
// (فرشاة واحدة عريضة كانت تكشف أجزاءً مجاورة قبل أن يصل إليها القلم، كما في ه و)
function toStroke(line, dist) {
  const n = line.length, CH = 8, chunks = [];
  for (let a = 0; a < n - 1; a += CH) {
    const b = Math.min(n - 1, a + CH), seg = line.slice(a, b + 1);
    let r = 0; for (let i = Math.max(0, a - 3); i <= Math.min(n - 1, b + 3); i++) r = Math.max(r, dist[line[i]]);
    chunks.push({ d: seg.map((p, i) => `${i ? "L" : "M"}${p % S} ${(p / S) | 0}`).join(" "), w: Math.ceil(r * 2 + 4), f0: a / (n - 1), f1: b / (n - 1) });
  }
  return { d: toPath(line), chunks };
}
const whole = (d, r) => ({ d, chunks: [{ d, w: Math.ceil(r * 2 + 5), f0: 0, f1: 1 }] });

/* ---------- تحليل الحرف: الصورة، والخطوط بالترتيب، وعرض فرشاة الكشف ---------- */
const cache = {};
async function analyze(ch) {
  if (cache[ch]) return cache[ch];
  try { await document.fonts.load(`700 160px ${FONT}`, ch + "بسم"); } catch (e) {}
  const { url, bin } = rasterize(ch);
  const { lab, comps } = components(bin), dist = distance(bin);
  const big = Math.max(...comps.map(c => c.px.length));
  // الجسم أولاً (الأكبر)، ثم الأجزاء الأخرى، ثم النقاط من اليمين إلى اليسار ومن الأعلى
  // النقطة: أصغر من الجسم، متراصّة (ليست مستطيلة) وممتلئة
  comps.forEach(c => { const xs = c.px.map(p => p % S), ys = c.px.map(p => (p / S) | 0);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    c.dot = c.px.length < big * .6 && Math.max(w / h, h / w) < 2.2 && c.px.length / (w * h) > .38; });
  comps.sort((a, b) => (a.dot - b.dot) || (a.dot ? (b.cx - a.cx) || (a.cy - b.cy) : b.px.length - a.px.length));
  const skel = thin(bin.slice());
  const body = comps.find(c => !c.dot);
  const parts = comps.map(c => {
    if (MARKS[ch] && c !== body) {
      const m = MARKS[ch], inBox = c.px.some(p => Math.abs(p % S - m[0][0]) < 14 && Math.abs(((p / S) | 0) - m[0][1]) < 14);
      if (inBox) { let r = 0; c.px.forEach(p => { r = Math.max(r, dist[p]); });
        const line = m.map(([x, y]) => y * S + x);
        return { dot: false, r, strokes: [whole(m.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" "), r)], len: line.length * 8 }; }
    }
    const set = new Set(c.px.filter(p => skel[p]));
    if (!c.dot) prune(skel, set, 12);
    let r = 0; set.forEach(p => { if (skel[p]) r = Math.max(r, dist[p]); });
    if (!set.size || c.dot) {
      // النقطة: ضربة قصيرة من يمينها إلى يسارها
      const xs = c.px.map(p => p % S), x1 = Math.max(...xs), x0 = Math.min(...xs), cy = Math.round(c.cy);
      c.px.forEach(p => { r = Math.max(r, dist[p]); });
      return { dot: true, r, strokes: [whole(`M${x1} ${cy} L${x0} ${cy}`, r)], len: x1 - x0 + 4 };
    }
    const k = START_K[ch] != null ? START_K[ch] : .5;
    const lines = (c === body && ROUTES[ch] && routed(skel, set, ROUTES[ch])) || simpleRoute(skel, set, k)
      || strokesOf(skel, set, k, FROM_HEAD.indexOf(ch) >= 0);
    return { dot: false, r, strokes: lines.map(l => toStroke(l, dist)), len: lines.reduce((s, l) => s + l.length, 0) };
  });
  return cache[ch] = { url, parts };
}

/* ---------- العرض والحركة ---------- */
let current = null;
function stop() { if (current) { try { current.tl.pause(); } catch (e) {} current = null; } }
let uid = 0;
async function play(box, ch, opts) {
  stop(); opts = opts || {};
  const [A, info] = await Promise.all([loadAnime(), analyze(ch)]);
  const id = "wm" + (++uid);
  box.innerHTML = `<svg viewBox="0 0 ${S} ${S}" class="wr-svg" role="img" aria-label="طريقة كتابة الحرف ${ch}">
    <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="#000"/>
      ${info.parts.map(p => p.strokes.map(st => st.chunks.map(c => `<path class="wr-m" d="${c.d}" fill="none" stroke="#fff" stroke-width="${c.w}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")).join("")).join("")}
      <rect class="wr-all" width="${S}" height="${S}" fill="#fff" opacity="0"/></mask></defs>
    <image href="${info.url}" width="${S}" height="${S}" opacity=".13"/>
    <image href="${info.url}" width="${S}" height="${S}" mask="url(#${id})"/>
    ${info.parts.map(p => p.strokes.map(st => `<path class="wr-g" d="${st.d}" fill="none" stroke="none"/>`).join("")).join("")}
    <circle class="wr-pen" r="7" cx="0" cy="0" fill="#ffd23f" stroke="#c79600" stroke-width="2" opacity="0"/></svg>`;
  const masks = [...box.querySelectorAll(".wr-m")], guides = [...box.querySelectorAll(".wr-g")], pen = box.querySelector(".wr-pen"), all = box.querySelector(".wr-all");
  // الكتابة هي محتوى الدرس ويطلبها الطفل بنفسه، فتعمل دائماً؛ ومع «تقليل الحركة» تكون بإيقاع ثابت هادئ
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { createTimeline, svg } = A;
  const tl = createTimeline({ autoplay: true, onComplete: () => { if (current && current.tl === tl) current = null; opts.onDone && opts.onDone(); } });
  let t = 250, k = 0, mi = 0;
  info.parts.forEach((p, pi) => {
    p.strokes.forEach((st, si) => {
      const g = guides[k]; k++;
      const len = Math.max(20, g.getTotalLength());
      const dur = Math.round(Math.min(2400, Math.max(p.dot ? 260 : 380, len * 7)));
      const mp = svg.createMotionPath(g);
      tl.add(pen, { opacity: 1, duration: 1, onBegin: () => opts.onStroke && opts.onStroke(p.dot) }, t)
        .add(pen, { translateX: mp.translateX, translateY: mp.translateY, duration: dur, ease: "linear" }, t);
      // القطع تُكشف واحدة بعد الأخرى مع مرور القلم عليها
      st.chunks.forEach(c => { const m = masks[mi++];
        tl.add(svg.createDrawable(m), { draw: ["0 0", "0 1"], duration: Math.max(16, Math.round(dur * (c.f1 - c.f0))), ease: "linear" }, t + Math.round(dur * c.f0)); });
      t += dur + (si < p.strokes.length - 1 ? 60 : p.dot ? 220 : 380);
    });
  });
  // في النهاية: الحرف كاملاً (يغطي أي جزء صغير لم يمر عليه القلم)
  tl.add(pen, { opacity: 0, duration: 250 }, t).add(all, { opacity: 1, duration: 400 }, t);
  current = { tl };
  return tl;
}

window.LetterWriter = { play, stop, analyze, loadAnime };
})();
