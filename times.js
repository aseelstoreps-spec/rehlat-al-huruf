/* «أوقات اليوم»: المستويات الخمسة = أوقات يوم المسلم. يستعملها الموقع لسماء الخريطة، ولخلفية الدروس، ولشارة المستوى
   band: سماء الخريطة من أعلى المستوى إلى أسفله (الألوان متصلة من وقت إلى الذي يليه)
   light: سماء فاتحة لداخل الدروس (يبقى النص مقروءاً عليها)
   من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh */
window.REHLA_TIMES = [
  { k: "fajr", name: "الفجر", band: ["#1b2463", "#4b3f93", "#d97f9b", "#ffc98a"], light: ["#e8ddfa", "#fbe3ea", "#fff1df"], dark: true, body: "rise", stars: 1 },
  { k: "duha", name: "الضحى", band: ["#ffd9a8", "#bfe0fa", "#7fbdf0", "#5aa8ea"], light: ["#cfe8ff", "#eaf5ff", "#fff5df"], dark: false, body: "high", stars: 0 },
  { k: "asr", name: "العصر", band: ["#6fb0ea", "#a9cdea", "#f4d593", "#f6b866"], light: ["#ffe7b8", "#fff3d6", "#eaf3ff"], dark: false, body: "low", stars: 0 },
  { k: "maghrib", name: "المغرب", band: ["#f39a58", "#d4566c", "#7d3a78", "#3a2a6e"], light: ["#ffd9cb", "#fde6ec", "#efe6ff"], dark: true, body: "set", stars: .4 },
  { k: "isha", name: "العشاء", band: ["#2a2460", "#161c55", "#0e1240", "#080c2e"], light: ["#dcdff8", "#eceefd", "#f6f3ff"], dark: true, body: "moon", stars: 1.6 }
];
// المستوى (0–4) لرقم الدرس (1–15): الدروس 1–3، 4–6، 7–10، 11–12، 13–15
window.REHLA_LEVEL_OF = (n) => n <= 3 ? 0 : n <= 6 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : 4;
