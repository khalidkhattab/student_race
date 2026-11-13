/* منصة اختباراتي – المنافسة والتحفيز
   المرحلة 1: نقاط ومستويات، أوسمة، هدف يومي، احتفال، شهادات تقدير
   المرحلة 2: لوحة الشرف الأسبوعية، تحدي اليوم، الدوريات، الأكثر تحسناً
   المرحلة 3: تحدّي صديق، الفرق، حساب ولي الأمر والمكافآت

   مصدر البيانات المشتركة (Backend) يعمل بثلاث طرق:
   - claude : قاعدة بيانات المشاركة في claude.ai (كل حساب يكتب صفّه فقط: lb/<id>)
   - server : سيرفر خارجي – عرّف window.NQ_SERVER = 'https://...' قبل تحميل هذا الملف (انظر server/)
   - firebase: قاعدة Firestore مجانية – عرّف window.NQ_FIREBASE = { projectId, apiKey } في firebase-config.js
   - local  : بدون إنترنت – المنافسة بين الطلاب على نفس الجهاز
   يُحمّل هذا الملف قبل app.js، ويستخدم window.NQ وقت التشغيل. */
(function () {
  'use strict';
  const N = () => window.NQ;

  /* ================= أدوات ================= */
  const pad = n => String(n).padStart(2, '0');
  const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function weekKey(t = Date.now()) {
    const d = new Date(t); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const w1 = new Date(d.getFullYear(), 0, 4);
    const wk = 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
    return d.getFullYear() + '-W' + pad(wk);
  }
  const prevWeekKey = () => weekKey(Date.now() - 7 * 864e5);
  function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = hashStr(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function seededPick(arr, n, seed) { const r = rng(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
  const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const newCode = (n = 5) => Array.from({ length: n }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
  const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const firstName = s => String(s || '').trim().split(/\s+/)[0] || 'طالب';
  const esc = s => N().esc(s == null ? '' : s);
  const num = n => Number(n || 0).toLocaleString('ar-EG');

  /* ================= النقاط والمستويات ================= */
  const LEVELS = [
    { xp: 0, name: 'مبتدئ', icon: '🌱' }, { xp: 200, name: 'مجتهد', icon: '📘' }, { xp: 600, name: 'متفوق', icon: '🏅' },
    { xp: 1200, name: 'نجم', icon: '⭐' }, { xp: 2500, name: 'بطل', icon: '🏆' }, { xp: 5000, name: 'أسطورة', icon: '👑' }
  ];
  const LEAGUES = [{ min: 0, name: 'الدوري البرونزي', icon: '🥉', id: 'b' }, { min: 600, name: 'الدوري الفضي', icon: '🥈', id: 's' }, { min: 2500, name: 'الدوري الذهبي', icon: '🥇', id: 'g' }];
  const recXp = r => r.xp != null ? r.xp : Math.round((r.score || 0) * (r.mode === 'exam' ? 10 : 5));
  const bonusList = p => p.bonus || (p.bonus = []);
  function totalXp(p) { return p.records.reduce((a, r) => a + recXp(r), 0) + bonusList(p).reduce((a, b) => a + b.xp, 0); }
  function xpIn(p, wk) {
    return p.records.filter(r => weekKey(r.date) === wk).reduce((a, r) => a + recXp(r), 0) +
      bonusList(p).filter(b => weekKey(b.t) === wk).reduce((a, b) => a + b.xp, 0);
  }
  function levelOf(xp) {
    let i = 0; while (i < LEVELS.length - 1 && xp >= LEVELS[i + 1].xp) i++;
    const L = LEVELS[i], nx = LEVELS[i + 1];
    return { i, ...L, next: nx || null, prog: nx ? (xp - L.xp) / (nx.xp - L.xp) : 1 };
  }
  const leagueOf = xp => LEAGUES.slice().reverse().find(l => xp >= l.min);
  function addBonus(p, xp, why) { bonusList(p).push({ t: Date.now(), xp, why }); if (p.bonus.length > 300) p.bonus = p.bonus.slice(-300); }
  const goalOf = p => p.goal || 20;
  const answeredOn = (p, d) => p.records.filter(r => today(new Date(r.date)) === d).reduce((a, r) => a + (r.total || 0), 0);
  function avgIn(p, wk) { const r = p.records.filter(x => weekKey(x.date) === wk); return { n: r.length, avg: r.length ? Math.round(r.reduce((a, x) => a + x.pct, 0) / r.length) : null }; }

  function xpFor(rec) {
    const p = N().cur(); if (!p) return 0;
    if (rec.kind === 'daily') return (p.daily && p.daily[today()]) ? 0 : Math.round(rec.score * 15 + (rec.pct === 100 ? 30 : 0));
    if (rec.kind === 'duel') return Math.round(rec.score * 10);
    const base = rec.key === 'mistakes' || rec.key === 'srs' ? 8 : (rec.mode === 'exam' ? 10 : 5);
    let xp = rec.score * base + (rec.mode === 'exam' && rec.pct === 100 ? 20 : 0);
    // إعادة نفس الاختبار خلال 24 ساعة تعطي نقاطاً أقل (حتى لا يتحول الترتيب إلى تكرار)
    const n = p.records.filter(r => r.key === rec.key && r.subjectId === rec.subjectId && r.date > Date.now() - 864e5).length;
    xp *= [1, 0.5, 0.25][n] != null ? [1, 0.5, 0.25][n] : 0.1;
    return Math.round(xp);
  }

  /* ================= الأوسمة ================= */
  const BADGES = [
    { id: 'first', icon: '🎯', name: 'أول خطوة', desc: 'حل أول اختبار' },
    { id: 'tests10', icon: '📚', name: 'مثابر', desc: 'حل 10 اختبارات' },
    { id: 'tests50', icon: '🏋️', name: 'لا يتوقف', desc: 'حل 50 اختباراً' },
    { id: 'perfect', icon: '💯', name: 'علامة كاملة', desc: '100% في اختبار من 5 أسئلة أو أكثر' },
    { id: 'q100', icon: '🔢', name: 'مئة سؤال', desc: 'أجاب على 100 سؤال' },
    { id: 'q500', icon: '🧠', name: 'خمسمئة سؤال', desc: 'أجاب على 500 سؤال' },
    { id: 'streak3', icon: '🔥', name: 'ثلاثة أيام', desc: 'ذاكر 3 أيام متتالية' },
    { id: 'streak7', icon: '☄️', name: 'أسبوع كامل', desc: 'ذاكر 7 أيام متتالية' },
    { id: 'goal', icon: '🎯', name: 'هدف اليوم', desc: 'حقق هدفه اليومي' },
    { id: 'goal5', icon: '🗓️', name: 'منضبط', desc: 'حقق هدفه اليومي 5 مرات' },
    { id: 'unit', icon: '🧩', name: 'أنهيت وحدة', desc: 'كل دروس وحدة بدرجة 65% أو أكثر' },
    { id: 'cert', icon: '📜', name: 'شهادة تفوق', desc: 'وحدة كاملة بمتوسط 90% أو أكثر' },
    { id: 'mistakes', icon: '🧹', name: 'صائد الأخطاء', desc: '100% في مراجعة الأخطاء' },
    { id: 'allsub', icon: '🌈', name: 'كل المواد', desc: 'حل اختباراً في كل مواد صفه' },
    { id: 'daily', icon: '📅', name: 'تحدي اليوم', desc: 'شارك في تحدي اليوم' },
    { id: 'daily5', icon: '📆', name: 'مواظب على التحدي', desc: 'شارك في تحدي اليوم 5 مرات' },
    { id: 'duelwin', icon: '⚔️', name: 'أول فوز', desc: 'فاز في تحدي صديق' },
    { id: 'team', icon: '👥', name: 'روح الفريق', desc: 'انضم إلى فريق' },
    { id: 'lvl3', icon: '🏅', name: 'متفوق', desc: 'وصل لمستوى متفوق' },
    { id: 'lvl5', icon: '🏆', name: 'بطل', desc: 'وصل لمستوى بطل' }
  ];
  function unitInfo(p, s, u) {
    const best = {};
    p.records.forEach(r => { if (r.subjectId === s.id && r.key !== 'mistakes') best[r.key] = Math.max(best[r.key] || 0, r.pct); });
    const keys = u.lessons.map(l => u.id + '/' + l.id);
    const done = keys.every(k => best[k] != null);
    const avg = done ? Math.round(keys.reduce((a, k) => a + best[k], 0) / keys.length) : null;
    return { done, avg, min: done ? Math.min(...keys.map(k => best[k])) : 0 };
  }
  function badgeChecks(p) {
    const R = p.records, NQ = N();
    const answered = R.reduce((a, r) => a + (r.total || 0), 0);
    const streak = NQ.streakDays(R);
    const subs = NQ.SUBJECTS.filter(s => s.grade === p.grade);
    let unit = false, cert = false;
    subs.forEach(s => s.units.forEach(u => { const ui = unitInfo(p, s, u); if (ui.done && ui.min >= 65) unit = true; if (ui.done && ui.avg >= 90) cert = true; }));
    const lv = levelOf(totalXp(p)).i;
    return {
      first: R.length >= 1, tests10: R.length >= 10, tests50: R.length >= 50,
      perfect: R.some(r => r.pct === 100 && r.total >= 5), q100: answered >= 100, q500: answered >= 500,
      streak3: streak >= 3, streak7: streak >= 7,
      goal: Object.keys(p.goalPaid || {}).length >= 1, goal5: Object.keys(p.goalPaid || {}).length >= 5,
      unit, cert, mistakes: R.some(r => r.key === 'mistakes' && r.pct === 100),
      allsub: subs.length > 0 && subs.every(s => R.some(r => r.subjectId === s.id)),
      daily: Object.keys(p.daily || {}).length >= 1, daily5: Object.keys(p.daily || {}).length >= 5,
      duelwin: Object.values(p.duelPaid || {}).some(v => v === 'win'), team: !!p.team,
      lvl3: lv >= 2, lvl5: lv >= 4
    };
  }
  function awardBadges(p) {
    p.badges = p.badges || {};
    const ok = badgeChecks(p), got = [];
    BADGES.forEach(b => { if (ok[b.id] && !p.badges[b.id]) { p.badges[b.id] = Date.now(); got.push(b); } });
    return got;
  }
  function checkRewards(p) {
    const xp = totalXp(p), got = [];
    (p.rewards || []).forEach(r => { if (!r.done && xp >= r.xp) { r.done = Date.now(); got.push(r); } });
    return got;
  }

  /* ================= بعد كل اختبار ================= */
  function afterResult(rec) {
    const p = N().cur(); if (!p) return null;
    const after = totalXp(p), before = after - (rec.xp || 0);
    const ex = { xp: rec.xp || 0, bonus: [], badges: [], rewards: [], levelUp: null };
    const d = today();
    p.goalPaid = p.goalPaid || {};
    if (!p.goalPaid[d] && answeredOn(p, d) >= goalOf(p)) { p.goalPaid[d] = 1; addBonus(p, 25, 'هدف اليوم'); ex.bonus.push({ xp: 25, why: '🎯 حققت هدف اليوم' }); }
    const lb = levelOf(before), la = levelOf(totalXp(p));
    if (la.i > lb.i) ex.levelUp = la;
    ex.badges = awardBadges(p);
    ex.rewards = checkRewards(p);
    if (rec.pct >= 90 || ex.levelUp || ex.badges.length || ex.rewards.length) setTimeout(confetti, 350);
    scheduleSync();
    return ex;
  }
  function resultExtras(rec, ex) {
    const el = document.getElementById('gm-result'); if (!el) return;
    const p = N().cur(); if (!p) return;
    const L = levelOf(totalXp(p));
    ex = ex || { xp: rec.xp || 0, bonus: [], badges: [], rewards: [] };
    el.innerHTML = `<div class="gm-res">
      <span class="gm-xp">+${num(ex.xp)} نقطة</span>
      ${ex.bonus.map(b => `<span class="gm-xp alt">+${b.xp} ${esc(b.why)}</span>`).join('')}
      ${ex.levelUp ? `<div class="gm-levelup">🎉 مستوى جديد: ${L.icon} <b>${esc(L.name)}</b></div>` : ''}
      ${ex.badges.map(b => `<div class="gm-newbadge"><span>${b.icon}</span> وسام جديد: <b>${esc(b.name)}</b></div>`).join('')}
      ${ex.rewards.map(r => `<div class="gm-newbadge reward"><span>🎁</span> حققت هدف المكافأة: <b>${esc(r.text)}</b> — أخبر ولي أمرك!</div>`).join('')}
      ${rec.kind === 'daily' && !ex.xp ? '<p class="hint">التحدي محسوب مرة واحدة في اليوم، هذه محاولة تدريب بدون نقاط.</p>' : ''}
    </div>`;
  }

  /* ================= لوحة الطالب: إضافات ================= */
  function homeExtras() {
    const el = document.getElementById('gm-home'); const p = N().cur(); if (!el || !p) return;
    const xp = totalXp(p), L = levelOf(xp), lg = leagueOf(xp);
    const d = today(), ans = answeredOn(p, d), goal = goalOf(p), gp = Math.min(1, ans / goal);
    const wk = xpIn(p, weekKey());
    const got = BADGES.filter(b => p.badges && p.badges[b.id]).sort((a, b) => p.badges[b.id] - p.badges[a.id]);
    const rewards = (p.rewards || []).filter(r => !r.claimed);
    const dailyDone = p.daily && p.daily[d];
    el.innerHTML = `
      <section class="gm-row">
        <div class="card gm-level">
          <div class="gm-lv-top"><span class="gm-lv-ic" aria-hidden="true">${L.icon}</span>
            <div><b>${esc(L.name)}</b><small>${num(xp)} نقطة · ${lg.icon} ${esc(lg.name)}</small></div>
            <span class="gm-week">هذا الأسبوع<br><b>${num(wk)}</b></span></div>
          <div class="db-bar" role="img" aria-label="التقدم نحو المستوى التالي"><i style="width:${Math.round(L.prog * 100)}%;background:var(--accent)"></i></div>
          <small class="muted">${L.next ? `باقي ${num(L.next.xp - xp)} نقطة للوصول إلى ${L.next.icon} ${esc(L.next.name)}` : 'وصلت لأعلى مستوى 👑'}</small>
        </div>
        <div class="card gm-goal">
          <div class="gm-lv-top"><span class="gm-lv-ic" aria-hidden="true">${gp >= 1 ? '✅' : '🎯'}</span>
            <div><b>هدف اليوم</b><small>${num(ans)} من ${num(goal)} سؤال${gp >= 1 ? ' · أحسنت! +25' : ''}</small></div></div>
          <div class="db-bar"><i style="width:${Math.round(gp * 100)}%;background:var(--ok)"></i></div>
          <small class="muted">${gp >= 1 ? 'حققت هدفك اليوم 🎉' : 'أكمل الهدف لتحصل على 25 نقطة إضافية'}</small>
        </div>
      </section>
      <nav class="gm-quick" aria-label="المنافسة">
        <a class="gm-q" href="#arena"><span>🏆</span>لوحة الشرف</a>
        <a class="gm-q${dailyDone ? ' done' : ' hot'}" href="#daily"><span>📅</span>${dailyDone ? 'تحدي اليوم ✓' : 'تحدي اليوم'}</a>
        <a class="gm-q" href="#duel"><span>⚔️</span>تحدّي صديق</a>
        <a class="gm-q" href="#teams"><span>👥</span>${p.team ? esc(p.team.name) : 'فريقي'}</a>
        <a class="gm-q" href="#badges"><span>🎖️</span>أوسمتي (${got.length})</a>
      </nav>
      ${rewards.length ? `<section class="card gm-rewards"><h2>🎁 مكافآتي من ولي الأمر</h2>${rewards.map(r => {
        const pr = Math.min(1, xp / r.xp);
        return `<div class="gm-rw"><div><b>${esc(r.text)}</b><small>${r.done ? 'تحققت! 🎉 أخبر ولي أمرك' : `${num(xp)} / ${num(r.xp)} نقطة`}</small></div>
          <div class="db-bar"><i style="width:${Math.round(pr * 100)}%;background:${r.done ? 'var(--ok)' : 'var(--accent)'}"></i></div></div>`;
      }).join('')}</section>` : ''}
      ${got.length ? `<div class="gm-badges-mini">${got.slice(0, 6).map(b => `<span title="${esc(b.name)}">${b.icon}</span>`).join('')}<a href="#badges">كل الأوسمة ←</a></div>` : ''}`;
  }

  /* ================= مصدر البيانات المشتركة ================= */
  const devId = () => {
    try { let d = localStorage.getItem('nq_device'); if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('nq_device', d); } return d; }
    catch (e) { return 'd' + Date.now().toString(36); }
  };
  const Backend = {
    mode: 'local', db: null, uid: null, base: '', device: '', cache: null, cacheAt: 0, err: null,
    async init() {
      const fb = window.NQ_FIREBASE;
      if (fb && fb.projectId && fb.apiKey) {
        this.mode = 'firebase';
        this.base = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(fb.projectId) + '/databases/' + encodeURIComponent(fb.database || '(default)') + '/documents/lb';
        this.key = fb.apiKey;
        this.device = devId();
        return;
      }
      if (window.NQ_SERVER) {
        this.mode = 'server'; this.base = String(window.NQ_SERVER).replace(/\/+$/, '');
        try { this.device = localStorage.getItem('nq_device') || ''; if (!this.device) { this.device = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('nq_device', this.device); } } catch (e) { this.device = 'd' + Date.now(); }
        return;
      }
      if (window.claude && typeof window.claude.use === 'function') {
        try {
          const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
          if (db && user) { const id = await user.id(); if (id) { this.mode = 'claude'; this.db = db; this.uid = id; } }
        } catch (e) { /* يبقى محلياً */ }
      }
    },
    async publish(entries) {
      const body = { students: entries, updated: Date.now() };
      try {
        if (this.mode === 'claude') await this.db.doc('lb/' + this.uid).set(body);
        else if (this.mode === 'server') await fetch(this.base + '/api/lb/' + encodeURIComponent(this.device), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        else if (this.mode === 'firebase') {
          const r = await fetch(this.base + '/' + encodeURIComponent(this.device) + '?key=' + encodeURIComponent(this.key), {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(body) }, updated: { integerValue: String(body.updated) } } })
          });
          if (!r.ok) throw { code: 'http_' + r.status };
        }
        this.err = null;
      } catch (e) { this.err = (e && e.code) || 'network'; }
      this.remote = null;
    },
    async list(force) {
      const withMine = remote => {
        const mine = localEntries(), ids = new Set(Object.keys(mine));
        // الطالب نفسه قد يصل من أكثر من جهاز (ربط العائلة): نبقي نسخته الأكثر نقاطاً فقط
        const one = new Map();
        remote.filter(e => e && typeof e === 'object' && e.pid && !ids.has(e.pid)).forEach(e => { const o = one.get(e.pid); if (!o || (e.xp || 0) > (o.xp || 0)) one.set(e.pid, e); });
        return [...one.values()].concat(Object.values(mine));
      };
      if (!force && this.remote && Date.now() - this.cacheAt < 15000) return (this.cache = withMine(this.remote));
      let out = [];
      try {
        if (this.mode === 'claude') {
          const q = await Promise.race([this.db.collection('lb').get(), new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000))]);
          q.docs.forEach(d => { const v = d.data() || {}; Object.values(v.students || {}).forEach(e => out.push(e)); });
        } else if (this.mode === 'firebase') {
          // runQuery بدل قائمة المستندات: آخر 500 جهاز نشط
          const r = await fetch(this.base.replace(/\/lb$/, ':runQuery') + '?key=' + encodeURIComponent(this.key), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'lb' }], orderBy: [{ field: { fieldPath: 'updated' }, direction: 'DESCENDING' }], limit: 500 } })
          });
          if (!r.ok) throw { code: 'http_' + r.status };
          const rows = await r.json();
          (Array.isArray(rows) ? rows : []).forEach(row => {
            const doc = row && row.document; if (!doc) return;
            try {
              const v = JSON.parse(doc.fields && doc.fields.json ? doc.fields.json.stringValue : 'null');
              if (v && v.students && Date.now() - (v.updated || 0) < 60 * 864e5) Object.values(v.students).forEach(e => out.push(e));
            } catch (e) { /* مستند تالف */ }
          });
        } else if (this.mode === 'server') {
          const r = await fetch(this.base + '/api/lb'); const j = await r.json();
          (j.devices || []).forEach(v => Object.values(v.students || {}).forEach(e => out.push(e)));
        }
        this.err = null;
      } catch (e) { this.err = (e && e.code) || 'network'; }
      this.remote = out; this.cacheAt = Date.now();
      return (this.cache = withMine(out));
    },
    label() {
      return this.mode === 'claude' ? '🌐 الترتيب يشمل كل الطلاب الذين يستخدمون هذا الرابط'
        : this.mode === 'server' || this.mode === 'firebase' ? '🌐 الترتيب يشمل كل طلاب المنصة'
          : '💻 بدون اتصال: الترتيب يشمل الطلاب على هذا الجهاز فقط';
    }
  };
  function entryOf(p) {
    const wk = weekKey(), pw = prevWeekKey(), xp = totalXp(p), L = levelOf(xp);
    const a = avgIn(p, wk), b = avgIn(p, pw), d = today();
    const subj = {}; p.records.filter(r => weekKey(r.date) === wk).forEach(r => { subj[r.subjectId] = (subj[r.subjectId] || 0) + recXp(r); });
    const duels = {};
    Object.entries(p.duels || {}).sort((x, y) => (y[1].created || 0) - (x[1].created || 0)).slice(0, 20)
      .forEach(([c, v]) => { duels[c] = { subject: v.subject, score: v.score == null ? null : v.score, total: v.total || null, secs: v.secs || null, at: v.at || null }; });
    return {
      pid: p.id, name: p.hidden ? 'طالب' : firstName(p.name), avatar: p.hidden ? null : (p.avatar == null ? null : p.avatar),
      grade: p.grade, hidden: !!p.hidden, team: p.team || null, xp, level: L.i, week: wk, weekXp: xpIn(p, wk),
      stage: window.NQSchools ? window.NQSchools.stageOf(p.grade) : null,
      cls: (m => m ? { cid: m.cid, sid: m.sid, region: m.region, school: m.school, section: m.section } : null)(window.NQSchools ? window.NQSchools.primary(p) : null),
      weekAvg: a.avg, weekN: a.n, prevAvg: b.avg, prevN: b.n, subj,
      daily: p.daily && p.daily[d] ? Object.assign({ date: d }, p.daily[d]) : null, duels, updated: Date.now()
    };
  }
  function localEntries() { const o = {}; Object.values(N().store.profiles).forEach(p => { if (p.grade) o[p.id] = entryOf(p); }); return o; }
  let syncT = null;
  function scheduleSync() { clearTimeout(syncT); syncT = setTimeout(() => Backend.publish(localEntries()), 1500); }

  /* ================= واجهة المنافسة ================= */
  const TABS = [['arena', '🏆 لوحة الشرف'], ['daily', '📅 تحدي اليوم'], ['duel', '⚔️ تحدّي صديق'], ['teams', '👥 الفرق']];
  const tabs = on => `<nav class="gm-tabs" aria-label="أقسام المنافسة">${TABS.map(([h, t]) => `<a href="#${h}" class="${on === h ? 'on' : ''}" ${on === h ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
  const avatarOfEntry = e => { const A = N().AVATARS[e.avatar]; return A ? `<span class="av" style="background:${A[1]}" aria-hidden="true">${A[0]}</span>` : `<span class="av" aria-hidden="true">${esc(firstName(e.name).charAt(0))}</span>`; };
  const medal = i => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : num(i + 1);
  const fresh = e => e.week === weekKey();
  const loading = () => '<p class="empty">⏳ جارٍ تحميل الترتيب…</p>';

  let boardTab = 'all', boardSubj = '', boardScope = null, boardLevel = 'grade';
  // ترتيب المدارس: مجموع نقاط أفضل 20 طالباً هذا الأسبوع ÷ 20 (أي متوسط أفضل 20، والمقعد الفارغ = صفر)
  function schoolsHtml(list, mySid) {
    const by = {};
    list.filter(e => e.cls && e.cls.sid && fresh(e) && (e.weekXp || 0) > 0).forEach(e => { (by[e.cls.sid] = by[e.cls.sid] || { name: e.cls.school, region: e.cls.region, xs: [] }).xs.push(e.weekXp); });
    const rows = Object.entries(by).map(([sid, v]) => ({ sid, ...v, n: v.xs.length, score: Math.round(v.xs.sort((a, b) => b - a).slice(0, 20).reduce((a, b) => a + b, 0) / 20) })).sort((a, b) => b.score - a.score);
    if (!rows.length) return '<p class="empty">لا توجد مدارس في الترتيب هذا الأسبوع بعد.</p>';
    const me = rows.findIndex(r => r.sid === mySid);
    return `${me >= 0 ? `<p class="gm-mine">ترتيب مدرستك: <b>${medal(me)}</b> من ${num(rows.length)}</p>` : ''}<p class="hint">النتيجة = متوسط نقاط أفضل 20 طالباً في المدرسة هذا الأسبوع.</p>
      <ol class="gm-board">${rows.slice(0, 50).map((r, i) => `<li class="${r.sid === mySid ? 'me' : ''}"><span class="gm-rank">${medal(i)}</span><span class="av" aria-hidden="true">🏫</span>
        <span class="gm-nm"><b>${esc(r.name)}</b><small>${esc(r.region)} · ${num(r.n)} ${r.n === 1 ? 'طالب نشط' : 'طلاب نشطون'}</small></span><span class="gm-val">${num(r.score)} <small>نقطة</small></span></li>`).join('')}</ol>`;
  }
  async function renderArena() {
    const NQ = N(), p = NQ.cur(), app = NQ.app;
    const subs = NQ.SUBJECTS.filter(s => s.grade === p.grade);
    const lg = leagueOf(totalXp(p));
    const S = window.NQSchools, my = S ? S.primary(p) : null, myStage = S ? S.stageOf(p.grade) : null;
    if (!boardScope || (!my && /^(class|school|region)$/.test(boardScope))) boardScope = my ? 'class' : 'all';
    const draw = (list) => {
      const scopes = [['home', '🏠 البيت'], ['class', '👥 فصلي'], ['school', '🏫 مدرستي'], ['region', '🗺️ منطقتي'], ['all', '🇰🇼 كل المدارس']];
      const levels = boardScope === 'school' ? [['grade', 'صفي'], ['stage', 'مرحلتي']] : (boardScope === 'region' || boardScope === 'all') ? [['grade', 'صفي'], ['stage', 'مرحلتي'], ['schools', 'أفضل المدارس']] : [];
      if (!levels.some(l => l[0] === boardLevel)) boardLevel = 'grade';
      const scopeUi = `<div class="gm-scopes" role="tablist" aria-label="مستوى المنافسة">${scopes.map(([k, t]) => { const off = !my && /^(class|school|region)$/.test(k); return `<button type="button" role="tab" aria-selected="${boardScope === k}" class="gm-scope${boardScope === k ? ' on' : ''}" data-sc="${k}" ${off ? 'disabled' : ''}>${t}</button>`; }).join('')}</div>
        ${!my && S && S.enabled() ? '<p class="hint">لتظهر منافسة الفصل والمدرسة والمنطقة: يقبل ولي أمرك دعوة الفصل التي يرسلها المعلم.</p>' : ''}
        ${my && boardScope !== 'home' && boardScope !== 'all' ? `<p class="hint">${esc(my.school)} · ${esc(my.region)}${boardScope === 'class' ? ' · فصل ' + esc(my.section) : ''}</p>` : ''}
        ${levels.length ? `<div class="gm-filters" role="tablist" aria-label="نطاق الترتيب">${levels.map(([k, t]) => `<button type="button" role="tab" aria-selected="${boardLevel === k}" class="gm-chip${boardLevel === k ? ' on' : ''}" data-lv="${k}">${t}</button>`).join('')}</div>` : ''}`;
      if (boardLevel === 'schools') {
        const pool = (list || []).filter(e => boardScope !== 'region' || (e.cls && my && e.cls.region === my.region));
        return scopeUi + schoolsHtml(pool, my && my.sid);
      }
      let rows = list || [];
      if (boardScope === 'home') rows = rows.filter(e => NQ.store.profiles[e.pid]);
      else {
        if (boardScope === 'class') rows = rows.filter(e => e.cls && my && e.cls.cid === my.cid);
        if (boardScope === 'school') rows = rows.filter(e => e.cls && my && e.cls.sid === my.sid);
        if (boardScope === 'region') rows = rows.filter(e => e.cls && my && e.cls.region === my.region);
        rows = boardLevel === 'stage' ? rows.filter(e => (e.stage || (S && S.stageOf(e.grade))) === myStage) : rows.filter(e => e.grade === p.grade);
        rows = rows.filter(e => !e.hidden || e.pid === p.id);
      }
      let val = e => fresh(e) ? (e.weekXp || 0) : 0, unit = 'نقطة', note = '';
      if (boardTab === 'league') { rows = rows.filter(e => leagueOf(e.xp || 0).id === lg.id); note = `${lg.icon} تنافس الطلاب في ${lg.name} فقط`; }
      if (boardTab === 'improved') {
        rows = rows.filter(e => fresh(e) && e.weekN >= 2 && e.prevN >= 2 && e.weekAvg != null && e.prevAvg != null);
        val = e => e.weekAvg - e.prevAvg; unit = '٪ تحسن'; note = 'الفرق بين متوسط درجاتك هذا الأسبوع والأسبوع الماضي (اختباران على الأقل في كل أسبوع)';
      }
      if (boardTab === 'subject') {
        const sid = boardSubj || (subs[0] && subs[0].id); boardSubj = sid;
        val = e => fresh(e) && e.subj ? (e.subj[sid] || 0) : 0;
      }
      rows = rows.map(e => ({ e, v: val(e) })).filter(x => boardTab === 'improved' || x.v > 0 || x.e.pid === p.id).sort((a, b) => b.v - a.v);
      const meIdx = rows.findIndex(x => x.e.pid === p.id);
      const extra = e => (boardLevel === 'stage' || boardScope === 'home' ? ' · ' + esc(e.grade) : '') + (e.cls && (boardScope === 'region' || boardScope === 'all') ? ' · 🏫 ' + esc(e.cls.school) : '');
      return scopeUi + `
        <div class="gm-filters" role="tablist">
          ${[['all', 'الكل'], ['league', lg.icon + ' دوري'], ['improved', '📈 الأكثر تحسناً'], ['subject', '📚 حسب المادة']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${boardTab === k}" class="gm-chip${boardTab === k ? ' on' : ''}" data-bt="${k}">${t}</button>`).join('')}
          ${boardTab === 'subject' ? `<select id="bsub" aria-label="المادة">${subs.map(s => `<option value="${s.id}" ${s.id === boardSubj ? 'selected' : ''}>${s.icon} ${esc(s.name)}</option>`).join('')}</select>` : ''}
        </div>
        ${note ? `<p class="hint">${note}</p>` : ''}
        ${meIdx >= 0 ? `<p class="gm-mine">ترتيبك: <b>${medal(meIdx)}</b> من ${num(rows.length)}</p>` : ''}
        ${rows.length ? `<ol class="gm-board">${rows.slice(0, 50).map((x, i) => `<li class="${x.e.pid === p.id ? 'me' : ''}">
            <span class="gm-rank">${medal(i)}</span>${avatarOfEntry(x.e)}
            <span class="gm-nm"><b>${esc(x.e.name)}${x.e.pid === p.id ? ' (أنت)' : ''}</b><small>${LEVELS[x.e.level || 0].icon} ${esc(LEVELS[x.e.level || 0].name)}${extra(x.e)}${x.e.team ? ' · 👥 ' + esc(x.e.team.name) : ''}</small></span>
            <span class="gm-val">${boardTab === 'improved' ? (x.v > 0 ? '+' : '') + num(x.v) : num(x.v)} <small>${unit}</small></span></li>`).join('')}</ol>`
          : '<p class="empty">لا يوجد ترتيب بعد هذا الأسبوع. كن أول من يحصل على نقاط! 🚀</p>'}`;
    };
    app.innerHTML = `<section class="gm-page">${tabs('arena')}
      <header class="gm-head"><h1>🏆 لوحة الشرف – ${esc(p.grade)}</h1>
        <p class="sub">ترتيب هذا الأسبوع (يبدأ من جديد كل يوم اثنين). ${Backend.label()}</p>
        <button type="button" class="btn ghost small" id="brf">↻ تحديث</button></header>
      <div id="bbody">${loading()}</div></section>`;
    const body = () => document.getElementById('bbody');
    const bind = () => {
      app.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { boardTab = b.dataset.bt; body().innerHTML = draw(Backend.cache); bind(); });
      app.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => { boardScope = b.dataset.sc; body().innerHTML = draw(Backend.cache); bind(); });
      app.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { boardLevel = b.dataset.lv; body().innerHTML = draw(Backend.cache); bind(); });
      const s = document.getElementById('bsub'); if (s) s.onchange = () => { boardSubj = s.value; body().innerHTML = draw(Backend.cache); bind(); };
    };
    document.getElementById('brf').onclick = async () => { body().innerHTML = loading(); body().innerHTML = draw(await Backend.list(true)); bind(); };
    const list = await Backend.list();
    if (body()) { body().innerHTML = draw(list); bind(); }
  }

  /* ----- تحدي اليوم ----- */
  function dailyPool(grade, d) {
    const all = N().SUBJECTS.filter(s => s.grade === grade).flatMap(s => N().allQuestions(s));
    return seededPick(all, 10, 'daily|' + grade + '|' + d);
  }
  async function renderDaily() {
    const NQ = N(), p = NQ.cur(), app = NQ.app, d = today();
    const mine = p.daily && p.daily[d];
    app.innerHTML = `<section class="gm-page">${tabs('daily')}
      <header class="gm-head"><h1>📅 تحدي اليوم</h1>
        <p class="sub">نفس الـ 10 أسئلة لكل طلاب ${esc(p.grade)} اليوم من كل المواد. أول محاولة فقط هي المحسوبة: 15 نقطة لكل إجابة صحيحة و30 إضافية للعلامة الكاملة. الترتيب بالدرجة ثم الأسرع.</p></header>
      <div class="card gm-daily">
        ${mine ? `<p class="gm-done">✅ أنهيت تحدي اليوم: <b>${num(mine.score)} من ${num(mine.total)}</b> في ${NQ.fmtTime(mine.secs)}</p>
          <button class="btn ghost" id="dstart">تدرّب عليه مرة أخرى (بدون نقاط)</button>`
        : `<button class="btn big" id="dstart">ابدأ تحدي اليوم ←</button>`}
      </div>
      <h2>ترتيب اليوم</h2><div id="dbody">${loading()}</div></section>`;
    document.getElementById('dstart').onclick = () => {
      const pool = dailyPool(p.grade, d);
      NQ.startQuiz({ id: 'daily', name: 'تحدي اليوم' }, 'daily/' + d, '📅 تحدي اليوم ' + d, pool, 'exam', {
        kind: 'daily', noWrong: true,
        onDone(rec) {
          p.daily = p.daily || {};
          if (!p.daily[d]) p.daily[d] = { score: rec.score, total: rec.total, secs: rec.secs, pct: rec.pct };
          const keys = Object.keys(p.daily).sort(); if (keys.length > 40) keys.slice(0, keys.length - 40).forEach(k => delete p.daily[k]);
        }
      });
    };
    const list = await Backend.list();
    const rows = list.filter(e => e.grade === p.grade && !e.hidden && e.daily && e.daily.date === d)
      .sort((a, b) => b.daily.score - a.daily.score || a.daily.secs - b.daily.secs);
    const el = document.getElementById('dbody'); if (!el) return;
    el.innerHTML = rows.length ? `<ol class="gm-board">${rows.map((e, i) => `<li class="${e.pid === p.id ? 'me' : ''}"><span class="gm-rank">${medal(i)}</span>${avatarOfEntry(e)}
        <span class="gm-nm"><b>${esc(e.name)}${e.pid === p.id ? ' (أنت)' : ''}</b><small>⏱ ${NQ.fmtTime(e.daily.secs || 0)}</small></span>
        <span class="gm-val">${num(e.daily.score)}/${num(e.daily.total)}</span></li>`).join('')}</ol>`
      : '<p class="empty">لم يُنهِ أحد تحدي اليوم بعد. كن الأول! 🥇</p>';
  }

  /* ----- تحدّي صديق ----- */
  async function findDuel(code) {
    const p = N().cur();
    if (p.duels && p.duels[code]) return p.duels[code].subject;
    const list = await Backend.list(true);
    for (const e of list) if (e.duels && e.duels[code] && e.duels[code].subject) return e.duels[code].subject;
    return null;
  }
  function renderDuelHome() {
    const NQ = N(), p = NQ.cur(), app = NQ.app;
    const subs = NQ.SUBJECTS.filter(s => s.grade === p.grade);
    const my = Object.entries(p.duels || {}).sort((a, b) => (b[1].created || 0) - (a[1].created || 0)).slice(0, 15);
    app.innerHTML = `<section class="gm-page">${tabs('duel')}
      <header class="gm-head"><h1>⚔️ تحدّي صديق</h1>
        <p class="sub">أنشئ تحدياً وأرسل الكود لصديقك. كل واحد يحل نفس 8 أسئلة في الوقت الذي يناسبه، والفائز صاحب الدرجة الأعلى (ثم الأسرع). الفوز = 30 نقطة إضافية، والتعادل = 15.</p></header>
      <div class="gm-two">
        <form class="card" id="dc"><h2>إنشاء تحدٍّ جديد</h2>
          <label class="pin-lbl" for="dsub">اختر المادة</label>
          <select id="dsub">${subs.map(s => `<option value="${s.id}">${s.icon} ${esc(s.name)}</option>`).join('')}</select>
          <button class="btn" type="submit">إنشاء الكود ←</button></form>
        <form class="card" id="dj"><h2>عندي كود من صديق</h2>
          <label class="pin-lbl" for="dcode">اكتب الكود</label>
          <input id="dcode" class="gm-code-in" maxlength="6" autocomplete="off" placeholder="مثال: K7Q2M" dir="ltr">
          <p class="err" id="dj-err" role="alert"></p>
          <button class="btn" type="submit">انضم ←</button></form>
      </div>
      ${my.length ? `<h2>تحدياتي</h2><ul class="db-list gm-duels">${my.map(([c, v]) => { const s = NQ.subjectById(v.subject); return `<li><span class="ic" aria-hidden="true">${s ? s.icon : '⚔️'}</span><div><b dir="ltr">${esc(c)}</b><small>${s ? esc(s.name) : ''} · ${v.score == null ? 'لم تحل بعد' : 'درجتك ' + num(v.score) + '/' + num(v.total)}</small></div><a class="btn small" href="#duel-${esc(c)}">فتح</a></li>`; }).join('')}</ul>` : ''}
    </section>`;
    document.getElementById('dc').onsubmit = e => {
      e.preventDefault();
      const code = newCode(); p.duels = p.duels || {};
      p.duels[code] = { subject: document.getElementById('dsub').value, creator: true, created: Date.now() };
      NQ.persist(); scheduleSync(); NQ.go('#duel-' + code);
    };
    document.getElementById('dj').onsubmit = async e => {
      e.preventDefault();
      const code = cleanCode(document.getElementById('dcode').value), err = document.getElementById('dj-err');
      if (code.length < 4) { err.textContent = 'اكتب الكود كاملاً.'; return; }
      err.textContent = '⏳ جارٍ البحث…';
      const sid = await findDuel(code);
      if (!sid || !NQ.subjectById(sid)) { err.textContent = Backend.mode === 'local' ? 'لم نجد هذا الكود على هذا الجهاز. التحدي بين جهازين يحتاج اتصالاً بالمنصة.' : 'لم نجد هذا الكود. تأكد منه، أو انتظر دقيقة حتى يُحفظ تحدي صديقك.'; return; }
      p.duels = p.duels || {};
      if (!p.duels[code]) p.duels[code] = { subject: sid, creator: false, created: Date.now() };
      NQ.persist(); scheduleSync(); NQ.go('#duel-' + code);
    };
  }
  async function renderDuel(code) {
    const NQ = N(), p = NQ.cur(), app = NQ.app;
    const mine = p.duels && p.duels[code];
    if (!mine) { app.innerHTML = `<section class="gm-page">${tabs('duel')}<p class="empty">هذا التحدي غير موجود في حسابك. <a href="#duel">انضم بالكود</a></p></section>`; return; }
    const s = NQ.subjectById(mine.subject);
    app.innerHTML = `<section class="gm-page">${tabs('duel')}
      <header class="gm-head"><h1>⚔️ تحدي <span dir="ltr">${esc(code)}</span></h1><p class="sub">${s ? s.icon + ' ' + esc(s.name) : ''} · 8 أسئلة</p></header>
      ${mine.creator ? `<div class="card gm-share"><p>أرسل هذا الكود لصديقك ليدخل من «تحدّي صديق ← عندي كود»:</p><div class="gm-code" dir="ltr">${esc(code)}</div>
        <button type="button" class="btn ghost small" id="cp">نسخ الكود</button></div>` : ''}
      <div class="card">${mine.score == null ? `<button class="btn big" id="dplay">ابدأ التحدي ←</button><p class="hint">لديك محاولة واحدة فقط.</p>`
        : `<p class="gm-done">✅ درجتك: <b>${num(mine.score)} من ${num(mine.total)}</b> في ${NQ.fmtTime(mine.secs || 0)}</p>`}</div>
      <h2>المتسابقون</h2><div id="dlist">${loading()}</div>
      <button type="button" class="btn ghost small" id="drf">↻ تحديث النتيجة</button></section>`;
    const cp = document.getElementById('cp'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(code); NQ.toast('تم نسخ الكود ✓'); } catch (e) { NQ.toast('الكود: ' + code); } };
    const pl = document.getElementById('dplay');
    if (pl) pl.onclick = () => {
      if (!s) return;
      const pool = seededPick(NQ.allQuestions(s), 8, 'duel|' + code);
      NQ.startQuiz(s, 'duel/' + code, '⚔️ تحدي ' + code, pool, 'exam', {
        kind: 'duel', noWrong: true,
        onDone(rec) { Object.assign(p.duels[code], { score: rec.score, total: rec.total, secs: rec.secs, pct: rec.pct, at: rec.date }); }
      });
    };
    const fill = async force => {
      const list = await Backend.list(force);
      const players = list.filter(e => e.duels && e.duels[code]).map(e => ({ e, d: e.duels[code] }));
      const done = players.filter(x => x.d.score != null).sort((a, b) => b.d.score - a.d.score || (a.d.secs || 0) - (b.d.secs || 0));
      const waiting = players.filter(x => x.d.score == null);
      const el = document.getElementById('dlist'); if (!el) return;
      let verdict = '';
      if (done.length >= 2 && mine.score != null) {
        const top = done[0], tie = done[1].d.score === top.d.score && (done[1].d.secs || 0) === (top.d.secs || 0);
        const iWon = top.e.pid === p.id && !tie, iTie = tie && done.slice(0, 2).some(x => x.e.pid === p.id);
        p.duelPaid = p.duelPaid || {};
        if (!p.duelPaid[code] && (iWon || iTie)) {
          p.duelPaid[code] = iWon ? 'win' : 'tie';
          addBonus(p, iWon ? 30 : 15, iWon ? 'فوز في تحدي' : 'تعادل في تحدي');
          const nb = awardBadges(p); NQ.persist(); scheduleSync(); confetti();
          NQ.toast(iWon ? '🏆 فزت في التحدي! +30 نقطة' : '🤝 تعادل! +15 نقطة'); if (nb.length) NQ.toast('وسام جديد: ' + nb.map(b => b.icon + ' ' + b.name).join('، '));
        }
        verdict = `<p class="gm-verdict">${tie ? '🤝 تعادل!' : `🏆 الفائز: <b>${esc(top.e.name)}</b>`}</p>`;
      }
      el.innerHTML = verdict + (players.length ? `<ol class="gm-board">${done.map((x, i) => `<li class="${x.e.pid === p.id ? 'me' : ''}"><span class="gm-rank">${medal(i)}</span>${avatarOfEntry(x.e)}
          <span class="gm-nm"><b>${esc(x.e.name)}${x.e.pid === p.id ? ' (أنت)' : ''}</b><small>⏱ ${NQ.fmtTime(x.d.secs || 0)}</small></span><span class="gm-val">${num(x.d.score)}/${num(x.d.total)}</span></li>`).join('')}
          ${waiting.map(x => `<li class="wait">${avatarOfEntry(x.e)}<span class="gm-nm"><b>${esc(x.e.name)}</b><small>⏳ لم يحل بعد</small></span></li>`).join('')}</ol>`
        : '<p class="empty">في انتظار صديقك…</p>') + (players.length < 2 ? '<p class="hint">ستظهر نتيجة صديقك هنا عندما ينضم ويحل.</p>' : '');
    };
    document.getElementById('drf').onclick = () => fill(true);
    fill(false);
  }

  /* ----- الفرق ----- */
  async function renderTeams() {
    const NQ = N(), p = NQ.cur(), app = NQ.app;
    app.innerHTML = `<section class="gm-page">${tabs('teams')}
      <header class="gm-head"><h1>👥 الفرق</h1><p class="sub">انضم مع زملاء فصلك أو إخوتك في فريق واحد. نقاط الفريق = مجموع نقاط أعضائه هذا الأسبوع.</p></header>
      ${p.team ? `<div class="card gm-team"><div><small>فريقك</small><h2>👥 ${esc(p.team.name)}</h2><p>كود الانضمام: <b class="gm-code sm" dir="ltr">${esc(p.team.code)}</b></p></div>
          <div class="db-btns"><button type="button" class="btn ghost small" id="tcp">نسخ الكود</button><button type="button" class="btn ghost small" id="tleave">مغادرة الفريق</button></div></div>`
        : `<div class="gm-two">
          <form class="card" id="tc"><h2>إنشاء فريق</h2><label class="pin-lbl" for="tname">اسم الفريق</label>
            <input id="tname" maxlength="24" placeholder="مثال: أبطال 6/2" required><p class="err" id="tc-err" role="alert"></p><button class="btn" type="submit">إنشاء ←</button></form>
          <form class="card" id="tj"><h2>الانضمام بكود</h2><label class="pin-lbl" for="tcode">كود الفريق</label>
            <input id="tcode" class="gm-code-in" maxlength="6" placeholder="ABCDE" dir="ltr"><p class="err" id="tj-err" role="alert"></p><button class="btn" type="submit">انضم ←</button></form></div>`}
      <h2>ترتيب الفرق هذا الأسبوع – ${esc(p.grade)}</h2><div id="tbody">${loading()}</div></section>`;
    const setTeam = t => { p.team = t; awardBadges(p); NQ.persist(); scheduleSync(); NQ.route(); };
    const tc = document.getElementById('tc');
    if (tc) tc.onsubmit = e => { e.preventDefault(); const n = document.getElementById('tname').value.trim(); if (n.length < 2) { document.getElementById('tc-err').textContent = 'اكتب اسماً للفريق.'; return; } setTeam({ code: newCode(), name: n.slice(0, 24) }); NQ.toast('تم إنشاء الفريق ✓ أرسل الكود لزملائك'); };
    const tj = document.getElementById('tj');
    if (tj) tj.onsubmit = async e => {
      e.preventDefault(); const code = cleanCode(document.getElementById('tcode').value), err = document.getElementById('tj-err');
      if (code.length < 4) { err.textContent = 'اكتب الكود كاملاً.'; return; }
      const list = await Backend.list(true); const f = list.find(x => x.team && x.team.code === code);
      if (!f) { err.textContent = 'لم نجد فريقاً بهذا الكود.'; return; }
      setTeam({ code, name: f.team.name }); NQ.toast('انضممت إلى ' + f.team.name + ' ✓');
    };
    const tl = document.getElementById('tleave');
    if (tl) tl.onclick = async () => { if (await NQ.ask('هل تريد مغادرة الفريق؟', 'مغادرة', true)) setTeam(null); };
    const tcp = document.getElementById('tcp');
    if (tcp) tcp.onclick = async () => { try { await navigator.clipboard.writeText(p.team.code); NQ.toast('تم النسخ ✓'); } catch (e) { NQ.toast('الكود: ' + p.team.code); } };
    const list = await Backend.list();
    const teams = {};
    list.filter(e => e.grade === p.grade && e.team && e.team.code).forEach(e => {
      const t = teams[e.team.code] || (teams[e.team.code] = { code: e.team.code, name: e.team.name, xp: 0, members: [] });
      t.xp += fresh(e) ? (e.weekXp || 0) : 0; t.members.push(e);
    });
    const rows = Object.values(teams).sort((a, b) => b.xp - a.xp);
    const el = document.getElementById('tbody'); if (!el) return;
    el.innerHTML = rows.length ? `<ol class="gm-board teams">${rows.map((t, i) => `<li class="${p.team && p.team.code === t.code ? 'me' : ''}"><span class="gm-rank">${medal(i)}</span>
        <span class="gm-nm"><b>👥 ${esc(t.name)}</b><small>${t.members.map(m => esc(m.hidden ? 'طالب' : m.name)).join('، ')}</small></span>
        <span class="gm-val">${num(t.xp)} <small>نقطة</small></span></li>`).join('')}</ol>` : '<p class="empty">لا توجد فرق بعد. أنشئ أول فريق!</p>';
  }

  /* ----- الأوسمة والشهادات ----- */
  function renderAchievements() {
    const NQ = N(), p = NQ.cur(), app = NQ.app;
    p.badges = p.badges || {};
    const xp = totalXp(p), L = levelOf(xp), lg = leagueOf(xp), wk = weekKey();
    const subs = NQ.SUBJECTS.filter(s => s.grade === p.grade);
    const certs = [], near = [];
    subs.forEach(s => s.units.forEach(u => {
      const ui = unitInfo(p, s, u);
      if (ui.done && ui.avg >= 90) certs.push({ s, u, avg: ui.avg });
      else {
        const best = {}; p.records.forEach(r => { if (r.subjectId === s.id && r.key !== 'mistakes') best[r.key] = Math.max(best[r.key] || 0, r.pct); });
        const keys = u.lessons.map(l => u.id + '/' + l.id), got = keys.filter(k => best[k] != null).length;
        if (got) near.push({ s, u, got, total: keys.length });
      }
    }));
    near.sort((a, b) => (b.got / b.total) - (a.got / a.total));
    const nb = Object.keys(p.badges).length;
    const rewards = p.rewards || [];
    app.innerHTML = `
      <header class="pg-head"><div><h1>إنجازاتي</h1><p class="sub">${num(nb)} من ${num(BADGES.length)} وسام · ${num(certs.length)} ${certs.length === 1 ? 'شهادة' : 'شهادات'} · ${num(xp)} نقطة</p></div>
        <span class="chip-a">${lg.icon} ${esc(lg.name)}</span></header>
      <section class="card">
        <div class="pg-row"><h2>سلّم المستويات</h2><small class="muted">${L.next ? `باقي ${num(L.next.xp - xp)} نقطة للمستوى التالي` : 'أعلى مستوى 👑'}</small></div>
        <div class="gm-ladder">${LEVELS.map((l, i) => `<div class="${i <= L.i ? 'on' : ''}${i === L.i ? ' now' : ''}"><span>${l.icon}</span><b>${esc(l.name)}</b><small>${num(l.xp)}+</small></div>`).join('')}</div>
        <div class="db-bar" style="margin-top:12px"><i style="width:${Math.round(L.prog * 100)}%;background:var(--accent)"></i></div>
      </section>
      <section class="pg-grid2">
        <div class="card">
          <div class="pg-row"><h2>أوسمتي</h2><small class="muted">${num(nb)} / ${num(BADGES.length)}</small></div>
          <div class="gm-badges">${BADGES.map(b => { const t = p.badges[b.id]; return `<div class="gm-badge${t ? ' got' : ''}"><span aria-hidden="true">${t ? b.icon : '🔒'}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small>${t ? `<small class="when">${NQ.fmtDate(t).split('،')[0]}</small>` : ''}</div>`; }).join('')}</div>
        </div>
        <div class="pg-col">
          <div class="card">
            <h2>شهادات التقدير</h2>
            ${certs.length ? `<ul class="pg-list">${certs.map(c => `<li><span class="ic" aria-hidden="true">${c.s.icon}</span><div><b>${esc(c.u.name)}</b><small>${esc(c.s.name)} · متوسط ${num(c.avg)}٪</small></div><button type="button" class="btn small" data-cert="${c.s.id}|${c.u.id}">تنزيل</button></li>`).join('')}</ul>`
              : '<p class="empty">أكمل كل دروس وحدة بمتوسط 90% أو أكثر لتحصل على شهادة باسمك 📜</p>'}
            ${near[0] ? `<p class="hint">الأقرب لك: ${esc(near[0].u.name.split(':')[0])} في ${esc(near[0].s.name)} — أنجزت ${num(near[0].got)} من ${num(near[0].total)} دروس</p>` : ''}
          </div>
          ${rewards.length ? `<div class="card"><h2>مكافآت ولي الأمر</h2><ul class="pg-list">${rewards.map(r => `<li><span class="ic" aria-hidden="true">${r.done ? '🎁' : '🔒'}</span><div><b>${esc(r.text)}</b>
              <div class="db-bar"><i style="width:${Math.min(100, Math.round(xp / r.xp * 100))}%;background:${r.done ? 'var(--ok)' : 'var(--accent)'}"></i></div>
              <small>${r.done ? 'حصلت عليها 🎉' : `${num(xp)} من ${num(r.xp)} نقطة`}</small></div></li>`).join('')}</ul></div>` : ''}
          <div class="card">
            <div class="pg-row"><h2>ترتيب الأسبوع</h2><a href="#arena">لوحة الشرف</a></div>
            <div id="ach-lb"><p class="empty">⏳ جارٍ التحميل…</p></div>
          </div>
        </div>
      </section>`;
    Backend.list().then(list => {
      const box = document.getElementById('ach-lb'); if (!box) return;
      const rows = (list || []).filter(e => e.grade === p.grade && (!e.hidden || e.pid === p.id))
        .map(e => ({ e, v: fresh(e) ? (e.weekXp || 0) : 0 })).filter(x => x.v > 0 || x.e.pid === p.id).sort((a, b) => b.v - a.v);
      const me = rows.findIndex(x => x.e.pid === p.id);
      const show = rows.slice(0, 5); if (me >= 5) show.push(rows[me]);
      box.innerHTML = show.length ? `<ol class="gm-board mini">${show.map(x => { const i = rows.indexOf(x); return `<li class="${x.e.pid === p.id ? 'me' : ''}"><span class="gm-rank">${medal(i)}</span>${avatarOfEntry(x.e)}<span class="gm-nm"><b>${esc(x.e.name)}${x.e.pid === p.id ? ' (أنت)' : ''}</b></span><span class="gm-val">${num(x.v)} <small>نقطة</small></span></li>`; }).join('')}</ol>`
        : '<p class="empty">لا يوجد ترتيب بعد هذا الأسبوع.</p>';
    }).catch(() => { const box = document.getElementById('ach-lb'); if (box) box.innerHTML = '<p class="empty">تعذّر تحميل الترتيب.</p>'; });
    
  }
  function unitBadge(s, u) {
    const p = N().cur(); if (!p) return '';
    const ui = unitInfo(p, s, u);
    return ui.done && ui.avg >= 90 ? `<button type="button" class="cert-btn" data-cert="${s.id}|${u.id}" title="تنزيل شهادة التقدير">📜 شهادة</button>` : '';
  }
  async function downloadCert(sid, uid) {
    const NQ = N(), p = NQ.cur(), s = NQ.subjectById(sid), u = s && s.units.find(x => x.id === uid); if (!p || !u) return;
    const ui = unitInfo(p, s, u);
    // الشهادة لوحدة مكتملة بمتوسط 90٪ فأكثر فقط
    if (!ui.done || ui.avg == null || ui.avg < 90) { NQ.toast('الشهادة تُمنح عند إتمام كل دروس الوحدة بمتوسط ٩٠٪ فأكثر'); return; }
    try { await document.fonts.load('800 60px Cairo'); await document.fonts.load('500 30px Tajawal'); await document.fonts.load('700 30px Tajawal'); } catch (e) { }
    const W = 1600, H = 1130, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.direction = 'rtl'; x.textAlign = 'center';
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#0f766e'; x.lineWidth = 18; x.strokeRect(40, 40, W - 80, H - 80);
    x.strokeStyle = '#d97706'; x.lineWidth = 4; x.strokeRect(78, 78, W - 156, H - 156);
    const A = NQ.AVATARS[p.avatar];
    x.font = '120px serif'; x.fillText(A ? A[0] : '🏆', W / 2, 240);
    x.fillStyle = '#0f766e'; x.font = '800 88px Cairo, sans-serif'; x.fillText('شهادة تقدير', W / 2, 370);
    x.fillStyle = '#334155'; x.font = '500 40px Tajawal, sans-serif'; x.fillText('تُمنح هذه الشهادة للطالب/ة', W / 2, 460);
    x.fillStyle = '#b45309'; x.font = '800 78px Cairo, sans-serif'; x.fillText(p.name, W / 2, 570);
    x.fillStyle = '#334155'; x.font = '500 40px Tajawal, sans-serif';
    x.fillText(`لإتمامه ${u.name.split(':')[0]} في مادة ${s.name}`, W / 2, 670);
    x.fillText(`«${(u.name.split(':')[1] || '').trim()}»`, W / 2, 730);
    x.fillStyle = '#15803d'; x.font = '800 52px Cairo, sans-serif'; x.fillText(`بمتوسط ${num(ui.avg)}٪ — ممتاز`, W / 2, 830);
    x.fillStyle = '#64748b'; x.font = '500 32px Tajawal, sans-serif';
    x.fillText(`${p.grade} · ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })} · قِمّة`, W / 2, 950);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const filename = `شهادة-${p.name}-${s.name}-${uid}.png`.replace(/\s+/g, '-');
    let dl = null; if (window.claude && typeof window.claude.use === 'function') { try { dl = await window.claude.use('downloads'); } catch (e) { } }
    if (dl) { try { await dl.save({ filename, data: blob }); NQ.toast('تم حفظ الشهادة ✓'); } catch (e) { if (e && e.code !== 'declined') NQ.toast('تعذّر التنزيل هنا'); } return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ================= ولي الأمر ================= */
  const KEY_PARENT_UNLOCK = 'nq_parent_unlocked';
  const parentUnlocked = () => { try { return sessionStorage.getItem(KEY_PARENT_UNLOCK) === '1'; } catch (e) { return false; } };
  const setParentUnlocked = v => { try { v ? sessionStorage.setItem(KEY_PARENT_UNLOCK, '1') : sessionStorage.removeItem(KEY_PARENT_UNLOCK); } catch (e) { } };
  const pin6 = (id, label) => `<label class="pin-lbl" for="${id}">${label}</label><input id="${id}" class="pin-in" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••••">`;
  const only6 = el => el.addEventListener('input', () => { el.value = el.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g, '').slice(0, 6); });
  async function renderParent() {
    const NQ = N(), app = NQ.app, st = NQ.store;
    document.body.classList.remove('welcome-mode');
    if (!st.parent || !st.parent.pinHash) {
      app.innerHTML = `<section class="login"><h1>👨‍👩‍👧 حساب ولي الأمر</h1>
        <p class="sub">أنشئ رقماً سرياً من 6 أرقام لولي الأمر. من هنا تتابع كل الطلاب، وتضع لهم أهدافاً ومكافآت، وتعيد تعيين أرقامهم السرية إذا نسوها.</p>
        <form class="card step" id="pf"><div class="pin-row"><div>${pin6('pp1', 'رقم ولي الأمر')}</div><div>${pin6('pp2', 'أعد كتابته')}</div></div>
        <p class="err" id="perr" role="alert"></p><div class="actions" style="justify-content:flex-start"><button class="btn" type="submit">إنشاء الحساب ←</button><a class="btn ghost" href="#login">رجوع</a></div></form></section>`;
      const a = document.getElementById('pp1'), b = document.getElementById('pp2'); only6(a); only6(b);
      document.getElementById('pf').onsubmit = async e => {
        e.preventDefault(); const err = document.getElementById('perr');
        if (!/^\d{6}$/.test(a.value)) { err.textContent = 'الرقم 6 أرقام.'; return; }
        if (a.value !== b.value) { err.textContent = 'الرقمان غير متطابقين.'; return; }
        if (/^(\d)\1{5}$/.test(a.value) || a.value === '123456') { err.textContent = 'اختر رقماً أصعب.'; return; }
        st.parent = { pinHash: await NQ.hashPin('parent', a.value), created: Date.now() };
        NQ.persist(); setParentUnlocked(true); renderParent();
      };
      return;
    }
    if (!parentUnlocked()) {
      app.innerHTML = `<section class="login"><h1>👨‍👩‍👧 دخول ولي الأمر</h1>
        <form class="card step" id="pl" style="max-width:380px">${pin6('pl1', 'رقم ولي الأمر')}<p class="err" id="plerr" role="alert"></p>
        <div class="actions" style="justify-content:flex-start"><button class="btn" type="submit">دخول ←</button><a class="btn ghost" href="#login">رجوع</a></div></form></section>`;
      const a = document.getElementById('pl1'); only6(a); a.focus();
      document.getElementById('pl').onsubmit = async e => {
        e.preventDefault();
        if ((await NQ.hashPin('parent', a.value)) === st.parent.pinHash) { setParentUnlocked(true); renderParent(); }
        else { document.getElementById('plerr').textContent = 'الرقم غير صحيح.'; a.value = ''; }
      };
      return;
    }
    const people = Object.values(st.profiles).filter(p => p.grade);
    if (parentKid && !st.profiles[parentKid]) parentKid = null;
    if (parentKid) return renderParentKid(st.profiles[parentKid], people);
    renderParentHome(people);
  }

  /* ----- حسابات ولي الأمر ----- */
  const DAY = 864e5;
  const inRange = (p, from, to) => p.records.filter(r => r.date >= from && r.date < to);
  const avgOf = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.pct, 0) / rs.length) : null;
  function kidSummary(p, days = 7) {
    const NQ = N(), now = Date.now(), from = now - days * DAY;
    const cur1 = inRange(p, from, now + 1), prev = inRange(p, from - days * DAY, from);
    const a = avgOf(cur1), b = avgOf(prev);
    const subs = NQ.SUBJECTS.filter(s => s.grade === p.grade).map(s => ({ s, st: NQ.subjectStats(s, p.records) })).filter(x => x.st.level != null).sort((x, y) => y.st.level - x.st.level);
    const last = p.records.reduce((m, r) => !m || r.date > m.date ? r : m, null);
    const idle = last ? Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(last.date).setHours(0, 0, 0, 0)) / DAY) : null;
    const goal = goalOf(p);
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const n = answeredOn(p, today(d)); return { d, n, lvl: n >= goal ? 2 : n > 0 ? 1 : 0 }; });
    return {
      recs: cur1, n: cur1.length, qs: cur1.reduce((s, r) => s + (r.total || 0), 0), secs: cur1.reduce((s, r) => s + (r.secs || 0), 0),
      avg: a, delta: a != null && b != null ? a - b : null, prevN: prev.length, subs, strong: subs[0] || null, weak: subs.length > 1 ? subs[subs.length - 1] : null,
      last, idle, goal, week, xp: totalXp(p)
    };
  }
  const trendTxt = d => d == null ? '<span class="pr-flat">لا توجد مقارنة</span>' : d > 0 ? `<span class="pr-up">▲ ${num(d)}٪ عن الفترة السابقة</span>` : d < 0 ? `<span class="pr-down">▼ ${num(-d)}٪ عن الفترة السابقة</span>` : '<span class="pr-flat">بدون تغيير</span>';
  const lvlColor = v => N().gradeOf(v).c;
  const dayName = d => d.toLocaleDateString('ar-EG', { weekday: 'short' });
  function parentHeader(sub) {
    return `<header class="pg-head"><div><h1>${sub.title}</h1><p class="sub">${sub.line}</p></div>
      <div class="db-btns">${window.NQReports ? '<a class="btn ghost small" href="#reports">🚩 بلاغات الأسئلة</a>' : ''}<button type="button" class="btn ghost small" id="pchg">تغيير رقم ولي الأمر</button><button type="button" class="btn ghost small" id="pout">خروج ولي الأمر</button></div></header>`;
  }
  function bindParentHeader() {
    const NQ = N(), st = NQ.store;
    document.getElementById('pout').onclick = () => { setParentUnlocked(false); parentKid = null; NQ.go('#login'); };
    document.getElementById('pchg').onclick = async () => {
      if (!(await NQ.ask('تغيير رقم ولي الأمر؟ ستختار رقماً جديداً الآن.', 'تغيير'))) return;
      st.parent = null; setParentUnlocked(false); NQ.persist(); renderParent();
    };
  }

  /* ----- 1) نظرة على الأسرة ----- */
  let parentKid = null;
  function renderParentHome(people) {
    const NQ = N(), app = NQ.app;
    const sums = people.map(p => ({ p, k: kidSummary(p) }));
    const tot = sums.reduce((a, x) => ({ n: a.n + x.k.n, q: a.q + x.k.qs, s: a.s + x.k.secs }), { n: 0, q: 0, s: 0 });
    const alerts = [];
    sums.forEach(({ p, k }) => {
      if (k.idle != null && k.idle >= 3) alerts.push({ cls: 'bad', t: `${esc(firstName(p.name))}: لا مذاكرة منذ ${num(k.idle)} أيام`, s: `آخر اختبار ${NQ.fmtDate(k.last.date).split('،')[0]}`, pid: p.id });
      else if (!p.records.length) alerts.push({ cls: 'bad', t: `${esc(firstName(p.name))}: لا اختبارات بعد`, s: 'لم يُحل أي اختبار حتى الآن', pid: p.id });
      if (k.weak && k.weak.st.level < 60) alerts.push({ cls: 'mid', t: `${esc(firstName(p.name))}: ${esc(k.weak.s.name)} ${num(k.weak.st.level)}٪`, s: `${num(k.weak.st.weak.length)} ${k.weak.st.weak.length === 1 ? 'درس' : 'دروس'} أقل من 65٪`, pid: p.id });
      if (window.NQP) window.NQP.alerts(p).forEach(a => alerts.push(a));
      (p.rewards || []).filter(r => r.done && !r.given).forEach(r => alerts.push({ cls: 'ok', t: `مكافأة تحققت: ${esc(firstName(p.name))}`, s: `«${esc(r.text)}» · حان وقت تسليمها`, give: p.id + '|' + r.id }));
    });
    const hour = new Date().getHours();
    app.innerHTML = `<section class="pr-page">
      ${parentHeader({ title: 'هذا الأسبوع في البيت', line: `${hour < 12 ? 'صباح الخير' : 'مساء الخير'} · ${num(people.length)} ${people.length === 1 ? 'طالب' : 'أبناء'} · ${num(tot.n)} اختباراً · ${num(tot.q)} سؤالاً · ${num(Math.round(tot.s / 60))} دقيقة مذاكرة في آخر 7 أيام` })}
      ${window.NQSchools ? window.NQSchools.parentHtml(people) : ''}
      ${alerts.length ? `<section class="pr-alerts" aria-label="تنبيهات">${alerts.slice(0, 6).map(a => `<div class="pr-alert ${a.cls}"><div><b>${a.t}</b><small>${a.s}</small></div>
        ${a.give ? `<button type="button" class="btn small" data-give="${a.give}">سلّمتها ✓</button>` : `<button type="button" class="btn ghost small" data-kid="${a.pid}">عرض</button>`}</div>`).join('')}</section>` : ''}
      ${people.length ? `<section class="pr-kids">${sums.map(({ p, k }) => {
        const need = (k.idle != null && k.idle >= 3) || (k.delta != null && k.delta <= -5) || !p.records.length;
        const L = levelOf(k.xp);
        return `<article class="card pr-kid${need ? ' need' : ''}">
          <header>${NQ.avatarHtml(p, false)}<div><h2>${esc(p.name)}</h2><small>${esc(p.grade)} · ${L.icon} ${esc(L.name)} · ${num(k.xp)} نقطة</small></div>${need ? '<span class="pr-tag">بحاجة لتشجيع</span>' : ''}</header>
          <div class="pr-kid-mid">
            <div class="ring pr-ring" style="--p:${k.avg || 0};--rc:${k.avg == null ? 'var(--track)' : lvlColor(k.avg)}" role="img" aria-label="متوسط آخر 7 أيام ${k.avg == null ? 'لا يوجد' : k.avg + '٪'}"><div><b>${k.avg == null ? '—' : num(k.avg) + '٪'}</b><small>المتوسط</small></div></div>
            <div class="pr-kid-nums"><span><b>${num(k.n)}</b> اختباراً</span><span><b>${num(k.qs)}</b> سؤالاً</span>${trendTxt(k.delta)}</div>
          </div>
          <div><small class="muted">أيام المذاكرة (الهدف ${num(k.goal)} سؤالاً)</small>
            <div class="pr-days">${k.week.map(w => `<span class="l${w.lvl}" title="${dayName(w.d)}: ${num(w.n)} سؤال"></span>`).join('')}</div></div>
          <div class="pr-sw">${k.strong ? `<div><span>الأقوى: ${esc(k.strong.s.name)}</span><b style="color:${lvlColor(k.strong.st.level)}">${num(k.strong.st.level)}٪</b></div>` : '<div><span class="muted">لم يبدأ أي مادة بعد</span></div>'}
            ${k.weak ? `<div><span>الأضعف: ${esc(k.weak.s.name)}</span><b style="color:${lvlColor(k.weak.st.level)}">${num(k.weak.st.level)}٪</b></div>` : ''}</div>
          <button type="button" class="btn ${need ? '' : 'ghost'} pr-open" data-kid="${p.id}">التقرير الكامل</button>
        </article>`;
      }).join('')}</section>` : '<p class="empty">لا يوجد طلاب بعد. يسجّل كل طالب من شاشة الدخول.</p>'}
      ${sums.some(x => (x.p.rewards || []).length) ? `<section class="card"><h2>المكافآت القادمة</h2><div class="pr-rw-grid">${sums.flatMap(({ p, k }) => (p.rewards || []).filter(r => !r.given).map(r => `<div><div class="pg-row sm"><b>${esc(firstName(p.name))} · ${esc(r.text)}</b><small class="${r.done ? 'pr-up' : 'muted'}">${r.done ? 'تحققت' : num(Math.min(100, Math.round(k.xp / r.xp * 100))) + '٪'}</small></div>
          <div class="db-bar"><i style="width:${Math.min(100, Math.round(k.xp / r.xp * 100))}%;background:${r.done ? 'var(--ok)' : 'var(--accent)'}"></i></div></div>`)).join('') || '<p class="empty">كل المكافآت سُلّمت 🎉</p>'}</div></section>` : ''}
      ${window.NQP ? window.NQP.familyHtml() : ''}
    </section>`;
    bindParentHeader();
    if (window.NQP) window.NQP.bindFamily();
    if (window.NQSchools) window.NQSchools.bindParent(people, () => renderParent());
    app.querySelectorAll('[data-kid]').forEach(b => b.onclick = () => { parentKid = b.dataset.kid; renderParent(); window.scrollTo(0, 0); });
    app.querySelectorAll('[data-give]').forEach(b => b.onclick = () => {
      const [pid, rid] = b.dataset.give.split('|'), r = (NQ.store.profiles[pid].rewards || []).find(x => x.id === rid);
      if (r) { r.given = Date.now(); NQ.persist(); NQ.toast('تم تسجيل تسليم المكافأة ✓'); renderParent(); }
    });
  }

  /* ----- 2) تقرير الابن ----- */
  let parentPeriod = 7;
  function renderParentKid(p, people) {
    const NQ = N(), app = NQ.app, X = window.NQP;
    if (X && X.view === 'report') return X.renderReport(p, () => renderParent());
    const k = kidSummary(p, parentPeriod), L = levelOf(k.xp), lg = leagueOf(k.xp);
    const maxN = Math.max(k.goal * 1.5, ...k.week.map(w => w.n));
    const weak = k.subs.flatMap(x => x.st.weak).sort((a, b) => a.pct - b.pct).slice(0, 4);
    const tries = key => p.records.filter(r => r.key === key).length;
    const mins = Math.round(k.secs / 60);
    const lastTxt = k.last ? (k.idle === 0 ? 'اليوم' : k.idle === 1 ? 'أمس' : `منذ ${num(k.idle)} أيام`) : '—';
    const fn = esc(firstName(p.name));
    const kidLink = q => `<button type="button" class="sb-a${q.id === p.id ? ' on' : ''}" ${q.id === p.id ? 'aria-current="page"' : ''} data-kid="${q.id}">${NQ.avatarHtml(q, false)}<span>${esc(firstName(q.name))}<small>${esc(q.grade)}</small></span></button>`;
    app.innerHTML = `<div class="shell pr-shell">
      <nav class="sb" aria-label="الأبناء">
        <div class="sb-links">
          <button type="button" class="sb-a" data-kid=""><svg class="sb-ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/></svg><span>كل الأبناء</span></button>
          <span class="sb-sep" aria-hidden="true"></span>
          ${people.map(kidLink).join('')}
        </div>
      </nav>
      <div class="shell-main">
        <header class="pg-head">
          <div class="pr-who">${NQ.avatarHtml(p, true)}<div><h1>${esc(p.name)}</h1><p class="sub">${esc(p.grade)} · ${L.icon} ${esc(L.name)} · ${num(k.xp)} نقطة · ${lg.icon} ${esc(lg.name)}</p></div></div>
          <div class="pr-hbtns">${X ? '<button type="button" class="btn small" data-px-report>📄 التقرير الأسبوعي</button>' : ''}<div class="segs" role="group" aria-label="الفترة"><button type="button" class="seg${parentPeriod === 7 ? ' on' : ''}" aria-pressed="${parentPeriod === 7}" data-per="7">آخر 7 أيام</button><button type="button" class="seg${parentPeriod === 30 ? ' on' : ''}" aria-pressed="${parentPeriod === 30}" data-per="30">آخر 30 يوماً</button></div></div>
        </header>
        <section class="pg-tiles">
          <div class="card pg-tile"><small>متوسط الدرجات</small><b>${k.avg == null ? '—' : num(k.avg) + '٪'}</b><small class="note">${trendTxt(k.delta)}</small></div>
          <div class="card pg-tile"><small>اختبارات</small><b>${num(k.n)}</b><small class="note muted">${num(k.qs)} سؤالاً</small></div>
          <div class="card pg-tile"><small>وقت المذاكرة</small><b>${mins >= 60 ? num(Math.floor(mins / 60)) + ' س ' + num(mins % 60) + ' د' : num(mins) + ' د'}</b><small class="note muted">متوسط ${num(Math.round(mins / parentPeriod))} د يومياً</small></div>
          <div class="card pg-tile"><small>آخر نشاط</small><b>${lastTxt}</b><small class="note muted">${k.last ? esc((NQ.subjectById(k.last.subjectId) || { name: k.last.kind === 'daily' ? 'تحدي اليوم' : 'تحدي صديق' }).name) : 'لم يبدأ بعد'}</small></div>
        </section>
        <section class="pg-grid2">
          <div class="card">
            <h2>الأسئلة يومياً</h2><p class="muted" style="margin:0 0 12px">الخط المتقطع = الهدف اليومي (${num(k.goal)} سؤالاً)</p>
            <div class="pg-chart" role="img" aria-label="${k.week.map(w => dayName(w.d) + ' ' + w.n).join('، ')}">
              <span class="goal-line" style="bottom:${Math.round(k.goal / maxN * 100)}%"></span>
              ${k.week.map(w => `<div class="col"><small>${num(w.n)}</small><i style="height:${Math.max(2, Math.round(w.n / maxN * 100))}%;background:${w.n >= k.goal ? 'var(--brand)' : w.n ? 'var(--brand-soft-2)' : 'var(--track)'}"></i></div>`).join('')}
            </div>
            <div class="pg-chart-x">${k.week.map(w => `<small>${dayName(w.d)}</small>`).join('')}</div>
          </div>
          <div class="card">
            <h2>المستوى في كل مادة</h2>
            ${k.subs.length ? `<div class="pg-bars">${k.subs.map(x => `<div><div class="pg-row sm"><b>${x.s.icon} ${esc(x.s.name)}</b><b style="color:${lvlColor(x.st.level)}">${num(x.st.level)}٪</b></div><div class="db-bar"><i style="width:${x.st.level}%;background:${lvlColor(x.st.level)}"></i></div></div>`).join('')}</div>` : '<p class="empty">لا توجد اختبارات بعد.</p>'}
          </div>
        </section>
        <section class="pg-grid2">
          <div class="card">
            <h2>دروس تحتاج متابعة</h2>
            ${weak.length ? `<div class="pr-weak">${weak.map(w => `<div class="${w.pct < 55 ? 'bad' : 'mid'}"><div><b>${esc(w.name)}</b><small>${esc(w.s.name)} · ${esc(w.unit.name.split(':')[0])} · ${num(tries(w.key))} ${tries(w.key) === 1 ? 'محاولة' : 'محاولات'}</small></div><b>${num(w.pct)}٪</b></div>`).join('')}</div>`
              : `<p class="empty">${p.records.length ? 'كل الدروس المحلولة درجتها 65٪ أو أكثر 🎉' : 'ستظهر هنا الدروس الضعيفة بعد أول اختبار.'}</p>`}
          </div>
          <div class="card pr-goals">
            <h2>الأهداف والمكافآت</h2>
            <div><small class="muted"><b>الهدف اليومي</b> (25 نقطة إضافية في كل يوم يتحقق فيه)</small>
              <div class="pr-goal" role="group" aria-label="الهدف اليومي">${[10, 20, 30, 50].map(n => `<button type="button" aria-pressed="${k.goal === n}" class="${k.goal === n ? 'on' : ''}" data-goal="${n}">${num(n)}</button>`).join('')}</div></div>
            ${(p.rewards || []).map(r => { const pc = Math.min(100, Math.round(k.xp / r.xp * 100)); return `<div class="pr-rw"><div class="pg-row sm"><b>${esc(r.text)}</b><span><small class="${r.done ? 'pr-up' : 'muted'}">${r.given ? 'سُلّمت ✓' : r.done ? 'تحققت' : `${num(k.xp)} من ${num(r.xp)} نقطة`}</small> <button type="button" class="linkish" data-rdel="${r.id}" aria-label="حذف ${esc(r.text)}">حذف</button></span></div>
              <div class="db-bar"><i style="width:${pc}%;background:${r.done ? 'var(--ok)' : 'var(--accent)'}"></i></div></div>`; }).join('') || '<p class="hint" style="margin:0">لا توجد مكافآت بعد. أضف مكافأة تُمنح عند الوصول لعدد من النقاط.</p>'}
            <form class="pr-rw-add" id="radd"><label class="sr" for="rwt">المكافأة</label><input id="rwt" placeholder="مكافأة جديدة (مثال: نزهة)" maxlength="60" required>
              <label class="sr" for="rwx">النقاط المطلوبة</label><input id="rwx" type="number" min="50" step="50" value="${Math.ceil((k.xp + 300) / 100) * 100}" required><button class="btn" type="submit">إضافة</button></form>
            <label class="gm-check"><input type="checkbox" id="pshow" ${p.hidden ? '' : 'checked'}> يظهر في لوحة الشرف (الاسم الأول والصورة فقط)</label>
          </div>
        </section>
        ${X ? X.kidHtml(p, parentPeriod) : ''}
        <section class="pr-danger">
          <span class="muted">نُسي الرقم السري لـ ${fn}؟ أعد تعيينه ويُختار رقم جديد عند الدخول التالي. الدرجات تبقى كما هي.</span>
          <div class="db-btns"><button type="button" class="btn ghost small" id="preset">إعادة تعيين الرقم السري</button><button type="button" class="btn danger small" id="pdel">حذف الطالب</button></div>
        </section>
        <div class="db-btns"><button type="button" class="btn ghost small" id="pchg">تغيير رقم ولي الأمر</button><button type="button" class="btn ghost small" id="pout">خروج ولي الأمر</button></div>
      </div>
    </div>`;
    bindParentHeader();
    const rerender = () => renderParent();
    app.querySelectorAll('[data-kid]').forEach(b => b.onclick = () => { parentKid = b.dataset.kid || null; if (X) X.view = null; rerender(); window.scrollTo(0, 0); });
    if (X) X.bindKid(p, rerender);
    app.querySelectorAll('[data-per]').forEach(b => b.onclick = () => { parentPeriod = +b.dataset.per; rerender(); });
    app.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { p.goal = +b.dataset.goal; NQ.persist(); NQ.toast('تم تحديث الهدف ✓'); rerender(); });
    document.getElementById('pshow').onchange = e => { p.hidden = !e.target.checked; NQ.persist(); scheduleSync(); NQ.toast(p.hidden ? 'لن يظهر في لوحة الشرف' : 'سيظهر في لوحة الشرف'); };
    document.getElementById('radd').onsubmit = e => {
      e.preventDefault(); const t = document.getElementById('rwt'), n = document.getElementById('rwx');
      p.rewards = p.rewards || []; p.rewards.push({ id: NQ.newId(), text: t.value.trim().slice(0, 60), xp: Math.max(50, +n.value || 100), created: Date.now() });
      checkRewards(p); NQ.persist(); rerender();
    };
    app.querySelectorAll('[data-rdel]').forEach(b => b.onclick = () => { p.rewards = (p.rewards || []).filter(r => r.id !== b.dataset.rdel); NQ.persist(); rerender(); });
    document.getElementById('preset').onclick = async () => {
      if (!(await NQ.ask(`إعادة تعيين الرقم السري لـ "${p.name}"؟ سيختار رقماً جديداً عند دخوله التالي، ودرجاته تبقى كما هي.`, 'إعادة التعيين'))) return;
      delete p.pinHash; NQ.persist(); NQ.toast('تمت إعادة التعيين ✓'); rerender();
    };
    document.getElementById('pdel').onclick = async () => {
      if (!(await NQ.ask(`حذف "${p.name}" وكل درجاته نهائياً؟ لا يمكن التراجع.`, 'حذف', true))) return;
      const st = NQ.store; if (window.NQFamily) window.NQFamily.forget(p.id); delete st.profiles[p.id]; if (st.current === p.id) st.current = null; parentKid = null; NQ.persist(); scheduleSync(); rerender();
    };
  }

  /* ================= احتفال ================= */
  function confetti() {
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { }
    const c = document.createElement('canvas'); c.className = 'gm-confetti'; c.setAttribute('aria-hidden', 'true');
    const W = c.width = innerWidth, H = c.height = innerHeight; document.body.appendChild(c);
    const x = c.getContext('2d'), cols = ['#0f766e', '#d97706', '#db2777', '#2563eb', '#15803d', '#facc15'];
    const P = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .4, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6 }));
    const t0 = performance.now();
    (function f(t) {
      const k = (t - t0) / 2600; x.clearRect(0, 0, W, H);
      P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); });
      if (k < 1) requestAnimationFrame(f); else c.remove();
    })(t0);
  }

  /* ================= دمج بيانات الحساب بين الأجهزة ================= */
  function mergeProfile(t, src) {
    ['badges', 'daily', 'duels', 'duelPaid', 'goalPaid'].forEach(k => { if (src[k]) t[k] = Object.assign({}, src[k], t[k] || {}); });
    if (src.bonus) { const seen = new Set((t.bonus || []).map(b => b.t + '|' + b.why)); t.bonus = (t.bonus || []).concat(src.bonus.filter(b => !seen.has(b.t + '|' + b.why))); }
    if (src.rewards && !t.rewards) t.rewards = src.rewards;
    ['team', 'goal', 'hidden'].forEach(k => { if (t[k] == null && src[k] != null) t[k] = src[k]; });
    if (window.NQP) window.NQP.merge(t, src);
    if (window.NQSchools) window.NQSchools.merge(t, src);
  }

  /* ================= التوجيه ================= */
  function route(h) {
    if (h === 'parent') { renderParent(); return true; }
    if (h === 'arena') { renderArena(); return true; }
    if (h === 'daily') { renderDaily(); return true; }
    if (h === 'duel') { renderDuelHome(); return true; }
    if (h.startsWith('duel-')) { renderDuel(cleanCode(h.slice(5))); return true; }
    if (h === 'teams') { renderTeams(); return true; }
    return false;
  }

  function init() {
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-cert]'); if (b) { const [s, u] = b.dataset.cert.split('|'); downloadCert(s, u); } });
    const p = N() && N().cur(); if (p) { awardBadges(p); }
    Backend.init().then(() => {
      scheduleSync();
      const h = location.hash.replace('#', '');
      if (/^(arena|daily|duel|teams)/.test(h)) N().route();
    });
  }

  window.NQGame = { init, route, xpFor, afterResult, resultExtras, homeExtras, unitBadge, mergeProfile, onPersist: () => scheduleSync(), backend: Backend, _levelOf: levelOf, _totalXp: totalXp, _leagueOf: leagueOf, _xpIn: xpIn, _weekKey: () => weekKey(), _goalOf: goalOf, _answeredOn: answeredOn, _today: today, renderAchievements };
})();
