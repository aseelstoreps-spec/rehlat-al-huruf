/* شهادة إتمام الدرس — تُرسم على Canvas لتُعرض وتُحمَّل كصورة وتُطبع
   من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
(function () {
"use strict";
const W = 1600, H = 1131;
const F_TITLE = '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif';
const F_DISP = '"Lalezar", "IBM Plex Sans Arabic", sans-serif';
const F_NAME = '"Noto Naskh Arabic", "Amiri", "Traditional Arabic", serif';
const C = { paper: "#fbfbff", green: "#23266b", greenDark: "#15174a", gold: "#f2b800", goldSoft: "#fff1b8", ink: "#1b1d45", soft: "#565a86", stamp: "#2a5fd0" };

const ORD = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر","الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر"];

function grade(score, total) {
  const p = total ? score / total : 0;
  if (p >= 1) return { ar: "ممتاز", en: "Excellent", stars: 3 };
  if (p >= 0.9) return { ar: "ممتاز", en: "Excellent", stars: 2 };
  if (p >= 0.8) return { ar: "جيد جداً", en: "Very Good", stars: 1 };
  if (p >= 0.7) return { ar: "جيد", en: "Good", stars: 1 };
  return { ar: "مقبول", en: "Pass", stars: 1 };
}

function star(ctx, x, y, r, points, inner, fill) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r;
    const a = (Math.PI / points) * i - Math.PI / 2;
    ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function text(ctx, s, x, y, font, color, align) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.fillText(s, x, y);
}
function fit(ctx, s, font, size, maxW) {
  let z = size;
  do { ctx.font = font.replace("{z}", z); if (ctx.measureText(s).width <= maxW) break; z -= 4; } while (z > 24);
  return font.replace("{z}", z);
}

const F_SIGN = '"Aref Ruqaa", "Noto Naskh Arabic", serif';
const CC = { navy: "#1f2266", gold: "#a8832e", goldSoft: "#e9dcb8", line: "#d9dbe9", stamp: "#2a4fb5", paper: "#fdfdfb" };
// إعدادات الشهادة من config.js (اسم الجهة، شعارها، اسم المدير...)
const CFG = () => (window.QAIDA_CONFIG || {}).certificate || {};
const imgCache = {};
function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (!imgCache[src]) imgCache[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  return imgCache[src];
}
function disc(ctx, x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.stroke(); } }
function hline(ctx, x1, x2, y, color, lw) { ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }
// خط زخرفي: خط ذهبي في طرفيه نقاط تصغر (أثر «النقطة المسافرة»)
function rule(ctx, cx, y, half) {
  hline(ctx, cx - half, cx + half, y, CC.gold, 2);
  [0, 1, 2].forEach(i => { const r = 5 - i * 1.4, d = half + 14 + i * 14; disc(ctx, cx - d, y, r, CC.gold); disc(ctx, cx + d, y, r, CC.gold); });
  disc(ctx, cx, y, 6, CC.paper, CC.gold, 2);
}

/* رقم الشهادة: ثابت لكل طالب في كل درس (لا يتغير من جهاز لآخر)، ويُقرأ بسهولة: RH-2026-04-K7Q3MD */
function serial(sid, lessonIndex, date) {
  if (!sid) return "RH-نموذج";
  const str = String(sid) + ":" + (lessonIndex + 1);
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
  for (let i = 0; i < 6; i++) code += A[((i < 3 ? h1 : h2) >>> ((i % 3) * 5 + 3)) & 31];
  const y = new Date(date || Date.now()).getFullYear();
  return `RH-${y}-${String(lessonIndex + 1).padStart(2, "0")}-${code}`;
}

// توقيع: الاسم بخط الرقعة (أو صورة توقيع) فوق خط، وتحته الصفة والاسم
function signature(ctx, x, name, role, img) {
  if (img) { const h = 64, w = Math.min(220, img.width * h / img.height); ctx.drawImage(img, x - w / 2, 868, w, h); }
  else text(ctx, name, x, 922, fit(ctx, name, `700 {z}px ${F_SIGN}`, 36, 220), CC.navy);
  hline(ctx, x - 115, x + 115, 944, C.soft, 1.5);
  text(ctx, role, x, 976, `700 21px ${F_TITLE}`, C.soft);
  if (img && name) text(ctx, name, x, 1004, `500 19px ${F_TITLE}`, C.soft);
}

async function render(o) {
  const cf = CFG();
  try {
    await Promise.all([
      // نص عربي مع كل طلب حتى يُحمَّل الجزء العربي من الخط
      ...[`700 60px "IBM Plex Sans Arabic"`, `500 60px "IBM Plex Sans Arabic"`, `700 80px "Noto Naskh Arabic"`, `700 40px "Aref Ruqaa"`]
        .map(f => document.fonts.load(f, "شهادة إتمام abc 123"))
    ]);
  } catch (e) {}
  const [mark, stampMark, orgLogo, signT, signD] = await Promise.all([
    loadImg("icons/rehla.svg"), loadImg("icons/mark-stamp.svg"), loadImg(cf.orgLogo), loadImg(cf.teacherSignature), loadImg(cf.directorSignature)]);
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.direction = "rtl";
  const X = W / 2;
  const no = o.serial || serial(o.sid, o.lessonIndex || 0, o.date);

  // الورق والإطار الرسمي: إطار نيلي عريض، وخطان ذهبيان رفيعان، ونقاط في الزوايا
  ctx.fillStyle = CC.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = CC.navy; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = CC.paper; ctx.fillRect(22, 22, W - 44, H - 44);
  ctx.strokeStyle = CC.gold; ctx.lineWidth = 3; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = CC.goldSoft; ctx.lineWidth = 1.5; ctx.strokeRect(50, 50, W - 100, H - 100);
  [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([x, y]) => { disc(ctx, x, y, 13, CC.paper, CC.gold, 3); disc(ctx, x, y, 5, CC.gold); });

  // أعلى: رقم الشهادة (يسار) وشعار الجهة إن وُجد (يمين) وشعار الموقع (وسط)
  ctx.direction = "ltr"; ctx.font = `500 20px ${F_TITLE}`;
  const nw = ctx.measureText("No. " + no).width;
  text(ctx, "No. " + no, 84, 104, `500 20px ${F_TITLE}`, C.soft, "left");
  ctx.direction = "rtl";
  text(ctx, "رقم الشهادة", 84 + nw / 2, 76, `700 18px ${F_TITLE}`, C.soft, "center");
  if (orgLogo) { const h = 96, w = Math.min(180, orgLogo.width * h / orgLogo.height); ctx.drawImage(orgLogo, W - 84 - w, 66, w, h); }
  if (mark) ctx.drawImage(mark, X - 38, 62, 76, 76);
  text(ctx, "رحلة الحروف", X, 168, `700 24px ${F_TITLE}`, CC.navy);

  text(ctx, "بسم الله الرحمن الرحيم", X, 214, `700 28px ${F_NAME}`, C.soft);
  if (cf.org) text(ctx, cf.org, X, 254, fit(ctx, cf.org, `700 {z}px ${F_TITLE}`, 28, 900), C.ink);

  text(ctx, "شهادة إتمام", X, 326, `700 84px ${F_NAME}`, CC.navy);
  ctx.save(); ctx.direction = "ltr"; if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
  text(ctx, "CERTIFICATE OF COMPLETION", X, 392, `700 20px ${F_TITLE}`, CC.gold); ctx.restore();
  rule(ctx, X, 416, 150);

  const intro = cf.intro || (cf.org ? `يشهد ${cf.org} بأنّ الطالب/ـة` : "تشهد «رحلة الحروف» بأنّ الطالب/ـة");
  text(ctx, intro, X, 472, fit(ctx, intro, `500 {z}px ${F_TITLE}`, 30, 1100), C.ink);
  text(ctx, o.name, X, 560, fit(ctx, o.name, `700 {z}px ${F_NAME}`, 86, 1000), CC.navy);
  hline(ctx, X - 330, X + 330, 590, CC.goldSoft, 2);
  if (o.group) text(ctx, "الحلقة: " + o.group, X, 626, `500 22px ${F_TITLE}`, C.soft);

  const ln = `الدرس ${ORD[o.lessonIndex] || ""}: ${o.lessonName}`;
  text(ctx, "قد أتمّ بنجاح", X, 676, `500 28px ${F_TITLE}`, C.ink);
  text(ctx, ln, X, 732, fit(ctx, ln, `700 {z}px ${F_NAME}`, 46, 1150), CC.navy);
  text(ctx, "من منهج «القاعدة الذهبية لتعليم تلاوة القرآن الكريم»", X, 774, `500 22px ${F_TITLE}`, C.soft);
  const g = grade(o.score, o.total);
  text(ctx, `بتقدير «${g.ar}» (${o.score} من ${o.total})`, X, 820, `700 30px ${F_TITLE}`, C.ink);

  // الصف السفلي: التاريخ يميناً، ثم التوقيعات إن وُجدت، والختم يساراً
  const d = o.date ? new Date(o.date) : new Date();
  let greg = "", hij = "";
  try { greg = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(d); } catch (e) { greg = d.toLocaleDateString(); }
  try { hij = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(d); } catch (e) {}
  text(ctx, "تحريراً في", 1300, 890, `700 21px ${F_TITLE}`, C.soft);
  text(ctx, greg, 1300, 928, `700 26px ${F_TITLE}`, C.ink);
  if (hij) text(ctx, hij, 1300, 962, `500 21px ${F_TITLE}`, C.soft);

  const sigs = [];
  if (o.teacher || signT) sigs.push([o.teacher || "", "معلم الحلقة", signT]);
  if (cf.director || signD) sigs.push([cf.director || "", cf.directorTitle || "المدير", signD]);
  const slots = sigs.length === 2 ? [980, 640] : [800];
  sigs.forEach((s, i) => signature(ctx, slots[i], s[0], s[1], s[2]));

  // الختم الرسمي: حلقتان، وحلقة نقاط، وفي الوسط الاسم ورمز الباء
  const sx = 300, sy = 930, R = 104;
  ctx.save();
  ctx.translate(sx, sy); ctx.rotate(-0.1); ctx.globalAlpha = 0.9;
  disc(ctx, 0, 0, R, null, CC.stamp, 5); disc(ctx, 0, 0, R - 12, null, CC.stamp, 2);
  for (let i = 0; i < 40; i++) { const a = (Math.PI * 2 / 40) * i; disc(ctx, Math.cos(a) * (R - 22), Math.sin(a) * (R - 22), 1.7, CC.stamp); }
  text(ctx, "رحلة الحروف", 0, -40, `700 21px ${F_TITLE}`, CC.stamp);
  hline(ctx, -52, 52, -30, CC.stamp, 1.5);
  if (stampMark) ctx.drawImage(stampMark, -30, -28, 60, 60);
  hline(ctx, -52, 52, 36, CC.stamp, 1.5);
  ctx.direction = "ltr"; text(ctx, "LETTERS JOURNEY", 0, 56, `700 12px ${F_TITLE}`, CC.stamp);
  ctx.restore();
  text(ctx, "الختم", sx, sy + R + 34, `700 20px ${F_TITLE}`, C.soft);

  text(ctx, "من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh", X, 1062, `500 17px ${F_TITLE}`, C.soft);
  return cv;
}

// يُنشأ الرابط مباشرة داخل ضغطة الزر حتى يحتفظ المتصفح باسم الملف
function download(canvas, filename) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = (filename || "certificate.png").replace(/[\\/:*?"<>|]/g, "-");
  document.body.appendChild(a); a.click(); a.remove();
}

// طباعة الشهادة وحدها في صفحة أفقية
function print(canvas) {
  const url = canvas.toDataURL("image/png");
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const doc = f.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><title>شهادة</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;height:100%}img{width:100%;height:100%;object-fit:contain;display:block}</style></head><body><img src="${url}"></body></html>`);
  doc.close();
  let done = false;
  const go = () => { if (done) return; done = true; try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 3000); };
  f.contentWindow.onload = go;
  setTimeout(go, 800);
}

window.Certificate = { render, download, print, grade, serial };
})();
