/* مجسّمات «رحلة الحروف» ثلاثية الأبعاد بالكود (three.js r149، MIT — vendor/three.min.js، يُحمَّل عند الحاجة فقط)
   Rehla3D.medal(host, { size, label }) ← وسام النجمة الثمانية الذهبية، في وسطه حرف أو رقم
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

/* ---------- وسام النجمة الثمانية (۞) ---------- */
// نجمة ذهبية من مربّعين متقاطعين، وفي وسطها قرص نيلي عليه حرف أو رقم بالأصفر، وتدور ببطء وتلمع
async function medal(host, opts) {
  opts = opts || {};
  let T; try { T = await loadThree(); } catch (e) { return; }
  try { await document.fonts.load('700 100px "Noto Naskh Arabic"', "بسم١"); } catch (e) {}
  const st = stage(T, host, opts.size || 140, 5.4); if (!st) return;
  const env = envTexture(T, st.renderer);
  const gold = new T.MeshStandardMaterial({ color: 0xf2b81f, metalness: 1, roughness: .2, envMap: env, envMapIntensity: 1.5 });
  const g = new T.Group();
  const sq = new T.Shape(), R = .78;
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([x, y], i) => sq[i ? "lineTo" : "moveTo"](x * R, y * R));
  const ext = { depth: .12, bevelEnabled: true, bevelThickness: .07, bevelSize: .06, bevelSegments: 4 };
  const s1 = new T.Mesh(new T.ExtrudeGeometry(sq, ext), gold), s2 = s1.clone(); s2.rotation.z = Math.PI / 4; g.add(s1, s2);
  const ring = new T.Mesh(new T.TorusGeometry(.62, .06, 20, 80), gold); ring.position.z = .27; g.add(ring);
  // القرص: لوحة مرسومة (تدرّج نيلي + الحرف) على دائرة مستوية
  const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
  const rg = x.createRadialGradient(210, 190, 20, 256, 256, 270); rg.addColorStop(0, "#3d43a8"); rg.addColorStop(1, "#191b4f");
  x.fillStyle = rg; x.fillRect(0, 0, 512, 512);
  x.fillStyle = "#ffd23f"; x.shadowColor = "#0008"; x.shadowOffsetY = 8; x.shadowBlur = 10;
  x.font = '700 280px "Noto Naskh Arabic", serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(opts.label || "ب", 256, 262);
  const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
  const disc = new T.Mesh(new T.CircleGeometry(.6, 80), new T.MeshStandardMaterial({ map: tex, roughness: .3, metalness: .1, envMap: env, envMapIntensity: .5 }));
  disc.position.z = .26; g.add(disc);
  const back = new T.Mesh(new T.CircleGeometry(.6, 60), new T.MeshStandardMaterial({ color: 0x191b4f })); back.position.z = -.08; back.rotation.y = Math.PI; g.add(back);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 4, b = new T.Mesh(new T.SphereGeometry(.07, 16, 12), gold); b.position.set(Math.cos(a) * 1.06, Math.sin(a) * 1.06, .1); g.add(b); }
  const sparks = [], spMat = new T.SpriteMaterial({ map: sparkTex(T), transparent: true, depthWrite: false });
  for (let i = 0; i < 5; i++) { const sp = new T.Sprite(spMat.clone()); sp.scale.setScalar(.32); st.scene.add(sp); sparks.push({ sp, a: i / 5 * Math.PI * 2, p: Math.random() * 6 }); }
  st.scene.add(g);
  loop(st, (t) => {
    // تتمايل يميناً ويساراً (لا تدور كاملة حتى يبقى الحرف مقروءاً)
    g.rotation.y = calm() ? .25 : Math.sin(t * .9) * .55; g.rotation.x = -.08; g.position.y = Math.sin(t * 1.8) * .04;
    sparks.forEach(k => { const a = k.a + t * .35; k.sp.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, .4); k.sp.material.opacity = Math.max(0, Math.sin(t * 2.2 + k.p)); });
  });
}
function sparkTex(T) {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, "#fff"); r.addColorStop(.25, "#fff6b0"); r.addColorStop(1, "#fff0");
  g.fillStyle = r; g.beginPath(); g.moveTo(32, 0); g.quadraticCurveTo(36, 28, 64, 32); g.quadraticCurveTo(36, 36, 32, 64); g.quadraticCurveTo(28, 36, 0, 32); g.quadraticCurveTo(28, 28, 32, 0); g.fill();
  return new T.CanvasTexture(c);
}

window.Rehla3D = { medal, load: loadThree };
})();
