/* أيقونات «رحلة الحروف»: رسم موحّد بخط مستدير (يأخذ لون النص)، ولمسة صفراء من الهوية
   ic("speaker") ← نص SVG جاهز للإدراج. من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
(function () {
"use strict";
const Y = "#ffd23f"; // أصفر قلم التظليل
const P = {
  back: '<path d="M5 12h13M12 5l7 7-7 7"/>',
  speaker: `<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.2 6.5a7.6 7.6 0 0 1 0 11"/>`,
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  bird: `<path d="M3.5 14c3 .3 5-.6 6.5-2.6 1.6-2.2 2.6-5 5.8-5 2 0 3.2 1.2 3.7 2.4l1.5.7-1.6.8c-.3 3.8-3.4 7-7.6 7-3.3 0-6.3-1.3-8.3-3.3z" fill="${Y}" stroke="currentColor"/><circle cx="16.6" cy="8.8" r=".9" fill="currentColor" stroke="none"/><path d="M9 18.5 7.5 21M12.5 18.6l-.6 2.6"/>`,
  mute: `<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke-linejoin="round"/><path d="m15.5 9.5 5 5M20.5 9.5l-5 5"/>`,
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.3 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.3-3.8-8.5S9.4 5.9 12 3.5z"/>',
  user: `<circle cx="12" cy="8.5" r="3.8" fill="${Y}" stroke="currentColor"/><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>`,
  exit: '<path d="M14 4.5H6.5v15H14"/><path d="M10.5 12H20M16.5 8.5 20 12l-3.5 3.5"/>',
  play: `<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/>`,
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  pen: `<path d="m14.5 5.5 4 4L9 19H5v-4z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/><path d="m12.5 7.5 4 4"/>`,
  star: `<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="${Y}" stroke="#c79600" stroke-linejoin="round"/>`,
  medal: `<path d="M8 3.5h3l1.5 5M16 3.5h-3l-1.5 5"/><circle cx="12" cy="14.5" r="5.5" fill="${Y}" stroke="currentColor"/><path d="m12 12 .9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" stroke="none"/>`,
  trophy: `<path d="M7.5 4.5h9v5a4.5 4.5 0 0 1-9 0z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/><path d="M7.5 6.5H4.5c0 2.6 1.4 4 3.3 4.2M16.5 6.5h3c0 2.6-1.4 4-3.3 4.2M12 14v3.5M8.5 20h7M9.5 17.5h5v2.5h-5z"/>`,
  task: `<rect x="5" y="4" width="14" height="16.5" rx="2.5"/><path d="M9 3h6v3H9z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/><path d="m8.5 13 2.3 2.3 4.7-4.8"/>`,
  card: '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><circle cx="9" cy="11.2" r="2"/><path d="M6 15.5c.5-1.4 1.6-2 3-2s2.5.6 3 2M14.5 10.5H18M14.5 13.5H17"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>',
  mic: `<rect x="9" y="3.5" width="6" height="11" rx="3" fill="${Y}" stroke="currentColor"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6"/>`,
  // ألعاب (تُعرض على دائرة نيلية: الخط أبيض واللمسة صفراء)
  listen: `<path d="M5 14v-2a7 7 0 0 1 14 0v2"/><rect x="3.5" y="13" width="4" height="6.5" rx="1.8" fill="${Y}" stroke="currentColor"/><rect x="16.5" y="13" width="4" height="6.5" rx="1.8" fill="${Y}" stroke="currentColor"/>`,
  balloon: `<path d="M12 3c3.4 0 5.8 2.6 5.8 6 0 3.8-3 7-5.8 7S6.2 12.8 6.2 9c0-3.4 2.4-6 5.8-6z" fill="${Y}" stroke="currentColor"/><path d="m11 16 1 1.5 1-1.5M12 17.5c-.8 1.3.8 2.2 0 3.5"/><path d="M9.5 6.5c.6-.8 1.4-1.2 2.3-1.3" stroke-width="1.6"/>`,
  scale: `<path d="M12 4v15M7 20h10M4.5 7.5h15"/><path d="M4.5 7.5 2.5 13h4z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/><path d="m19.5 7.5-2 5.5h4z" stroke-linejoin="round"/><circle cx="12" cy="4" r="1.2" fill="currentColor"/>`,
  weight: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5 5"/><path d="M8 13.5h5l-.8-4.2H8.8z" fill="${Y}" stroke="currentColor" stroke-linejoin="round" stroke-width="1.6"/><path d="M9.6 9.3a.9.9 0 1 1 1.8 0" stroke-width="1.6"/>`,
  puzzle: `<path d="M4 7.5h4a2.3 2.3 0 1 1 4.4 0H17v4a2.3 2.3 0 1 1 0 4.4V20H4z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/>`,
  find: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5 5"/><path d="M8.5 10.5h4" stroke="${Y}" stroke-width="3"/>`,
  tag: `<path d="M3.5 12.5V4.5h8l9 9-8 8z" fill="${Y}" stroke="currentColor" stroke-linejoin="round"/><circle cx="8" cy="9" r="1.4" fill="currentColor" stroke="none"/>`
};
window.ic = function (name, cls) {
  return `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${P[name] || ""}</svg>`;
};
window.ic.names = Object.keys(P);
})();
