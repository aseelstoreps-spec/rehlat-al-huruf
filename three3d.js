/* مجسّمات «رحلة الحروف» ثلاثية الأبعاد بالكود (three.js r149، MIT — vendor/three.min.js، يُحمَّل عند الحاجة فقط)
   Rehla3D.trophy(host) ← كأس ذهبي يدور ويلمع · Rehla3D.bird(host, { mood: "idle" | "cheer" | "sad" }) ← الطائر المرافق
   يعملان دون إنترنت. إن لم يدعم الجهاز WebGL يبقى محتوى host كما هو (أيقونة بديلة).
   من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
(function () {
"use strict";
let threeP = null;
function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return threeP = threeP || new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "vendor/three.min.js";
    s.onload = () => res(window.THREE); s.onerror = rej; document.head.appendChild(s);
  });
}
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// بيئة انعكاس مرسومة (سماء دافئة وأشرطة ضوء) تعطي المعدن لمعته دون ملفات خارجية
function envTexture(T, renderer) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#fffdf0"); gr.addColorStop(.45, "#ffe9a8"); gr.addColorStop(.55, "#8a6a1a"); gr.addColorStop(1, "#2b2a55");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#ffffff"; g.fillRect(30, 20, 30, 40); g.fillRect(150, 26, 60, 18); g.fillRect(100, 70, 18, 10);
  const tex = new T.CanvasTexture(c); tex.mapping = T.EquirectangularReflectionMapping;
  const pm = new T.PMREMGenerator(renderer), env = pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose();
  return env;
}

function stage(T, host, size, camZ) {
  const canvas = document.createElement("canvas");
  canvas.className = "r3d"; canvas.style.width = canvas.style.height = size + "px";
  if (T.ColorManagement) T.ColorManagement.legacyMode = false; // الألوان بقيمها الحقيقية (لا باهتة)
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(size, size, false);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 100);
  cam.position.set(0, .4, camZ); cam.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0x8a7a55, .55));
  const key = new T.DirectionalLight(0xffffff, 1.6); key.position.set(2.5, 4, 3); scene.add(key);
  const rim = new T.DirectionalLight(0xbfd4ff, .8); rim.position.set(-3, 1.5, -2); scene.add(rim);
  host.innerHTML = ""; host.appendChild(canvas);
  return { renderer, scene, cam, canvas };
}
// حلقة رسم تتوقف وحدها حين تُزال اللوحة من الصفحة
function loop(st, tick) {
  const t0 = performance.now();
  const f = (now) => {
    if (!st.canvas.isConnected) { st.renderer.dispose(); try { st.renderer.forceContextLoss(); } catch (e) {} return; }
    tick((now - t0) / 1000); st.renderer.render(st.scene, st.cam);
    if (!calm()) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

/* ---------- الكأس ---------- */
async function trophy(host, opts) {
  opts = opts || {};
  let T; try { T = await loadThree(); } catch (e) { return; }
  const st = stage(T, host, opts.size || 140, 6.2); if (!st) return;
  const env = envTexture(T, st.renderer);
  const gold = new T.MeshStandardMaterial({ color: 0xffc928, metalness: 1, roughness: .22, envMap: env, envMapIntensity: 1.4 });
  const indigo = new T.MeshStandardMaterial({ color: 0x2c3080, metalness: .2, roughness: .35, envMap: env, envMapIntensity: .6 });
  const shine = new T.MeshStandardMaterial({ color: 0xfff1a0, metalness: .6, roughness: .15, envMap: env, emissive: 0x6b4a00, emissiveIntensity: .25 });
  const g = new T.Group();
  // الكأس: مقطع جانبي يدور حول المحور
  const prof = [[0, 0], [.32, .02], [.62, .14], [.82, .42], [.9, .78], [.92, 1.12], [.98, 1.18], [.9, 1.2], [.84, 1.1], [.7, .55], [.4, .24], [0, .2]].map(p => new T.Vector2(p[0], p[1]));
  const cup = new T.Mesh(new T.LatheGeometry(prof, 64), gold); cup.position.y = .1; g.add(cup);
  // الساق والقاعدة
  const stem = new T.Mesh(new T.CylinderGeometry(.13, .2, .45, 32), gold); stem.position.y = -.12; g.add(stem);
  const knot = new T.Mesh(new T.SphereGeometry(.2, 32, 16), gold); knot.scale.y = .6; knot.position.y = -.05; g.add(knot);
  const plate = new T.Mesh(new T.CylinderGeometry(.5, .56, .1, 48), gold); plate.position.y = -.38; g.add(plate);
  const base = new T.Mesh(new T.BoxGeometry(1.2, .42, .9, 1, 1, 1), indigo); base.position.y = -.65; g.add(base);
  const band = new T.Mesh(new T.BoxGeometry(1.24, .08, .94), gold); band.position.y = -.5; g.add(band);
  // المقبضان
  [-1, 1].forEach(s => {
    const h = new T.Mesh(new T.TorusGeometry(.26, .07, 16, 40, Math.PI), gold);
    h.position.set(s * .86, .78, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(h);
  });
  // نجمة بارزة على الواجهة
  const sh = new T.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? .13 : .3, a = Math.PI / 2 + i * Math.PI / 5; sh[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
  const star = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: true, bevelThickness: .04, bevelSize: .03, bevelSegments: 3 }), shine);
  star.position.set(0, .8, .93); star.scale.setScalar(1.25); star.rotation.x = -.12; g.add(star);
  // بريق: نجوم صغيرة تومض حول الكأس
  const sparks = [];
  const spMat = new T.SpriteMaterial({ map: sparkTex(T), color: 0xffffff, transparent: true, depthWrite: false });
  for (let i = 0; i < 6; i++) { const s = new T.Sprite(spMat.clone()); s.scale.setScalar(.35); st.scene.add(s); sparks.push({ s, a: i / 6 * Math.PI * 2, y: -.2 + Math.random() * 1.4, p: Math.random() * 6 }); }
  g.position.y = -.15; st.scene.add(g);
  loop(st, (t) => {
    g.rotation.y = calm() ? .5 : t * .9; g.position.y = -.15 + Math.sin(t * 2) * .05;
    sparks.forEach(k => { const a = k.a + t * .5; k.s.position.set(Math.cos(a) * 1.35, k.y + .1, Math.sin(a) * 1.35);
      k.s.material.opacity = Math.max(0, Math.sin(t * 2.4 + k.p)); });
  });
}
function sparkTex(T) {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, "#fff"); r.addColorStop(.25, "#fff6b0"); r.addColorStop(1, "#fff0");
  g.fillStyle = r; g.beginPath(); g.moveTo(32, 0); g.quadraticCurveTo(36, 28, 64, 32); g.quadraticCurveTo(36, 36, 32, 64); g.quadraticCurveTo(28, 36, 0, 32); g.quadraticCurveTo(28, 28, 32, 0); g.fill();
  return new T.CanvasTexture(c);
}

/* ---------- الطائر المرافق ---------- */
async function bird(host, opts) {
  opts = opts || {};
  let T; try { T = await loadThree(); } catch (e) { return; }
  const st = stage(T, host, opts.size || 110, 5.4); if (!st) return;
  const env = envTexture(T, st.renderer);
  const M = (c, r) => new T.MeshStandardMaterial({ color: c, roughness: r == null ? .45 : r, metalness: 0, envMap: env, envMapIntensity: .35 });
  const blue = M(0x3d5bd9), belly = M(0xffd23f, .5), orange = M(0xff8a1f, .4), white = M(0xffffff, .2), ink = M(0x15174a, .1), pink = M(0xff8fa3, .6);
  const b = new T.Group();
  const body = new T.Mesh(new T.SphereGeometry(.85, 48, 32), blue); body.scale.set(1, 1.05, .95); b.add(body);
  const tummy = new T.Mesh(new T.SphereGeometry(.5, 40, 24), belly); tummy.scale.set(1, 1, .5); tummy.position.set(0, -.36, .6); b.add(tummy);
  const head = new T.Group(); head.position.y = .2; b.add(head);
  [-1, 1].forEach(s => {
    const eye = new T.Mesh(new T.SphereGeometry(.2, 24, 16), white); eye.scale.z = .6; eye.position.set(s * .28, .28, .72); head.add(eye);
    const pupil = new T.Mesh(new T.SphereGeometry(.11, 20, 12), ink); pupil.position.set(s * .27, .27, .85); head.add(pupil);
    const glint = new T.Mesh(new T.SphereGeometry(.035, 10, 8), white); glint.position.set(s * .27 + .04, .32, .95); head.add(glint);
    const cheek = new T.Mesh(new T.SphereGeometry(.1, 16, 10), pink); cheek.scale.set(1, .6, .4); cheek.position.set(s * .5, .02, .66); head.add(cheek);
  });
  const beak = new T.Mesh(new T.ConeGeometry(.13, .3, 24), orange); beak.rotation.x = Math.PI / 2; beak.position.set(0, .08, .92); head.add(beak);
  // خصلة على الرأس
  [[-.08, .2], [.08, -.2], [0, 0]].forEach(([x, rz]) => { const f = new T.Mesh(new T.SphereGeometry(.12, 16, 10), blue); f.scale.set(.6, 1.6, .6); f.position.set(x, .95, 0); f.rotation.z = rz; head.add(f); });
  // الجناحان
  const wings = [-1, 1].map(s => {
    const pivot = new T.Group(); pivot.position.set(s * .78, .05, 0); b.add(pivot);
    const w = new T.Mesh(new T.SphereGeometry(.42, 32, 16), M(0x2f47b8)); w.scale.set(.35, .8, .6); w.position.set(s * .12, -.2, 0); pivot.add(w);
    return { pivot, s };
  });
  const tail = new T.Mesh(new T.ConeGeometry(.22, .5, 20), M(0x2f47b8)); tail.position.set(0, -.45, -.8); tail.rotation.x = -2.2; b.add(tail);
  [-1, 1].forEach(s => { const leg = new T.Mesh(new T.CylinderGeometry(.04, .04, .25, 8), orange); leg.position.set(s * .25, -.95, .1); b.add(leg);
    const foot = new T.Mesh(new T.SphereGeometry(.1, 12, 8), orange); foot.scale.set(1.2, .4, 1.6); foot.position.set(s * .25, -1.07, .2); b.add(foot); });
  b.position.y = .1; st.scene.add(b);
  const api = { mood: opts.mood || "idle", t: 0, cheerAt: -9 };
  api.cheer = () => { api.cheerAt = api.t; };
  loop(st, (t) => {
    api.t = t;
    const since = t - api.cheerAt, cheering = api.mood === "cheer" || since < 1.6;
    const flap = cheering ? Math.sin(t * 22) * .9 : Math.max(0, Math.sin(t * 3)) ** 8 * .7;
    wings.forEach(w => { w.pivot.rotation.z = w.s * (.2 + flap); });
    if (cheering) { b.position.y = .1 + Math.abs(Math.sin(t * 6)) * .45; b.rotation.y = since < 1.6 ? since * Math.PI * 1.25 : Math.sin(t * 2) * .35; }
    else if (api.mood === "sad") { b.position.y = Math.sin(t * 1.5) * .03; b.rotation.y = .25; head.rotation.z = .22 + Math.sin(t * 1.2) * .05; head.rotation.x = .18; }
    else { b.position.y = .1 + Math.sin(t * 2.2) * .06; b.rotation.y = Math.sin(t * .8) * .45; head.rotation.z = Math.sin(t * 1.7) * .12; }
    if (calm()) { b.rotation.y = .3; b.position.y = .1; }
  });
  host._bird = api;
  return api;
}

window.Rehla3D = { trophy, bird, load: loadThree };
})();
