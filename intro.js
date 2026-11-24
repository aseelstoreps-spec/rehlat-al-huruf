/* قصة البداية «النقطة المسافرة» — مشهد متحرك بالكود (بلا فيديو) مع راوٍ وزر تخطٍّ
   صوت الراوي (اختياري): audio/intro/1.mp3 … 5.mp3 — إن لم توجد الملفات تعمل القصة بالنص والمؤثرات
   من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
(function () {
"use strict";
// نص الراوي لكل مشهد (يظهر أيضاً مكتوباً أسفل الشاشة)
const LINES = [
  "في سماءٍ بعيدة، فوق جزيرةٍ صغيرة، كانت تنامُ نقطةٌ صفراء… حتى استيقظت ذاتَ ليلة!",
  "وفجأةً… تساقطت من السماء حروفٌ ملوّنة، وتفرّقت على الجزر البعيدة.",
  "قالت النقطة: سأجمعُها كلَّها! وقفزت من جزيرةٍ إلى جزيرة، وكلّما وصلَت إلى حرفٍ أضاء ونطق اسمه.",
  "اجتمعت الحروفُ فصارت كلمة: «اقرأ». وبالحروف… نقرأ كلامَ الله.",
  "والآن جاء دورُك! هيا نبدأ رحلةَ الحروف."
];
// الحروف الأربعة التي تجمعها النقطة (تكوّن «اقرأ»)، وأماكن جزرها في المسرح (٪)
const LETTERS = [
  { c: "ا", id: "alif", color: "#e0457b", x: 76, y: 61 },
  { c: "ق", id: "qaf", color: "#2a5fd0", x: 25, y: 50 },
  { c: "ر", id: "ra", color: "#17a067", x: 73, y: 38 },
  { c: "أ", id: "hamza", color: "#f08a00", x: 28, y: 27 }
];
const HOME = { x: 50, y: 80 };
const EXTRA = "بتثجحخدذزسشصضطظعغفكلمنهوي";

const css = `
#rintro { position: fixed; inset: 0; z-index: 100; overflow: hidden; font-family: var(--f-ui, sans-serif); color: #fff; user-select: none; -webkit-user-select: none; }
#rintro .ri-sky { position: absolute; inset: 0; transition: opacity 2.4s ease; }
#rintro .ri-night { background: linear-gradient(#0c0f38, #23266b 55%, #3d3f8f); }
#rintro .ri-dawn { background: linear-gradient(#ffb36b, #ffd9a0 40%, #fff1d8); opacity: 0; }
#rintro .ri-morning { background: linear-gradient(#c9d3ff, #eef0ff 55%, #fff4d6); opacity: 0; }
#rintro .ri-sun { position: absolute; left: 50%; top: 105%; width: 220px; height: 220px; margin-left: -110px; border-radius: 50%; background: radial-gradient(#fff6c2, #ffd23f 55%, #ffd23f00 72%); transition: top 3s ease; }
#rintro .ri-moon { position: absolute; right: 14%; top: 9%; width: 54px; height: 54px; border-radius: 50%; box-shadow: -12px 6px 0 0 #fff4c4; transform: rotate(-20deg); transition: opacity 1.6s; }
#rintro .ri-star { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #fff; animation: rtw 2.4s infinite ease-in-out; transition: opacity 2s; }
@keyframes rtw { 50% { opacity: .25; transform: scale(.6); } }
#rintro .ri-cloud { position: absolute; width: 130px; height: 40px; border-radius: 40px; background: #fff; opacity: .13; animation: rdrift 26s linear infinite; }
#rintro .ri-cloud::before, #rintro .ri-cloud::after { content: ""; position: absolute; background: inherit; border-radius: 50%; }
#rintro .ri-cloud::before { width: 60px; height: 50px; left: 18px; top: -24px; } #rintro .ri-cloud::after { width: 46px; height: 40px; left: 62px; top: -16px; }
#rintro.ri-day .ri-cloud { opacity: .8; }
@keyframes rdrift { from { transform: translateX(-30vw); } to { transform: translateX(130vw); } }
#rintro .ri-stage { position: absolute; top: 0; bottom: 0; left: 50%; width: min(100vw, 560px); transform: translateX(-50%); }
#rintro .ri-isl { position: absolute; width: 130px; margin: -32px 0 0 -65px; transition: opacity 1.2s, transform 1.2s; }
#rintro .ri-isl.ri-home { width: 170px; margin: -42px 0 0 -85px; }
#rintro .ri-isl svg { display: block; width: 100%; height: auto; overflow: visible; }
#rintro .ri-ltr { position: absolute; width: 64px; height: 64px; margin: -70px 0 0 -32px; display: grid; place-items: center; font-family: var(--f-letter, serif); font-size: 46px; font-weight: 700; line-height: 1; border-radius: 50%; opacity: 0; text-shadow: 0 2px 0 #0003; transition: transform .4s, box-shadow .4s, background .4s; }
#rintro .ri-ltr.ri-lit { background: #fff; box-shadow: 0 0 0 6px #ffd23f, 0 0 40px 14px #ffd23f; transform: scale(1.18); text-shadow: none; }
#rintro .ri-fall { position: absolute; top: -60px; font-family: var(--f-letter, serif); font-size: 30px; font-weight: 700; opacity: .7; pointer-events: none; }
#rintro .ri-dot { position: absolute; width: 44px; height: 44px; margin: -44px 0 0 -22px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff3a6, #ffd23f 45%, #f2b800); box-shadow: 0 4px 0 #c79600, 0 0 26px 6px #ffd23f88; z-index: 5; }
#rintro .ri-dot .ri-eye { position: absolute; top: 15px; width: 6px; height: 8px; border-radius: 4px; background: #1b1d45; transition: height .2s, top .2s, transform .35s; }
#rintro .ri-dot .ri-eye.ri-l { left: 12px; } #rintro .ri-dot .ri-eye.ri-r { right: 12px; }
#rintro .ri-dot.ri-sleep .ri-eye { height: 2px; top: 19px; }
#rintro .ri-dot .ri-cheek { position: absolute; top: 25px; width: 7px; height: 4px; border-radius: 50%; background: #ff8a8a; opacity: .7; }
#rintro .ri-dot .ri-cheek.ri-l { left: 6px; } #rintro .ri-dot .ri-cheek.ri-r { right: 6px; }
#rintro .ri-dot.ri-sleep { animation: rbreath 2s infinite ease-in-out; }
@keyframes rbreath { 50% { transform: scale(1.06, .94); } }
#rintro .ri-zz { position: absolute; left: 30px; top: -24px; font-weight: 800; color: #c9d3ff; animation: rzz 2s infinite; }
@keyframes rzz { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(14px, -22px); opacity: 0; } }
#rintro .ri-dot.ri-happy { animation: rhappy .6s infinite ease-in-out; }
@keyframes rhappy { 50% { transform: translateY(-14px); } }
#rintro .ri-word { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%) scale(.6); font-family: var(--f-letter, serif); font-weight: 700; font-size: clamp(64px, 20vw, 110px); color: #fff; opacity: 0; transition: opacity 1s, transform 1s; text-shadow: 0 0 30px #ffd23f, 0 4px 0 #0004; white-space: nowrap; }
#rintro .ri-word.ri-on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
#rintro .ri-ayah { position: absolute; left: 50%; top: 13%; transform: translateX(-50%); width: 92%; text-align: center; font-family: var(--f-letter, serif); font-weight: 700; font-size: clamp(24px, 6.4vw, 38px); color: #fff6c2; opacity: 0; transition: opacity 2s; text-shadow: 0 0 22px #ffd23f; }
#rintro .ri-ayah.ri-on { opacity: 1; }
#rintro .ri-rays { position: absolute; left: 50%; top: 16%; width: 520px; height: 520px; margin: -260px 0 0 -260px; background: repeating-conic-gradient(#ffd23f22 0 8deg, transparent 8deg 20deg); border-radius: 50%; opacity: 0; transition: opacity 2s; animation: rspin 40s linear infinite; mask: radial-gradient(#000 20%, transparent 70%); -webkit-mask: radial-gradient(#000 20%, transparent 70%); }
#rintro .ri-rays.ri-on { opacity: 1; }
@keyframes rspin { to { transform: rotate(360deg); } }
#rintro .ri-final { position: absolute; left: 0; right: 0; top: 16%; display: flex; flex-direction: column; align-items: center; gap: 14px; opacity: 0; transform: translateY(20px); transition: opacity 1s, transform 1s; pointer-events: none; text-align: center; padding: 0 16px; }
#rintro .ri-final.ri-on { opacity: 1; transform: none; pointer-events: auto; }
#rintro .ri-final img { width: min(70vw, 300px); height: auto; }
#rintro .ri-final h2 { margin: 0; font-family: var(--f-title, sans-serif); font-weight: 400; font-size: clamp(28px, 8vw, 42px); color: #23266b; }
#rintro .ri-btn-go, #rintro .ri-btn-play { border: 0; border-radius: 22px; background: #23266b; color: #fff; font: inherit; font-weight: 800; font-size: 1.35rem; padding: 14px 30px; box-shadow: 0 6px 0 #15174a; cursor: pointer; }
#rintro .ri-btn-go { background: #ffd23f; color: #1b1d45; box-shadow: 0 6px 0 #d9a800; }
#rintro .ri-gate { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; background: #0c0f3888; z-index: 8; text-align: center; padding: 16px; transition: opacity .5s; }
#rintro .ri-gate h2 { margin: 0; font-family: var(--f-title, sans-serif); font-weight: 400; font-size: clamp(30px, 9vw, 46px); color: #ffd23f; }
#rintro .ri-gate p { margin: 0; color: #dfe3ff; }
#rintro .ri-btn-play { background: #ffd23f; color: #1b1d45; box-shadow: 0 6px 0 #d9a800; font-size: 1.5rem; }
#rintro .ri-skip { position: absolute; top: max(14px, env(safe-area-inset-top, 0px)); left: max(14px, env(safe-area-inset-left, 0px)); z-index: 10; border: 0; border-radius: 99px; padding: 9px 18px; font: inherit; font-weight: 800; background: #ffffffd9; color: #1b1d45; cursor: pointer; box-shadow: 0 3px 0 #0002; }
#rintro .ri-cap { position: absolute; left: 50%; bottom: max(22px, env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(92vw, 560px); background: #0c0f38b3; color: #fff; border-radius: 18px; padding: 12px 16px; font-size: clamp(16px, 4.4vw, 20px); line-height: 1.7; text-align: center; opacity: 0; transition: opacity .5s; z-index: 9; font-weight: 500; }
#rintro .ri-cap.ri-on { opacity: 1; }
#rintro.ri-day .ri-cap { background: #23266bd9; }
#rintro.ri-fade { opacity: 0; transition: opacity .6s; }
@media (prefers-reduced-motion: reduce) { #rintro .ri-cloud, #rintro .ri-rays, #rintro .ri-star { animation: none; } }
`;

const GRASS = [["#7cc7a2", "#93d6b4", "#4fae86"], ["#f0c76a", "#f6d98f", "#d19b3a"], ["#a9b6f3", "#c1cbf8", "#6f7fd6"], ["#f2a7b9", "#f7c3cf", "#d9748e"], ["#8fd3d8", "#aee2e6", "#3fa6ae"]];
function islandSvg(z) {
  const [g1, g2, tr] = GRASS[z % GRASS.length];
  return `<svg viewBox="-80 -40 160 140" aria-hidden="true">
    <path d="M-72,0 Q-62,40 -26,62 Q0,94 22,64 Q56,40 72,0 Z" fill="#9b7653"/>
    <path d="M-30,60 L-12,98 L2,68 Z" fill="#8a6646"/><path d="M10,66 L24,88 L30,58 Z" fill="#8a6646"/>
    <ellipse cx="0" cy="0" rx="76" ry="21" fill="${g1}"/><ellipse cx="0" cy="-3" rx="68" ry="15" fill="${g2}"/>
    <rect x="-48" y="-12" width="4" height="12" fill="#7d5c3f"/><circle cx="-46" cy="-18" r="9" fill="${tr}"/>
    <rect x="46" y="-13" width="4" height="12" fill="#7d5c3f"/><circle cx="48" cy="-19" r="8" fill="${tr}"/></svg>`;
}

let el = null, alive = false, opts = {}, voice = null;
const STOP = {};
const $ = (s) => el.querySelector(s);
const wait = (ms) => new Promise((res, rej) => setTimeout(() => alive ? res() : rej(STOP), ms));
const check = () => { if (!alive) throw STOP; };
const sfx = (k) => { try { opts.sfx && opts.sfx(k); } catch (e) {} };
function audio(src) {
  return new Promise(res => {
    if (!alive) return res(false);
    const a = new Audio(src); voice = a;
    let done = false; const end = (ok) => { if (!done) { done = true; res(ok); } };
    a.onended = () => end(true); a.onerror = () => end(false);
    a.play().catch(() => end(false));
  });
}
function caption(i) {
  const c = $(".ri-cap"); c.classList.remove("ri-on");
  setTimeout(() => { if (!alive) return; c.textContent = LINES[i]; c.classList.add("ri-on"); }, 250);
}
// يعرض النص ويشغّل صوت الراوي؛ يعيد وعداً ينتهي بانتهاء الصوت (أو مباشرة إن لم يوجد ملف)
function narrate(i) { caption(i); return audio(`audio/intro/${i + 1}.mp3`); }
// المدة تكفي لقراءة النص إن لم يوجد صوت راوٍ
const readMs = (i) => 1800 + LINES[i].length * 55;

function px(p) { const r = $(".ri-stage").getBoundingClientRect(); return [r.width * p.x / 100, r.height * p.y / 100]; }
function place(node, p) { node.style.left = p.x + "%"; node.style.top = p.y + "%"; }
// قفزة النقطة على قوس من p إلى q
function hop(p, q, ms) {
  const d = $(".ri-dot"), [x0, y0] = px(p), [x1, y1] = px(q), cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 90;
  sfx("hop");
  const frames = Array.from({ length: 15 }, (_, i) => { const t = i / 14, u = 1 - t;
    return { transform: `translate(${u * u * x0 + 2 * u * t * cx + t * t * x1 - x0}px, ${u * u * y0 + 2 * u * t * cy + t * t * y1 - y0}px) scale(${1 + Math.sin(t * Math.PI) * .25})` }; });
  // مؤقّت احتياطي: إن توقّفت الحركة (التطبيق في الخلفية) لا تتجمّد القصة
  return new Promise(res => { const an = d.animate(frames, { duration: ms || 900, easing: "ease-in-out" });
    let done = false; const end = () => { if (done) return; done = true; try { an.cancel(); } catch (e) {} place(d, q); res(); };
    an.onfinish = end; setTimeout(end, (ms || 900) + 400); });
}

async function run() {
  // المشهد 1: الليل، النقطة نائمة ثم تستيقظ وتتلفّت
  const dot = $(".ri-dot");
  let v = narrate(0);
  await wait(2200);
  dot.classList.remove("ri-sleep"); $(".ri-zz").remove(); sfx("pop");
  const eyes = el.querySelectorAll(".ri-eye");
  await wait(700); eyes.forEach(e => e.style.transform = "translateX(-4px)");
  await wait(700); eyes.forEach(e => e.style.transform = "translateX(4px)");
  await wait(700); eyes.forEach(e => e.style.transform = "");
  await Promise.all([v, wait(Math.max(0, readMs(0) - 4300))]); check();

  // المشهد 2: تتساقط الحروف وتستقر على الجزر البعيدة
  v = narrate(1);
  const stage = $(".ri-stage");
  for (let k = 0; k < 14; k++) {
    const f = document.createElement("span"); f.className = "ri-fall"; f.textContent = EXTRA[(k * 7) % EXTRA.length];
    f.style.left = (5 + Math.random() * 90) + "%"; f.style.color = ["#ffd23f", "#ff9fc0", "#9fd8ff", "#a6f0c6"][k % 4];
    stage.appendChild(f);
    f.animate([{ transform: "translateY(0) rotate(0)", opacity: .8 }, { transform: `translateY(${innerHeight + 120}px) rotate(${Math.random() * 360}deg)`, opacity: .2 }],
      { duration: 2600 + Math.random() * 1600, delay: k * 140, easing: "ease-in", fill: "forwards" });
  }
  el.querySelectorAll(".ri-isl.ri-far").forEach((n, i) => setTimeout(() => { n.style.opacity = 1; n.style.transform = "none"; }, i * 250));
  el.querySelectorAll(".ri-ltr").forEach((n, i) => {
    const [, y] = px(LETTERS[i]);
    n.animate([{ transform: `translateY(${-y - 80}px) rotate(-30deg)`, opacity: 1 }, { transform: "translateY(12px) rotate(8deg)", opacity: 1, offset: .85 }, { transform: "none", opacity: 1 }],
      { duration: 1400, delay: 500 + i * 420, easing: "ease-in", fill: "forwards" }).onfinish = () => sfx("step");
  });
  await Promise.all([v, wait(Math.max(4200, readMs(1)))]); check();

  // المشهد 3: النقطة تقفز من جزيرة إلى جزيرة، وكل حرف يضيء وينطق اسمه
  v = narrate(2);
  dot.classList.add("ri-happy");   // تقفز فرحاً في مكانها أثناء الكلام
  await Promise.all([v, wait(readMs(2) * .6)]); check();
  dot.classList.remove("ri-happy");
  let from = HOME;
  for (let i = 0; i < LETTERS.length; i++) {
    await hop(from, LETTERS[i]); check(); from = LETTERS[i];
    const n = el.querySelectorAll(".ri-ltr")[i]; n.classList.add("ri-lit"); sfx("enter");
    await Promise.all([audio(`audio/letters/${LETTERS[i].id}.mp3`), wait(700)]); check();
    n.classList.remove("ri-lit"); n.style.background = "#fff"; n.style.boxShadow = "0 0 0 4px #ffd23f";
    await wait(250);
  }

  // المشهد 4: تجتمع الحروف فتصير «اقرأ»، ثم تضيء البسملة في الأفق
  v = narrate(3);
  const ltrs = [...el.querySelectorAll(".ri-ltr")];
  const [cx, cy] = px({ x: 50, y: 44 });
  ltrs.forEach((n, i) => { const r = n.getBoundingClientRect(), s = stage.getBoundingClientRect(), dx = cx - (r.left - s.left + 32) + (1.5 - i) * 60, dy = cy - (r.top - s.top + 32);
    n.animate([{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(1.3)` }], { duration: 1100, delay: i * 120, easing: "ease-in-out", fill: "forwards" }); });
  await wait(1500); check();
  ltrs.forEach(n => { n.style.transition = "opacity .5s"; n.style.opacity = 0; });
  $(".ri-word").classList.add("ri-on"); sfx("win");
  el.querySelectorAll(".ri-isl.ri-far").forEach(n => { n.style.opacity = .35; n.style.transform = "translateY(30px)"; });
  await wait(1600); check();
  $(".ri-rays").classList.add("ri-on"); $(".ri-ayah").classList.add("ri-on");
  $(".ri-night").style.opacity = 0; $(".ri-dawn").style.opacity = 1; $(".ri-sun").style.top = "62%";
  el.querySelectorAll(".ri-star, .ri-moon").forEach(s => s.style.opacity = 0);
  await Promise.all([v, wait(Math.max(3200, readMs(3) - 3100))]); check();

  // المشهد 5: الصباح، والدعوة إلى بدء الرحلة
  v = narrate(4);
  el.classList.add("ri-day");
  $(".ri-word").classList.remove("ri-on"); $(".ri-ayah").classList.remove("ri-on"); $(".ri-rays").classList.remove("ri-on");
  $(".ri-dawn").style.opacity = 0; $(".ri-morning").style.opacity = 1; $(".ri-sun").style.top = "6%";
  await hop(from, HOME, 1100); check();
  dot.classList.add("ri-happy");
  $(".ri-final").classList.add("ri-on");
  $(".ri-skip").hidden = true;
  await v;
}

function close() {
  if (!el) return;
  alive = false;
  try { voice && voice.pause(); } catch (e) {}
  const node = el; el = null;
  node.classList.add("ri-fade");
  setTimeout(() => node.remove(), 600);
  document.body.classList.remove("intro-on");
  try { opts.onDone && opts.onDone(); } catch (e) {}
}

function show(o) {
  if (el) return;
  opts = o || {};
  if (!document.getElementById("rintro-css")) { const s = document.createElement("style"); s.id = "rintro-css"; s.textContent = css; document.head.appendChild(s); }
  el = document.createElement("div"); el.id = "rintro"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "قصة رحلة الحروف");
  const stars = Array.from({ length: 46 }, (_, i) => `<i class="ri-star" style="left:${(i * 37) % 100}%;top:${(i * 53) % 58}%;animation-delay:${(i % 7) * .35}s;${i % 5 ? "" : "width:4px;height:4px;"}"></i>`).join("");
  el.innerHTML = `<div class="ri-sky ri-night"></div><div class="ri-sky ri-dawn"></div><div class="ri-sky ri-morning"></div><div class="ri-sun"></div>
    ${stars}<div class="ri-moon"></div>
    <div class="ri-cloud" style="top:20%;animation-delay:-4s"></div><div class="ri-cloud" style="top:52%;animation-delay:-15s;animation-duration:34s"></div>
    <div class="ri-rays"></div><div class="ri-ayah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
    <div class="ri-stage">
      ${LETTERS.map((L, i) => `<div class="ri-isl ri-far" style="left:${L.x}%;top:${L.y}%;opacity:0;transform:translateY(40px)">${islandSvg(i + 1)}</div>`).join("")}
      <div class="ri-isl ri-home" style="left:${HOME.x}%;top:${HOME.y}%">${islandSvg(0)}</div>
      ${LETTERS.map(L => `<span class="ri-ltr" style="left:${L.x}%;top:${L.y}%;color:${L.color}">${L.c}</span>`).join("")}
      <div class="ri-dot ri-sleep" style="left:${HOME.x}%;top:${HOME.y}%"><i class="ri-eye ri-l"></i><i class="ri-eye ri-r"></i><i class="ri-cheek ri-l"></i><i class="ri-cheek ri-r"></i><span class="ri-zz">z</span></div>
      <div class="ri-word">اقْرَأْ</div>
    </div>
    <div class="ri-final"><img src="icons/wordmark-light.svg" alt="رحلة الحروف"><h2>هيا نبدأ رحلة الحروف!</h2><button class="ri-btn-go" type="button">ابدأ الرحلة ⬅</button></div>
    <div class="ri-cap" aria-live="polite"></div>
    <div class="ri-gate"><h2>قصة النقطة المسافرة</h2><p>${opts.name ? "يا " + String(opts.name).replace(/[<>&"]/g, "") + "، " : ""}شاهد قصة قصيرة قبل أن تبدأ رحلتك</p>
      <button class="ri-btn-play" type="button">▶ شاهد القصة</button></div>
    <button class="ri-skip" type="button">تخطٍّ ⏭</button>`;
  document.body.appendChild(el);
  document.body.classList.add("intro-on");
  alive = true;
  $(".ri-skip").onclick = close;
  $(".ri-btn-go").onclick = () => { sfx("enter"); close(); };
  $(".ri-btn-play").onclick = () => {
    sfx("pop");
    const g = $(".ri-gate"); g.style.opacity = 0; setTimeout(() => g.remove(), 500);
    run().catch(e => { if (e !== STOP) { console.error(e); close(); } });
  };
  setTimeout(() => { const b = el && $(".ri-btn-play"); if (b) b.focus(); }, 50);
}

window.RehlaIntro = { show, close, LINES, get open() { return !!el; } };
})();
