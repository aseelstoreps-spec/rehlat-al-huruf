/**
 * سجل المعلم — رحلة الحروف (الإصدار 7: الصلاحيات + تقرير ولي الأمر + التقرير الأسبوعي + النسخ الاحتياطي)
 * بعد التحديث: شغّل setup، ثم (مرة واحدة) installTriggers للنسخة الاحتياطية والبريد الأسبوعي، ثم انشر «إصدار جديد»
 * من إنشاء م. كريم عادل اللوح · Created by Eng. Kareem Adel Allouh
 *
 * يُلصق هذا الملف في: جدول Google ← الإضافات ← برمجة التطبيقات (Apps Script)
 * بعد اللصق: احفظ ← شغّل setup ← نشر ← إدارة عمليات النشر ← ✏️ ← الإصدار: إصدار جديد ← نشر
 */

// حساب المدير الأوّلي. بعد أول دخول غيّر كلمة المرور من الموقع (لوحة المدير ← حسابي)،
// وعندها يُحفظ الحساب الجديد داخل المشروع ولا يُستعمل ما هو مكتوب هنا.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "غير-هذه-الكلمة";

const VERSION = 7;
const STUDENTS = "الطلاب";
const EVENTS = "سجل النشاط";
const TEACHERS = "المعلمون";
const GROUPS = "الحلقات";
// العمود 1 معرّف داخلي ثابت، والعمود 11 اسم المستخدم الذي يدخل به الطالب
const NCOL = 12;
const STUDENT_HEADERS = ["المعرّف الداخلي", "الاسم", "الحلقة", "أين وصل", "نسبة الإنجاز %", "أفضل درجة في اختبار الدرس 1 (من 10)", "عدد محاولات الاختبار", "آخر نشاط", "عدد الأنشطة", "التفاصيل", "اسم المستخدم", "رمز تقرير ولي الأمر"];
const EVENT_HEADERS = ["الوقت", "الاسم", "الحلقة", "النشاط", "الدرجة", "من", "أين وصل", "المعرّف الداخلي"];
const TEACHER_HEADERS = ["اسم المستخدم", "كلمة المرور", "اسم المعلم", "الحلقات (افصل بينها بفاصلة)", "مدير؟ (نعم/لا)"];
const GROUP_HEADERS = ["اسم الحلقة"];
const BLANK_DETAIL = () => ({ stages: [false, false, false, false], games: [false, false] });

/* ---------- الأوراق ---------- */
function sheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const make = (name, headers, color) => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(headers);
      sh.setFrozenRows(1);
      sh.setRightToLeft(true);
      sh.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground(color);
    }
    return sh;
  };
  return {
    st: make(STUDENTS, STUDENT_HEADERS, "#d6ecdf"),
    ev: make(EVENTS, EVENT_HEADERS, "#fff3c9"),
    te: make(TEACHERS, TEACHER_HEADERS, "#dbe7ff"),
    gr: make(GROUPS, GROUP_HEADERS, "#f3dbff"),
  };
}

// شغّل هذه الدالة من المحرر مرة واحدة بعد كل تحديث للكود
function setup() {
  const { st, ev, te, gr } = sheets_();
  st.getRange(1, 1, 1, STUDENT_HEADERS.length).setValues([STUDENT_HEADERS]).setFontWeight("bold").setBackground("#d6ecdf");
  st.getRange("A:A").setNumberFormat("@");
  st.hideColumns(1); st.hideColumns(10); st.showColumns(11); st.hideColumns(12);
  ev.getRange(1, 1, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  ev.getRange("H:H").setNumberFormat("@");
  te.getRange("A:B").setNumberFormat("@");
  const known = groupList_(gr);
  teachers_(te).forEach(t => t.groups.forEach(g => { if (known.indexOf(g) < 0) { gr.appendRow([g]); known.push(g); } }));
  // إعطاء اسم مستخدم لكل طالب ليس له اسم
  const last = st.getLastRow();
  if (last > 1) {
    const rows = st.getRange(2, 1, last - 1, NCOL).getValues();
    const taken = {};
    rows.forEach(r => { if (r[10]) taken[norm_(r[10])] = 1; });
    rows.forEach((r, i) => {
      if (r[0] && !r[10]) {
        const u = pickUsername_(first_(r[1]), taken);
        taken[norm_(u)] = 1;
        st.getRange(i + 2, 11).setValue(u);
      }
    });
  }
  // يعيد بناء تقدّم الدروس 2 فما بعد من «سجل النشاط» لمن ضاع تقدّمه في إصدار قديم
  const fixed = repairFromLog_({ st, ev });
  Logger.log("أُصلح تقدّم " + fixed + " طالب من سجل النشاط");
}

/* ---------- إصلاح السجلات من «سجل النشاط» ---------- */
const ORD_ = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر","الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر"];
const STAGE_ORD_ = ["الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة"];
// أسماء ألعاب كل درس كما يرسلها الموقع («لعبة …»)
const GAMES_ = {
  1: ["لعبة اسمع واختر", "لعبة البالونات"],
  2: ["لعبة صنّف الحروف", "لعبة أين الحرف الثقيل؟"],
  3: ["لعبة طابق الشكل", "لعبة أين الحرف؟"],
  4: ["لعبة اسمع واختر الحركة", "لعبة ما اسم الحركة؟"]
};
const STAGES_ = { 1: 4, 2: 3, 3: 3, 4: 3 };
// «الدرس الرابع — الاختبار» ← {n: 4, kind: "test"}
function parseActivity_(a) {
  const m = /^الدرس (.+?) — (.+)$/.exec(String(a || "").trim());
  if (!m) return null;
  const n = ORD_.indexOf(m[1]) + 1, what = m[2].trim();
  if (n < 1) return null;
  if (what === "الاختبار") return { n, kind: "test" };
  const sm = /^المرحلة (.+)$/.exec(what);
  if (sm) { const i = STAGE_ORD_.indexOf(sm[1].trim()); return i < 0 ? null : { n, kind: "stage", i }; }
  const gi = (GAMES_[n] || []).indexOf(what);
  return gi < 0 ? null : { n, kind: "game", i: gi };
}
function repairFromLog_(S) {
  const { st, ev } = S;
  const lastS = st.getLastRow(), lastE = ev.getLastRow();
  if (lastS < 2 || lastE < 2) return 0;
  const rows = st.getRange(2, 1, lastS - 1, NCOL).getValues();
  const idx = {}; rows.forEach((r, i) => { if (r[0]) idx[String(r[0])] = i; });
  const found = {};
  ev.getRange(2, 1, lastE - 1, 8).getValues().forEach(r => {
    const sid = String(r[7]), p = parseActivity_(r[3]);
    if (!p || p.n < 2 || idx[sid] == null) return;
    const lx = found[sid] = found[sid] || {};
    const x = lx[p.n] = lx[p.n] || { stages: [], games: [], best: 0, tries: 0, passedAt: 0 };
    if (p.kind === "stage") x.stages[p.i] = true;
    if (p.kind === "game") x.games[p.i] = true;
    if (p.kind === "test") {
      const sc = Number(r[4]) || 0, t = r[0] instanceof Date ? r[0].getTime() : Date.parse(r[0]) || 0;
      x.tries++; x.best = Math.max(x.best, sc);
      if (sc >= 8 && t && (!x.passedAt || t < x.passedAt)) x.passedAt = t;
    }
  });
  // من نجح في الاختبار أنهى مراحل الدرس ولعبتيه حتماً
  Object.keys(found).forEach(sid => Object.keys(found[sid]).forEach(n => {
    const x = found[sid][n];
    if (x.best >= 8) { x.stages = Array.from({ length: STAGES_[n] || 3 }, () => true); x.games = [true, true]; }
  }));
  let fixed = 0;
  Object.keys(found).forEach(sid => {
    const i = idx[sid], d = safeParse_(rows[i][9]);
    if (d.reset) return; // أُعيد ضبطه: لا نعيد ما مُسح عمداً
    const before = JSON.stringify(d.lx || {});
    d.lx = mergeLx_(d.lx, found[sid]);
    if (JSON.stringify(d.lx) !== before) { st.getRange(i + 2, 10).setValue(JSON.stringify(d)); fixed++; }
  });
  return fixed;
}

/* ---------- أدوات ---------- */
function clean_(v, max) {
  let t = String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, max || 80);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}
function num_(v) { const n = Number(v); return isFinite(n) && v !== "" && v != null ? n : ""; }
function out_(t) { return ContentService.createTextOutput(t); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function safeParse_(t) { try { return JSON.parse(String(t).replace(/^'/, "")); } catch (e) { return {}; } }
const splitGroups_ = (t) => String(t || "").split(/[,،;\n]/).map(s => s.trim()).filter(Boolean);
const iso_ = (d) => d instanceof Date ? d.toISOString() : d;
const props_ = () => PropertiesService.getScriptProperties();
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- أسماء مستخدمي الطلاب ---------- */
// «أحمد» و«احمد» و«أَحمد» تُعدّ اسماً واحداً
function norm_(u) {
  return String(u || "").toLowerCase()
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[\s_.\-]/g, "");
}
// يحوّل ما كتبه المستخدم إلى اسم صالح: حروف عربية أو إنجليزية وأرقام فقط
function cleanUsername_(u) {
  return String(u || "").replace(/[ً-ْٰـ]/g, "")
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^A-Za-z0-9ء-ي]/g, "").slice(0, 20);
}
// يختار اسماً غير مستعمل: إن كان مأخوذاً (أو يشبه اسماً مأخوذاً) يُضاف رقم: أحمد ← أحمد2 ← أحمد3
function pickUsername_(want, taken) {
  let u = cleanUsername_(want);
  if (u.length < 2) u = "طالب";
  if (!taken[norm_(u)]) return u;
  const base = u.replace(/\d+$/, "") || u;
  for (let n = 2; n < 100000; n++) if (!taken[norm_(base + n)]) return base + n;
  throw new Error("no username");
}
const first_ = (name) => String(name || "").trim().split(/\s+/)[0] || "";
function takenMap_(st, exceptRow) {
  const m = {};
  const last = st.getLastRow();
  if (last > 1) st.getRange(2, 11, last - 1, 1).getValues().forEach((r, i) => { if (r[0] && i + 2 !== exceptRow) m[norm_(r[0])] = 1; });
  return m;
}
function rowByUsername_(st, u) {
  const n = norm_(u), last = st.getLastRow();
  if (!n || last < 2) return -1;
  const v = st.getRange(2, 11, last - 1, 1).getValues();
  for (let i = 0; i < v.length; i++) if (v[i][0] && norm_(v[i][0]) === n) return i + 2;
  return -1;
}

/* ---------- المعلمون والحلقات ---------- */
function teacherRows_(te) {
  return te.getLastRow() > 1 ? te.getRange(2, 1, te.getLastRow() - 1, 5).getValues() : [];
}
function teachers_(te) {
  return teacherRows_(te).map((r, i) => ({ row: i + 2, user: String(r[0]).trim(), pass: String(r[1]).trim(), name: String(r[2] || r[0]).trim(),
      groups: splitGroups_(r[3]), admin: /^(نعم|yes|y|1|true)$/i.test(String(r[4]).trim()) || String(r[3]).trim() === "*" }))
    .filter(t => t.user && t.pass && !t.user.startsWith("مثال"));
}
function groupList_(gr) {
  const v = gr.getLastRow() > 1 ? gr.getRange(2, 1, gr.getLastRow() - 1, 1).getValues() : [];
  return v.map(r => String(r[0]).trim()).filter(Boolean);
}
function allGroups_(te, gr) {
  const set = {};
  groupList_(gr).forEach(g => set[g] = 1);
  teachers_(te).forEach(t => t.groups.forEach(g => set[g] = 1));
  return Object.keys(set).sort();
}
// اسم معلم كل حلقة (لختم الشهادة)
function groupTeacher_(te) {
  const m = {};
  teachers_(te).filter(t => !t.admin).forEach(t => t.groups.forEach(g => { if (!m[g]) m[g] = t.name; }));
  return m;
}
function adminCred_() {
  const p = props_();
  return { user: p.getProperty("ADMIN_USER") || ADMIN_USERNAME, pass: p.getProperty("ADMIN_PASS") || ADMIN_PASSWORD };
}
function auth_(p, te) {
  const u = String(p.user || "").trim(), pw = String(p.pass || "");
  if (!u || !pw) return null;
  const a = adminCred_();
  if (u === a.user && pw === a.pass) return { user: u, name: "المدير", groups: [], admin: true, main: true };
  return teachers_(te).find(t => t.user === u && t.pass === pw) || null;
}
const canSee_ = (t, group) => t.admin || t.groups.indexOf(String(group || "").trim()) >= 0;

/* ---------- الطلاب ---------- */
function studentRow_(st, code) {
  const last = st.getLastRow();
  if (last < 2) return -1;
  const ids = st.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]));
  const i = ids.indexOf(String(code));
  return i < 0 ? -1 : i + 2;
}
function readStudent_(st, r) { return studentObj_(st.getRange(r, 1, 1, NCOL).getValues()[0]); }
function studentObj_(r) {
  return { sid: String(r[0]), name: r[1], group: r[2], position: r[3], progress: r[4], best: r[5], tries: r[6],
    lastSeen: iso_(r[7]), activities: r[8], detail: safeParse_(r[9]), username: String(r[10] || ""), reportKey: String(r[11] || "") };
}
function newCode_(st) {
  for (let k = 0; k < 50; k++) {
    const c = String(Math.floor(10000000 + Math.random() * 90000000));
    if (studentRow_(st, c) < 0 && !isDeleted_(c)) return c;
  }
  throw new Error("no code");
}
function deletedList_() { try { return JSON.parse(props_().getProperty("DELETED") || "[]"); } catch (e) { return []; } }
function isDeleted_(c) { return deletedList_().indexOf(String(c)) >= 0; }
function markDeleted_(c) { const l = deletedList_(); l.push(String(c)); props_().setProperty("DELETED", JSON.stringify(l.slice(-3000))); }
const orArr_ = (a, b, n) => Array.from({ length: n }, (_, i) => !!((a || [])[i] || (b || [])[i]));
const minPos_ = (a, b) => { a = Number(a) || 0; b = Number(b) || 0; return a && b ? Math.min(a, b) : (a || b); };
// دمج تقدّم الدروس 2 فما بعد (من جهازين أو أكثر) دون أن يضيع شيء
function mergeLx_(a, b) {
  const out = {};
  [a || {}, b || {}].forEach(o => Object.keys(o).forEach(k => {
    if (!/^([2-9]|1[0-5])$/.test(k)) return;
    const x = out[k] || { stages: [], games: [], best: 0, tries: 0, passedAt: 0 }, y = o[k] || {};
    const ns = Math.min(10, Math.max((x.stages || []).length, (y.stages || []).length));
    const ng = Math.min(4, Math.max((x.games || []).length, (y.games || []).length));
    out[k] = { stages: orArr_(x.stages, y.stages, ns), games: orArr_(x.games, y.games, ng),
      best: Math.max(Number(x.best) || 0, Math.min(10, Number(y.best) || 0)),
      tries: Math.max(Number(x.tries) || 0, Number(y.tries) || 0),
      passedAt: minPos_(x.passedAt, y.passedAt) };
  }));
  return out;
}
function newRow_(st, sid, name, group, username) {
  st.appendRow([sid, name, group, "لم يبدأ بعد", 0, 0, 0, new Date(), 0, JSON.stringify(BLANK_DETAIL()), username]);
  st.getRange(st.getLastRow(), 1).setNumberFormat("@").setValue(sid);
}
function publicStudent_(s, te) {
  return { sid: s.sid, username: s.username, name: s.name, group: s.group, best: s.best, tries: s.tries, detail: s.detail,
    teacher: groupTeacher_(te)[s.group] || "" };
}

/* ---------- POST ---------- */
function doPost(e) {
  const d = JSON.parse(e.postData.contents || "{}");
  if (d.action === "student.register") return json_(withLock_(() => selfRegister_(d)));
  if (d.action) return json_(command_(d));
  return withLock_(() => logEvent_(d));
}

// تسجيل الطالب لنفسه من الموقع: يحصل على اسم مستخدم فريد
function selfRegister_(d) {
  const { st, ev, te } = sheets_();
  const sid = String(d.sid || "").replace(/\D/g, "");
  if (!/^[1-9]\d{7}$/.test(sid)) return { error: "bad_id" };
  if (isDeleted_(sid)) return { error: "deleted" };
  const r = studentRow_(st, sid);
  if (r > 0) {
    const s = readStudent_(st, r);
    if (!s.username) { const u = pickUsername_(d.username || first_(s.name), takenMap_(st)); st.getRange(r, 11).setValue(u); s.username = u; }
    return { ok: true, student: publicStudent_(s, te) };
  }
  const name = clean_(d.name, 40);
  if (!name) return { error: "no_name" };
  const group = clean_(d.group, 40);
  const u = pickUsername_(d.username || first_(name), takenMap_(st));
  newRow_(st, sid, name, group, u);
  ev.appendRow([new Date(), name, group, "تسجيل طالب جديد", "", "", "لم يبدأ بعد", sid]);
  return { ok: true, student: publicStudent_(readStudent_(st, st.getLastRow()), te) };
}

function logEvent_(d) {
  if (!d || !d.sid || !d.name) return out_("bad");
  const { st, ev } = sheets_();
  const sid = clean_(d.sid, 20);
  if (isDeleted_(sid)) return out_("deleted");
  const now = new Date();
  let r = studentRow_(st, sid);
  if (r < 0) { newRow_(st, sid, clean_(d.name, 40), clean_(d.group, 40), pickUsername_(d.username || first_(d.name), takenMap_(st))); r = st.getLastRow(); }
  const old = readStudent_(st, r);
  // الاسم والحلقة يحددهما السجل (يعدّلهما المدير أو المعلم). المزامنة الصامتة لا تُكتب في سجل النشاط
  if (!d.silent) ev.appendRow([now, old.name, old.group, clean_(d.activity, 60), num_(d.score), num_(d.total), clean_(d.position, 80), sid]);

  const od = old.detail || {}, nd = d.detail || {};
  // إذا أعاد المعلم ضبط التقدّم، يُتجاهل تقدّم الأجهزة التي لم تعلم بذلك بعد
  const stale = od.reset && Number(nd.resetSeen || 0) < Number(od.reset);
  const detail = stale ? od : { stages: orArr_(od.stages, nd.stages, 4), games: orArr_(od.games, nd.games, 2),
    reset: od.reset || 0, passedAt: minPos_(od.passedAt, nd.passedAt), lx: mergeLx_(od.lx, nd.lx) };
  const cp = stale ? 0 : num_(d.progress) || 0, op = Number(old.progress) || 0;
  st.getRange(r, 4, 1, 7).setValues([[
    cp >= op ? clean_(d.position, 80) : old.position,
    Math.max(cp, op),
    Math.max(stale ? 0 : num_(d.best) || 0, Number(old.best) || 0),
    Math.max(stale ? 0 : num_(d.tries) || 0, Number(old.tries) || 0),
    d.silent ? old.lastSeen ? new Date(old.lastSeen) : now : now, (Number(old.activities) || 0) + (d.silent ? 0 : 1), JSON.stringify(detail)]]);
  return out_("ok");
}

function command_(d) {
  const S = sheets_();
  const { st, ev, te, gr } = S;
  const t = auth_(d, te);
  if (!t) return { error: "wrong_password" };
  const me = { user: t.user, name: t.name, admin: t.admin, main: !!t.main, groups: t.admin ? allGroups_(te, gr) : t.groups };
  const needAdmin = () => { if (!t.admin) throw new Error("admin_only"); };
  // الحذف وإدارة المديرين للمدير الرئيسي وحده؛ المدير المساعد يرى ويعدّل ولا يحذف
  const needMain = () => { if (!t.main) throw new Error("main_only"); };

  try {
    switch (d.action) {
      case "verify": return { ok: true, me, version: VERSION };
      case "repair": needAdmin(); return withLock_(() => ({ ok: true, fixed: repairFromLog_(S) }));
      case "data": return dashboard_(S, t, me);

      /* --- الطلاب --- */
      case "register": return withLock_(() => {
        const name = clean_(d.name, 40), group = clean_(d.group, 40);
        if (!name) return { error: "no_name" };
        if (!canSee_(t, group)) return { error: "not_your_group" };
        const code = newCode_(st);
        const u = pickUsername_(d.username || first_(name), takenMap_(st));
        newRow_(st, code, name, group, u);
        ev.appendRow([new Date(), name, group, "سجّله " + t.name, "", "", "لم يبدأ بعد", code]);
        return { ok: true, code, username: u, wanted: cleanUsername_(d.username || "") };
      });
      case "student.update": return withLock_(() => {
        const r = studentRow_(st, d.sid);
        if (r < 0) return { error: "not_found" };
        const s = readStudent_(st, r);
        if (!canSee_(t, s.group)) return { error: "not_your_group" };
        const name = clean_(d.name, 40) || s.name;
        const group = d.group == null ? s.group : clean_(d.group, 40);
        if (!canSee_(t, group)) return { error: "not_your_group" };
        let u = s.username;
        if (d.username != null && norm_(d.username) !== norm_(s.username)) {
          const want = cleanUsername_(d.username);
          if (want.length < 2) return { error: "bad_username" };
          const taken = takenMap_(st, r);
          if (taken[norm_(want)]) return { error: "username_taken", suggest: pickUsername_(want, taken) };
          u = want;
        }
        st.getRange(r, 2, 1, 2).setValues([[name, group]]);
        st.getRange(r, 11).setValue(u);
        const what = [name !== s.name ? "الاسم" : "", group !== s.group ? "الحلقة" : "", u !== s.username ? "اسم المستخدم" : ""].filter(Boolean).join(" و");
        if (what) ev.appendRow([new Date(), name, group, "عدّل " + t.name + " " + what, "", "", s.position, s.sid]);
        return { ok: true, username: u };
      });
      case "student.reset": return withLock_(() => {
        const r = studentRow_(st, d.sid);
        if (r < 0) return { error: "not_found" };
        const s = readStudent_(st, r);
        if (!canSee_(t, s.group)) return { error: "not_your_group" };
        const det = BLANK_DETAIL(); det.reset = Date.now();
        st.getRange(r, 4, 1, 4).setValues([["لم يبدأ بعد", 0, 0, 0]]);
        st.getRange(r, 10).setValue(JSON.stringify(det));
        ev.appendRow([new Date(), s.name, s.group, "أعاد " + t.name + " ضبط التقدّم", "", "", "لم يبدأ بعد", s.sid]);
        return { ok: true };
      });
      case "student.delete": needMain(); return withLock_(() => {
        const r = studentRow_(st, d.sid);
        if (r < 0) return { error: "not_found" };
        const s = readStudent_(st, r);
        st.deleteRow(r);
        markDeleted_(s.sid);
        ev.appendRow([new Date(), s.name, s.group, "حذفه " + t.name, "", "", "", s.sid]);
        return { ok: true };
      });

      /* --- تقرير ولي الأمر: رابط خاص لكل طالب --- */
      case "report.link": return withLock_(() => {
        const r = studentRow_(st, d.sid);
        if (r < 0) return { error: "not_found" };
        const s = readStudent_(st, r);
        if (!canSee_(t, s.group)) return { error: "not_your_group" };
        let k = s.reportKey;
        if (!k || d.renew) {
          k = Utilities.getUuid().replace(/-/g, "").slice(0, 20);
          st.getRange(r, 12).setValue(k);
          if (d.renew) ev.appendRow([new Date(), s.name, s.group, "جدّد " + t.name + " رابط ولي الأمر", "", "", s.position, s.sid]);
        }
        return { ok: true, key: k };
      });

      /* --- التقرير الأسبوعي --- */
      case "weekly": return { ok: true, since: iso_(new Date(Date.now() - 7 * 864e5)), events: recentEvents_(ev, 7).filter(e => canSee_(t, e.group)) };

      /* --- النسخة الاحتياطية (للمدير) --- */
      case "backup": needAdmin(); return { ok: true, name: backupNow() };

      /* --- المعلمون (للمدير) --- */
      case "teachers.list": needAdmin();
        return { ok: true, teachers: teachers_(te).map(x => ({ user: x.user, name: x.name, groups: x.groups, admin: x.admin })), groups: allGroups_(te, gr) };
      case "teacher.save": needAdmin(); return withLock_(() => {
        const user = clean_(d.tUser, 40), name = clean_(d.name, 60) || user, pass = String(d.tPass || "").trim();
        const groups = (d.groups || []).map(g => clean_(g, 40)).filter(Boolean);
        if (!/^[A-Za-z0-9_.\-]{2,40}$/.test(user)) return { error: "bad_user" };
        if (user === adminCred_().user) return { error: "user_taken" };
        const list = teachers_(te), orig = String(d.orig || "");
        const cur = orig ? list.find(x => x.user === orig) : null;
        if (orig && !cur) return { error: "not_found" };
        if (!t.main && (d.admin || (cur && cur.admin))) return { error: "main_only" };
        if (list.some(x => x.user === user && x !== cur)) return { error: "user_taken" };
        if (!cur && pass.length < 4) return { error: "short_pass" };
        if (pass && pass.length < 4) return { error: "short_pass" };
        const row = [user, pass || cur.pass, name, groups.join("، "), d.admin ? "نعم" : "لا"];
        if (cur) te.getRange(cur.row, 1, 1, 5).setValues([row]);
        else { te.appendRow(row); te.getRange(te.getLastRow(), 1, 1, 2).setNumberFormat("@").setValues([[user, pass]]); }
        const known = groupList_(gr);
        groups.forEach(g => { if (known.indexOf(g) < 0) { gr.appendRow([g]); known.push(g); } });
        return { ok: true };
      });
      case "teacher.delete": needMain(); return withLock_(() => {
        const cur = teachers_(te).find(x => x.user === String(d.tUser));
        if (!cur) return { error: "not_found" };
        te.deleteRow(cur.row);
        return { ok: true };
      });

      /* --- الحلقات (للمدير) --- */
      case "groups.list": needAdmin(); {
        const ts = teachers_(te);
        const counts = {};
        if (st.getLastRow() > 1) st.getRange(2, 3, st.getLastRow() - 1, 1).getValues().forEach(r => { const g = String(r[0]); counts[g] = (counts[g] || 0) + 1; });
        return { ok: true, groups: allGroups_(te, gr).map(g => ({ name: g, students: counts[g] || 0,
          teachers: ts.filter(x => x.groups.indexOf(g) >= 0).map(x => x.user) })),
          ungrouped: counts[""] || 0, teachers: ts.map(x => ({ user: x.user, name: x.name })) };
      }
      case "group.save": needAdmin(); return withLock_(() => {
        const name = clean_(d.name, 40), orig = clean_(d.orig || "", 40);
        if (!name) return { error: "no_name" };
        const all = allGroups_(te, gr);
        if (name !== orig && all.indexOf(name) >= 0) return { error: "group_taken" };
        const gl = groupList_(gr);
        const gi = orig ? gl.indexOf(orig) : -1;
        if (gi >= 0) gr.getRange(gi + 2, 1).setValue(name); else if (gl.indexOf(name) < 0) gr.appendRow([name]);
        if (orig && orig !== name && st.getLastRow() > 1) {
          const rg = st.getRange(2, 3, st.getLastRow() - 1, 1), v = rg.getValues();
          rg.setValues(v.map(r => [String(r[0]) === orig ? name : r[0]]));
        }
        const want = (d.teachers || []).map(String);
        teachers_(te).forEach(x => {
          let gs = x.groups.filter(g => g !== orig && g !== name);
          if (want.indexOf(x.user) >= 0) gs.push(name);
          if (gs.join("|") !== x.groups.join("|")) te.getRange(x.row, 4).setValue(gs.join("، "));
        });
        return { ok: true };
      });
      case "group.delete": needMain(); return withLock_(() => {
        const name = String(d.name || "");
        const gl = groupList_(gr), gi = gl.indexOf(name);
        if (gi >= 0) gr.deleteRow(gi + 2);
        teachers_(te).forEach(x => { if (x.groups.indexOf(name) >= 0) te.getRange(x.row, 4).setValue(x.groups.filter(g => g !== name).join("، ")); });
        let moved = 0;
        if (st.getLastRow() > 1) {
          const rg = st.getRange(2, 3, st.getLastRow() - 1, 1), v = rg.getValues();
          rg.setValues(v.map(r => { if (String(r[0]) === name) { moved++; return [""]; } return r; }));
        }
        return { ok: true, moved };
      });

      /* --- حسابي --- */
      case "account.update": return withLock_(() => {
        const np = String(d.newPass || "").trim();
        if (np.length < 6) return { error: "short_pass" };
        if (t.main) {
          const nu = clean_(d.newUser || t.user, 40);
          if (!/^[A-Za-z0-9_.\-]{2,40}$/.test(nu)) return { error: "bad_user" };
          if (teachers_(te).some(x => x.user === nu)) return { error: "user_taken" };
          props_().setProperties({ ADMIN_USER: nu, ADMIN_PASS: np });
          return { ok: true, user: nu };
        }
        te.getRange(t.row, 2).setNumberFormat("@").setValue(np);
        return { ok: true, user: t.user };
      });
    }
    return { error: "unknown_action" };
  } catch (err) {
    return { error: String(err.message || err) };
  }
}

function dashboard_(S, t, me) {
  const { st, ev, te } = S;
  const gt = groupTeacher_(te);
  const students = st.getLastRow() > 1
    ? st.getRange(2, 1, st.getLastRow() - 1, NCOL).getValues().map(studentObj_).filter(s => s.sid && canSee_(t, s.group))
      .map(s => Object.assign(s, { teacher: gt[s.group] || "" }))
    : [];
  const lastEv = ev.getLastRow();
  const n = Math.min(1500, Math.max(lastEv - 1, 0));
  const events = (n ? ev.getRange(lastEv - n + 1, 1, n, 8).getValues().reverse() : [])
    .filter(r => canSee_(t, r[2])).slice(0, 400)
    .map(r => ({ ts: iso_(r[0]), name: r[1], group: r[2], activity: r[3], score: r[4], total: r[5], position: r[6], sid: String(r[7]) }));
  return { me, students, events, version: VERSION };
}

/* ---------- GET: طلبات عامة لا تحتاج كلمة مرور ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const { st, te, gr } = sheets_();
  if (p.action === "groups") return json_({ groups: allGroups_(te, gr), teachers: groupTeacher_(te) });
  if (p.action === "report") return json_(parentReport_(st, te, String(p.k || "")));
  if (p.action === "student") {
    let r = -1;
    const code = String(p.code || "").replace(/\D/g, "");
    if (p.u) r = rowByUsername_(st, p.u);
    else if (code) {
      if (isDeleted_(code)) return json_({ error: "deleted" });
      r = code.length === 8 ? studentRow_(st, code) : -1;
    }
    if (r < 0) return json_({ error: "not_found" });
    return json_({ student: publicStudent_(readStudent_(st, r), te) });
  }
  return json_({ ok: true, app: "rehlat-al-huruf", version: VERSION });
}

/* ---------- تقرير ولي الأمر (عام، بالرمز الخاص فقط) ---------- */
function parentReport_(st, te, key) {
  if (!/^[0-9a-f]{20}$/.test(key)) return { error: "not_found" };
  const last = st.getLastRow();
  if (last < 2) return { error: "not_found" };
  const keys = st.getRange(2, 12, last - 1, 1).getValues();
  let r = -1;
  for (let i = 0; i < keys.length; i++) if (String(keys[i][0]) === key) { r = i + 2; break; }
  if (r < 0) return { error: "not_found" };
  const s = readStudent_(st, r);
  const ev = sheets_().ev;
  const events = recentEvents_(ev, 60).filter(e => e.sid === s.sid && e.activity !== "مزامنة").slice(0, 30)
    .map(e => ({ ts: e.ts, activity: e.activity, score: e.score, total: e.total }));
  const d = s.detail || {};
  const serials = {};
  for (let n = 1; n <= 15; n++) {
    const best = n === 1 ? Number(s.best) || 0 : Number(((d.lx || {})[n] || {}).best) || 0;
    if (best >= 8) serials[n] = serial_(s.sid, n - 1, n === 1 ? d.passedAt : (d.lx[n] || {}).passedAt);
  }
  // لا يُرسل المعرّف الداخلي ولا اسم المستخدم: الرابط للاطلاع فقط
  return { student: { name: s.name, group: s.group, teacher: groupTeacher_(te)[s.group] || "", position: s.position, progress: s.progress,
    best: s.best, tries: s.tries, lastSeen: s.lastSeen, detail: { stages: d.stages, games: d.games, passedAt: d.passedAt, lx: d.lx || {} }, serials }, events };
}
// رقم الشهادة (نفس طريقة cert.js تماماً)
function serial_(sid, lessonIndex, date) {
  const str = String(sid) + ":" + (lessonIndex + 1);
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
  for (let i = 0; i < 6; i++) code += A[((i < 3 ? h1 : h2) >>> ((i % 3) * 5 + 3)) & 31];
  const y = new Date(Number(date) || Date.now()).getFullYear();
  return "RH-" + y + "-" + String(lessonIndex + 1).padStart(2, "0") + "-" + code;
}
// أنشطة آخر أيام (من أسفل «سجل النشاط» صعوداً)
function recentEvents_(ev, days) {
  const last = ev.getLastRow();
  if (last < 2) return [];
  const since = Date.now() - days * 864e5, out = [];
  const CH = 1000;
  for (let end = last; end >= 2; end -= CH) {
    const start = Math.max(2, end - CH + 1);
    const rows = ev.getRange(start, 1, end - start + 1, 8).getValues().reverse();
    for (const r of rows) {
      const t = r[0] instanceof Date ? r[0].getTime() : Date.parse(r[0]) || 0;
      if (t && t < since) return out;
      out.push({ ts: iso_(r[0]), name: r[1], group: String(r[2] || ""), activity: String(r[3] || ""), score: r[4], total: r[5], position: r[6], sid: String(r[7]) });
    }
    if (out.length > 20000) break;
  }
  return out;
}

/* ---------- النسخة الاحتياطية والبريد الأسبوعي ---------- */
const BACKUP_FOLDER = "رحلة الحروف - نسخ احتياطية";
// ينسخ الجدول كاملاً إلى مجلد في Drive، ويبقي آخر 12 نسخة
function backupNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const it = DriveApp.getFoldersByName(BACKUP_FOLDER);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP_FOLDER);
  const name = "نسخة " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH-mm") + " — " + ss.getName();
  DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
  const files = [], fit = folder.getFiles();
  while (fit.hasNext()) files.push(fit.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated()).slice(12).forEach(f => f.setTrashed(true));
  return name;
}
// ملخص الأسبوع لكل حلقة، يُرسل إلى بريد صاحب الجدول
function weeklyEmail() {
  const { st, ev } = sheets_();
  const events = recentEvents_(ev, 7).filter(e => e.activity !== "مزامنة");
  const students = st.getLastRow() > 1 ? st.getRange(2, 1, st.getLastRow() - 1, NCOL).getValues().map(studentObj_).filter(s => s.sid) : [];
  const groups = {};
  students.forEach(s => { const g = s.group || "بدون حلقة"; (groups[g] = groups[g] || { students: [], ev: [] }).students.push(s); });
  events.forEach(e => { const g = e.group || "بدون حلقة"; if (groups[g]) groups[g].ev.push(e); });
  let body = "التقرير الأسبوعي — رحلة الحروف\n\n";
  Object.keys(groups).sort().forEach(g => {
    const G = groups[g], active = {}, passed = [];
    G.ev.forEach(e => { active[e.sid] = (active[e.sid] || 0) + 1; if (/ — الاختبار$/.test(e.activity) && Number(e.score) >= 8) passed.push(e.name + ": " + e.activity.replace(" — الاختبار", "")); });
    const idle = G.students.filter(s => !active[s.sid]).map(s => s.name);
    body += "■ " + g + " (" + G.students.length + " طالب)\n";
    body += "  نشط هذا الأسبوع: " + Object.keys(active).length + "\n";
    if (passed.length) body += "  نجح في اختبار: " + passed.join("، ") + "\n";
    if (idle.length) body += "  لم يتدرّب: " + idle.join("، ") + "\n";
    body += "\n";
  });
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "التقرير الأسبوعي — رحلة الحروف", body);
}
// شغّلها مرة واحدة من المحرر: نسخة احتياطية كل جمعة، وبريد التقرير كل خميس
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(tr => { if (["backupNow", "weeklyEmail"].indexOf(tr.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(tr); });
  ScriptApp.newTrigger("backupNow").timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(3).create();
  ScriptApp.newTrigger("weeklyEmail").timeBased().onWeekDay(ScriptApp.WeekDay.THURSDAY).atHour(18).create();
  backupNow();
}
