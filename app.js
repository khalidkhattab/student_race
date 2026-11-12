/* منصة اختباراتي – منطق الموقع
   - المواد تأتي من ملفات data/*.js عبر window.SUBJECTS
   - الدرجات تُحفظ على الجهاز (localStorage)، وعند فتح الصفحة كرابط على claude.ai
     تُحفظ أيضاً في حساب الطالب (قاعدة بيانات خاصة بكل مستخدم) فتظهر على أي جهاز */
(function () {
  'use strict';

  const SUBJECTS = window.SUBJECTS || [];
  /* الصفوف تُستخرج من حقل grade في ملفات المواد، مرتبة من الأصغر للأكبر */
  const GRADE_ORDER = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'];
  const GRADES = (window.NQ_GRADES || [...new Set(SUBJECTS.map(s => s.grade))]).slice().sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b));
  const KEY_GRADE = 'nq_grade';
  let curGrade = (() => { try { const g = localStorage.getItem(KEY_GRADE); return GRADES.includes(g) ? g : GRADES[0]; } catch (e) { return GRADES[0]; } })();
  const subjLabel = s => s.name + ' – ' + s.grade;
  const COMING = [
    { name: 'الرياضيات', icon: '➗' },
    { name: 'العلوم', icon: '🔬' },
    { name: 'اللغة العربية', icon: '📖' },
    { name: 'اللغة الإنجليزية', icon: '🔤' },
    { name: 'التربية الإسلامية', icon: '🕌' }
  ];
  const EXAM_SIZE = 25;
  const SECS_PER_Q = 60; // الوقت المسموح لكل سؤال (العداد تنازلي)
  const MAX_RECORDS = 800;
  const KEY_REC = 'nq_records_v1', KEY_WRONG = 'nq_wrong_v1', KEY_NAME = 'nq_student'; // صيغة قديمة (طالب واحد)
  const KEY_STORE = 'nq_students_v2';

  /* ---------- التخزين: عدة طلاب على نفس الجهاز ----------
     store = { current: رقم الطالب الحالي, profiles: { رقم: { id, name, grade, records, wrong, created } } }
     كل طالب له سجله وأخطاؤه، و"current" خاص بهذا الجهاز فقط. */
  const local = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- المؤثرات الصوتية وقراءة الأسئلة (Web Audio & Speech) ---------- */
  const NQSound = (function () {
    let ctx = null;
    let enabled = (() => {
      try { return localStorage.getItem('nq_sound') !== '0'; } catch (e) { return true; }
    })();

    function getCtx() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function playTone(freq, type, duration, delay = 0, gainLevel = 0.15) {
      if (!enabled) return;
      try {
        const c = getCtx();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime + delay);
        gain.gain.setValueAtTime(gainLevel, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration);
      } catch (e) {}
    }

    return {
      get enabled() { return enabled; },
      set enabled(v) {
        enabled = !!v;
        try { localStorage.setItem('nq_sound', enabled ? '1' : '0'); } catch (e) {}
      },
      playCorrect() {
        playTone(659.25, 'sine', 0.12, 0, 0.18);
        playTone(880, 'sine', 0.22, 0.09, 0.22);
      },
      playWrong() {
        playTone(220, 'triangle', 0.24, 0, 0.16);
      },
      playWin() {
        playTone(523.25, 'triangle', 0.14, 0, 0.18);
        playTone(659.25, 'triangle', 0.14, 0.11, 0.18);
        playTone(783.99, 'triangle', 0.16, 0.22, 0.2);
        playTone(1046.5, 'sine', 0.45, 0.35, 0.25);
      },
      playTock() {
        playTone(750, 'sine', 0.04, 0, 0.08);
      },
      playChime() {
        playTone(587.33, 'sine', 0.25, 0, 0.2);
        playTone(880, 'sine', 0.45, 0.12, 0.22);
      },
      speak(text) {
        if (!window.speechSynthesis) return;
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'ar';
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        } catch (e) {}
      }
    };
  })();

  /* ---------- الوضع الليلي (Dark Mode) ---------- */
  const NQTheme = (function () {
    let theme = (() => {
      try {
        const saved = localStorage.getItem('nq_theme');
        if (saved) return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (e) { return 'light'; }
    })();

    function apply(t) {
      theme = t;
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('nq_theme', theme); } catch (e) {}
      updateBtn();
    }

    function updateBtn() {
      const b = document.getElementById('tb-theme');
      if (b) {
        b.textContent = theme === 'dark' ? '☀️' : '🌙';
        b.title = theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي';
      }
    }

    apply(theme);
    return {
      get current() { return theme; },
      toggle() { apply(theme === 'dark' ? 'light' : 'dark'); },
      updateBtn
    };
  })();

  function initTopbarTools() {
    const pBtn = document.getElementById('tb-pomo');
    if (pBtn) pBtn.onclick = () => openPomodoro();
    const sBtn = document.getElementById('tb-sound');
    const updateSoundBtn = () => {
      if (sBtn) {
        sBtn.textContent = NQSound.enabled ? '🔊' : '🔇';
        sBtn.title = NQSound.enabled ? 'المؤثرات الصوتية مفعلة' : 'المؤثرات الصوتية مكتومة';
      }
    };
    if (sBtn) {
      updateSoundBtn();
      sBtn.onclick = () => {
        NQSound.enabled = !NQSound.enabled;
        updateSoundBtn();
        toast(NQSound.enabled ? 'تم تفعيل الصوت 🔊' : 'تم كتم الصوت 🔇');
      };
    }
    const tBtn = document.getElementById('tb-theme');
    if (tBtn) {
      NQTheme.updateBtn();
      tBtn.onclick = () => {
        NQTheme.toggle();
        toast(NQTheme.current === 'dark' ? 'الوضع الليلي 🌙' : 'الوضع النهاري ☀️');
      };
    }
  }
  const normName = s => String(s || '').trim().replace(/\s+/g, ' ').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
  const gradeFromRecords = recs => { for (const r of recs || []) { const s = SUBJECTS.find(x => x.id === r.subjectId); if (s) return s.grade; } return null; };
  function mergeInto(t, src) {
    const ids = new Set(t.records.map(r => r.id));
    (src.records || []).forEach(r => { if (!ids.has(r.id)) t.records.push(r); });
    t.records.sort((a, b) => a.date - b.date);
    Object.keys(src.wrong || {}).forEach(k => { t.wrong[k] = [...new Set([...(t.wrong[k] || []), ...src.wrong[k]])]; });
    if (!t.name && src.name) t.name = src.name;
    if (!t.grade && src.grade) t.grade = src.grade;
    if (t.avatar == null && src.avatar != null) t.avatar = src.avatar;
    if (!t.pinHash && src.pinHash && src.id === t.id) t.pinHash = src.pinHash; // الرقم مشفّر برقم الطالب
    G('mergeProfile', t, src);
  }
  function findProfile(name, grade) {
    const n = normName(name);
    return Object.values(store.profiles).find(p => normName(p.name) === n && p.grade === grade) || null;
  }
  function addLegacy(d) { // يضم بيانات الصيغة القديمة (طالب واحد) كطالب في القائمة
    if (!d || !((d.records && d.records.length) || d.name)) return null;
    const grade = gradeFromRecords(d.records) || null;
    let p = d.name && grade ? findProfile(d.name, grade) : null;
    if (!p) { p = { id: newId(), name: d.name || 'طالب', grade, records: [], wrong: {}, created: Date.now() }; store.profiles[p.id] = p; }
    mergeInto(p, d);
    return p;
  }
  const store = local.get(KEY_STORE, null) || { current: null, profiles: {} };
  if (!local.get(KEY_STORE, null)) {
    addLegacy({ name: local.get(KEY_NAME, ''), records: local.get(KEY_REC, []), wrong: local.get(KEY_WRONG, {}) });
    local.set(KEY_STORE, store);
  }
  // الطالب صاحب الرقم السري يبقى مسجلاً فقط داخل نفس الجلسة (حتى يُغلق التبويب)
  const KEY_UNLOCK = 'nq_unlocked';
  (() => {
    const p = store.profiles[store.current];
    let ok = false; try { ok = sessionStorage.getItem(KEY_UNLOCK) === store.current; } catch (e) { }
    if (p && p.pinHash && !ok) store.current = null;
  })();
  const cur = () => store.profiles[store.current] || null;
  const state = {
    get name() { return cur() ? cur().name : ''; },
    get records() { return cur() ? cur().records : []; },
    set records(v) { if (cur()) cur().records = v; },
    get wrong() { return cur() ? cur().wrong : {}; },
    set wrong(v) { if (cur()) cur().wrong = v; }
  };
  let cloud = null;            // مرجع مستند الحساب في قاعدة البيانات (يحوي كل طلاب هذا الحساب)
  let writing = Promise.resolve();
  const records = () => state.records;
  const wrongBank = () => state.wrong;

  function persist() {
    Object.values(store.profiles).forEach(p => { if (p.records.length > MAX_RECORDS) p.records = p.records.slice(-MAX_RECORDS); });
    local.set(KEY_STORE, store);
    if (window.NQSchools) window.NQSchools.onPersist();
    if (!cloud) return;
    G('onPersist');
    const body = { v: 2, profiles: store.profiles, parent: store.parent || null, updated: Date.now() };
    writing = writing.then(() => cloud.set(body)).catch(e => {
      if (e && e.code === 'invalid_argument') { cloud = null; refreshSync(); }
    });
  }

  let cloudKind = null, cloudBusy = false, lastPull = 0;
  async function initCloud() {
    if (cloudBusy) return; cloudBusy = true;
    try {
      let ref = null;
      if (window.NQFamily && window.NQFamily.enabled()) { ref = window.NQFamily.ref(); cloudKind = 'family'; }
      else if (window.claude && typeof window.claude.use === 'function') {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return;
        const id = await user.id();
        if (!id) return;
        ref = db.doc('data/users/' + id + '/state'); cloudKind = 'claude';
      }
      if (!ref) return;
      const snap = await Promise.race([ref.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
      const d = snap.exists ? snap.data() : null;
      const before = JSON.stringify(store.profiles), beforeParent = JSON.stringify(store.parent || null);
      if (d && d.v === 2 && d.profiles) {
        Object.values(d.profiles).forEach(rp => {
          const p = store.profiles[rp.id] || findProfile(rp.name, rp.grade);
          if (p) mergeInto(p, rp);
          else store.profiles[rp.id] = Object.assign(JSON.parse(JSON.stringify(rp)), { created: rp.created || Date.now() });
        });
        if (d.parent && !store.parent) store.parent = d.parent;
      } else if (d) addLegacy(d);
      const first = !cloud;
      cloud = ref; lastPull = Date.now();
      local.set(KEY_STORE, store);
      const changed = JSON.stringify(store.profiles) !== before || JSON.stringify(store.parent || null) !== beforeParent;
      if (!d || d.v !== 2 || changed) persist();
      if ((first || changed) && !(quiz && !quiz.done)) route();
      refreshSync();
    } catch (e) { /* يبقى الحفظ على الجهاز فقط */ }
    finally { cloudBusy = false; }
  }
  // عند العودة للصفحة: جلب آخر تغييرات الأجهزة الأخرى في الأسرة
  const pullSoon = () => { if (cloudKind === 'family' && document.visibilityState !== 'hidden' && Date.now() - lastPull > 30000 && !(quiz && !quiz.done)) initCloud(); };
  document.addEventListener('visibilitychange', pullSoon);
  window.addEventListener('focus', pullSoon);
  function familyJoinDialog() {
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<form class="card" role="dialog" aria-modal="true" aria-labelledby="fjt">
      <h2 id="fjt">📱 ربط هذا الجهاز بحساب الأسرة</h2>
      <p class="sub" style="margin:0">اكتب كود الأسرة الموجود في «لوحة ولي الأمر» على الجهاز الآخر. ستظهر هنا كل حسابات الطلاب ودرجاتهم، وتُضم إليها حسابات هذا الجهاز.</p>
      <label class="sr" for="fjc">كود الأسرة</label>
      <input id="fjc" class="gm-code-in" dir="ltr" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" maxlength="30" required>
      <p class="err" id="fje" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost" data-x>إلغاء</button><button class="btn" type="submit">ربط ←</button></div></form>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('#fjc'); inp.focus();
    ov.querySelector('[data-x]').onclick = () => ov.remove();
    ov.querySelector('form').onsubmit = async e => {
      e.preventDefault(); const err = ov.querySelector('#fje'); err.textContent = '⏳ جارٍ الربط…';
      const r = await joinFamily(inp.value);
      if (r === 'ok') { ov.remove(); toast('تم ربط الجهاز بحساب الأسرة ✓'); route(); return; }
      err.textContent = r === 'short' ? 'الكود ناقص، اكتبه كاملاً.' : r === 'missing' ? 'لم نجد هذا الكود. تأكد منه.' : r === 'off' ? 'الربط غير متاح هنا.' : 'تعذّر الاتصال. حاول مرة أخرى.';
    };
  }
  function familyLinkJoin(code) {
    const F = window.NQFamily;
    if (!F || !F.enabled()) return toast('ربط الأسرة غير متاح في هذه النسخة');
    const c = F.clean(code);
    if (c.length < 16) return toast('رابط الربط غير صحيح');
    if (cloud && F.code() === c) return toast('هذا الجهاز مربوط بهذه الأسرة بالفعل ✓');
    document.querySelectorAll('.overlay.fam-link').forEach(x => x.remove());
    const ov = document.createElement('div'); ov.className = 'overlay fam-link';
    const mine = Object.values(store.profiles).length;
    ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="flt">
      <h2 id="flt">📱 ربط هذا الجهاز بحساب الأسرة؟</h2>
      <p class="sub" style="margin:0">ستظهر هنا حسابات الأبناء ودرجاتهم ولوحة ولي الأمر من الجهاز الذي أرسل الرابط.${mine ? ` والطلاب الموجودون على هذا الجهاز (${nf(mine)}) سيُضافون لنفس الأسرة.` : ''}</p>
      <p class="hint" style="margin:0">وافق فقط إذا وصلك الرابط من أحد أفراد أسرتك.</p>
      <p class="err" id="fle" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost" data-x>إلغاء</button><button type="button" class="btn" data-ok>نعم، اربط الجهاز</button></div></div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = () => ov.remove();
    const ok = ov.querySelector('[data-ok]'); ok.focus();
    ok.onclick = async () => {
      const err = ov.querySelector('#fle'); ok.disabled = true; err.textContent = '⏳ جارٍ الربط…';
      const r = await joinFamily(c);
      if (r === 'ok') { ov.remove(); toast('تم ربط الجهاز بحساب الأسرة ✓'); route(); return; }
      ok.disabled = false;
      err.textContent = r === 'missing' ? 'لم نجد هذه الأسرة. اطلب رابطاً جديداً.' : 'تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.';
    };
  }
  async function joinFamily(code) {
    const F = window.NQFamily; if (!F || !F.enabled()) return 'off';
    const c = F.clean(code); if (c.length < 16) return 'short';
    try { if (!(await F.exists(c))) return 'missing'; } catch (e) { return 'net'; }
    F.join(c); cloud = null; await initCloud(); return cloud ? 'ok' : 'net';
  }
  function refreshSync() {
    const el = document.getElementById('sync');
    if (el) el.textContent = cloud ? (cloudKind === 'family' ? '☁️ درجاتك محفوظة في حساب الأسرة وتظهر على كل أجهزتها' : '☁️ درجاتك محفوظة في حسابك وتظهر على أي جهاز') : '💾 درجاتك محفوظة على هذا الجهاز';
  }

  /* ---------- أدوات ---------- */
  const $app = document.getElementById('app');
  // نقطة الربط مع ملف المنافسة (game.js) – تعمل حتى لو لم يُحمّل الملف
  const G = (fn, ...a) => { const g = window.NQGame; try { return g && typeof g[fn] === 'function' ? g[fn](...a) : undefined; } catch (e) { console.error(e); return undefined; } };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const fmtDate = t => new Date(t).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  const round1 = n => Math.round(n * 10) / 10;
  const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  // نافذة تأكيد داخل الصفحة (بديل confirm)
  function ask(msg, okLabel, danger) {
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'overlay';
      ov.innerHTML = `<div class="card" role="dialog" aria-modal="true"><p style="margin:0 0 16px;font-weight:700">${esc(msg)}</p>
        <div class="actions"><button class="btn ghost" data-n>إلغاء</button><button class="btn ${danger ? 'danger-solid' : ''}" data-y>${esc(okLabel || 'نعم')}</button></div></div>`;
      const done = v => { ov.remove(); res(v); };
      ov.querySelector('[data-n]').onclick = () => done(false);
      ov.querySelector('[data-y]').onclick = () => done(true);
      ov.onclick = e => { if (e.target === ov) done(false); };
      document.body.appendChild(ov);
      ov.querySelector('[data-y]').focus();
    });
  }

  function gradeOf(p) {
    if (p >= 90) return { t: 'ممتاز', c: 'var(--ok)', cls: 'good' };
    if (p >= 80) return { t: 'جيد جداً', c: 'var(--brand)', cls: 'good' };
    if (p >= 65) return { t: 'جيد', c: 'var(--mid)', cls: 'mid' };
    if (p >= 50) return { t: 'مقبول', c: 'var(--accent)', cls: 'mid' };
    return { t: 'يحتاج مراجعة', c: 'var(--bad)', cls: 'low' };
  }
  const subjectById = id => SUBJECTS.find(s => s.id === id);
  function allQuestions(subject) {
    const out = [];
    subject.units.forEach(u => u.lessons.forEach(l => l.questions.forEach(q => out.push(q))));
    return out;
  }
  function bestFor(sid, key) {
    const r = records().filter(x => x.subjectId === sid && x.key === key);
    return r.length ? Math.max(...r.map(x => x.pct)) : null;
  }

  /* ---------- التصحيح ---------- */
  // توحيد إجابات «أكمل الفراغ»: الهمزات والتاء المربوطة والأرقام العربية والتشكيل والمسافات
  const normAns = s => String(s == null ? '' : s).trim().toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,]/g, '.').replace(/^ال(?=\S{3,})/, '')
    .replace(/[−–]/g, '-').replace(/(^|\s)-\s+/g, '$1-')
    .replace(/[\s_.،؛:!؟?"'()]+/g, ' ').replace(/(\S)-/g, '$1 ').trim();
  function scoreOf(q, resp) {
    if (resp == null) return 0;
    if (q.type === 'fill') {
      const r = normAns(resp); if (!r) return 0;
      // الإجابات الرقمية تُقبل مع وحدة بعدها (مثل 40 m أو 45°) أو بصيغة 40.0
      const numOf = x => { const m = /^(-?\d+(?: \d+)?)\s*([a-zء-ي/²³°%]{0,6}\s*[a-zء-ي/²³°%]{0,6})$/.exec(x); return m ? parseFloat(m[1].replace(' ', '.')) : null; };
      return q.answers.some(a => { const n = normAns(a); if (n === r) return true; const x = numOf(n), y = numOf(r); return x != null && y != null && Math.abs(x - y) < 1e-9; }) ? 1 : 0;
    }
    if (q.type === 'mcq') return resp === q.answer ? 1 : 0;
    if (q.type === 'multi') {
      const good = resp.filter(i => q.answers.includes(i)).length;
      const bad = resp.length - good;
      return Math.max(0, (good - bad) / q.answers.length);
    }
    if (q.type === 'match') {
      let ok = 0; q.items.forEach((it, i) => { if (resp[i] === it[1]) ok++; });
      return ok / q.items.length;
    }
    return 0;
  }
  function isAnswered(q, resp) {
    if (resp == null) return false;
    if (q.type === 'fill') return String(resp).trim().length > 0;
    if (q.type === 'multi') return resp.length > 0;
    if (q.type === 'match') return resp.every(v => v != null);
    return true;
  }
  function correctText(q) {
    if (q.type === 'fill') return q.answers[0];
    if (q.type === 'mcq') return q.options[q.answer];
    if (q.type === 'multi') return q.answers.map(i => q.options[i]).join('، ');
    return q.items.map(it => `${it[0]} ← ${q.categories[it[1]]}`).join(' · ');
  }
  function respText(q, r) {
    if (r == null) return 'لم تُجب';
    if (q.type === 'fill') return String(r).trim() || 'لم تُجب';
    if (q.type === 'mcq') return q.options[r];
    if (q.type === 'multi') return r.length ? r.map(i => q.options[i]).join('، ') : 'لم تُجب';
    return q.items.map((it, i) => r[i] === it[1] ? null : `${it[0]} ← ${r[i] == null ? '—' : q.categories[r[i]]}`).filter(Boolean).join(' · ');
  }

  /* ---------- الحالة ---------- */
  let quiz = null;
  let lastResult = null;
  let timerId = null;

  /* ---------- التوجيه (#home ، #subject-social ، #records ، #quiz ، #result) ---------- */
  function route() {
    let h = location.hash.replace(/^#/, '') || 'welcome';
    // رابط ربط الأسرة (#join-الكود): نخفي الكود من العنوان فوراً ثم نسأل قبل الربط
    if (h.startsWith('join-')) {
      const code = h.slice(5);
      history.replaceState(null, '', '#login'); lastHash = '#login'; h = 'login';
      setTimeout(() => familyLinkJoin(code), 0);
    }
    const welcome = h === 'welcome' && typeof window.WELCOME_HTML === 'function';
    document.body.classList.toggle('welcome-mode', welcome);
    if (welcome) { clearInterval(timerId); return renderWelcome(); }
    updateWho();
    // تحميل ملفات صف الطالب (أو كل صفوف الأبناء في لوحة ولي الأمر) عند الحاجة
    if (window.NQLoadGrade) {
      const need = [...new Set((h === 'parent' ? Object.values(store.profiles) : [cur()]).filter(Boolean).map(p => p.grade).filter(Boolean))].filter(g => !window.NQGradeReady(g));
      if (need.length) {
        clearInterval(timerId);
        $app.innerHTML = '<p class="empty">⏳ جارٍ تحميل المواد…</p>';
        Promise.all(need.map(window.NQLoadGrade)).then(() => route()).catch(() => { $app.innerHTML = '<p class="empty">⚠️ تعذّر تحميل المواد. تأكد من الاتصال ثم أعد تحميل الصفحة.</p>'; });
        return;
      }
    }
    if (h === 'parent') { clearInterval(timerId); return G('route', h); }
    if (h === 'reports' && window.NQReports) {
      clearInterval(timerId);
      let ok = false; try { ok = sessionStorage.getItem('nq_parent_unlocked') === '1'; } catch (e) { }
      if (!ok) { go('#parent'); return; }
      return window.NQReports.renderPage();
    }
    // المدارس والمعلمون ودعوات الفصول (لا تحتاج حساب طالب)
    if (window.NQSchools && /^(staff|admin|school-request|class-)/.test(h)) {
      clearInterval(timerId);
      document.querySelectorAll('[data-nav]').forEach(a => a.classList.remove('active'));
      if (window.NQSchools.route(h)) return;
    }
    if (h === 'login' || !cur()) {
      clearInterval(timerId);
      if (h !== 'login') { history.replaceState(null, '', '#login'); lastHash = '#login'; }
      document.querySelectorAll('[data-nav]').forEach(a => a.classList.remove('active'));
      return renderLogin();
    }
    if (curGrade !== cur().grade && !h.startsWith('subject-')) curGrade = cur().grade;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active',
      (a.dataset.nav === 'records' && h === 'records') || (a.dataset.nav === 'home' && (h === 'home' || h.startsWith('subject-'))) ||
      (a.dataset.nav === 'arena' && /^(arena|daily|duel|teams|badges)/.test(h))));
    clearInterval(timerId);
    if (h.startsWith('subject-') && subjectById(h.slice(8))) { renderSubject(subjectById(h.slice(8))); return wrapShell('subjects'); }
    if (h === 'subjects') { renderSubjectsPage(); return wrapShell('subjects'); }
    if (h === 'progress') { renderProgress(); return wrapShell('progress'); }
    if (h === 'records') { renderRecords(); return wrapShell('progress'); }
    if (h === 'achievements' || h === 'badges') { G('renderAchievements'); return wrapShell('achievements'); }
    if (G('route', h)) return wrapShell('arena');
    if (h === 'quiz' && quiz) return renderQuestion();
    if (h === 'result' && lastResult) return renderResult();
    renderHome(); wrapShell('home');
  }
  let lastHash = location.hash;
  window.addEventListener('hashchange', async () => {
    const target = location.hash;
    if (quiz && !quiz.done && lastHash === '#quiz' && target !== '#quiz') {
      history.replaceState(null, '', '#quiz');
      const ok = await ask('هل تريد الخروج من الاختبار؟ لن تُحفظ إجاباتك.', 'خروج', true);
      if (!ok) return;
      quiz = null;
      history.replaceState(null, '', target);
    }
    lastHash = location.hash;
    route();
    window.scrollTo(0, 0);
  });
  function go(h) {
    if (location.hash === h) { lastHash = h; route(); window.scrollTo(0, 0); }
    else location.hash = h;
  }

  /* ---------- شاشة الدخول ---------- */
  function renderWelcome() {
    const lessons = SUBJECTS.reduce((a, s) => a + s.units.reduce((b, u) => b + u.lessons.length, 0), 0);
    const questions = SUBJECTS.reduce((a, s) => a + allQuestions(s).length, 0);
    const tag = SUBJECTS.length === 1 ? `${SUBJECTS[0].name} · ${SUBJECTS[0].grade}` : GRADES.join(' · ');
    $app.innerHTML = window.WELCOME_HTML({ lessons, questions, tag: esc(tag) });
    if (typeof window.WELCOME_INIT === 'function') window.WELCOME_INIT($app);
  }

  /* ---------- الصورة الرمزية والرقم السري ---------- */
  const AVATARS = [
    ['🦁', '#d97706'], ['🐯', '#ea580c'], ['🐼', '#475569'], ['🐨', '#64748b'], ['🦊', '#c2410c'], ['🐻', '#92400e'],
    ['🐰', '#db2777'], ['🐱', '#ca8a04'], ['🐶', '#a16207'], ['🐵', '#78350f'], ['🦉', '#7c3aed'], ['🦅', '#0369a1'],
    ['🐬', '#0284c7'], ['🐢', '#15803d'], ['🦋', '#2563eb'], ['🐝', '#b45309'], ['🐞', '#dc2626'], ['🐙', '#be185d'],
    ['🦄', '#a21caf'], ['🐲', '#047857'], ['🚀', '#4338ca'], ['⚽', '#334155'], ['🎨', '#e11d48'], ['⭐', '#b45309']
  ];
  function avatarHtml(p, big) {
    const a = p && p.avatar != null ? AVATARS[p.avatar] : null;
    const cls = 'av' + (big ? ' big' : '');
    return a ? `<span class="${cls}" style="background:${a[1]}" aria-hidden="true">${a[0]}</span>`
      : `<span class="${cls}" aria-hidden="true">${esc(((p && p.name) || '؟').trim().charAt(0))}</span>`;
  }
  const avatarGrid = sel => `<div class="avatars" role="radiogroup" aria-label="الصور الرمزية">${AVATARS.map((a, i) =>
    `<button type="button" role="radio" class="avatar-opt${sel === i ? ' on' : ''}" aria-checked="${sel === i}" aria-label="الصورة ${i + 1}" data-av="${i}" style="--avc:${a[1]}">${a[0]}</button>`).join('')}</div>`;
  function bindAvatarGrid(root, onPick) {
    root.querySelectorAll('[data-av]').forEach(b => b.onclick = () => {
      root.querySelectorAll('[data-av]').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-checked', 'true'); onPick(+b.dataset.av);
    });
  }
  async function hashPin(pid, pin) {
    const txt = 'nq|' + pid + '|' + pin;
    try {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    } catch (e) { let h = 5381; for (const c of txt) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'd' + (h >>> 0).toString(16); }
  }
  const validPin = s => /^[0-9]{4}$/.test(s);
  const weakPin = s => /^(\d)\1{3}$/.test(s) || s === '1234' || s === '4321';
  const pinInput = (id, label) => `<label class="pin-lbl" for="${id}">${label}</label>
    <input id="${id}" class="pin-in" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••">`;
  const digitsOnly = el => el.addEventListener('input', () => {
    el.value = el.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g, '').slice(0, 4);
  });
  let pinFails = 0, pinLockUntil = 0;

  const pinBoxesHtml = (idPrefix, label) => `
    <div class="pin-box-wrap" id="${idPrefix}-wrap">
      ${label ? `<label class="pin-lbl">${label}</label>` : ''}
      <div class="pin-boxes" dir="ltr">
        <input type="password" inputmode="numeric" maxlength="1" class="pin-digit" id="${idPrefix}-0" data-idx="0" autocomplete="off" aria-label="الرقم الأول">
        <input type="password" inputmode="numeric" maxlength="1" class="pin-digit" id="${idPrefix}-1" data-idx="1" autocomplete="off" aria-label="الرقم الثاني">
        <input type="password" inputmode="numeric" maxlength="1" class="pin-digit" id="${idPrefix}-2" data-idx="2" autocomplete="off" aria-label="الرقم الثالث">
        <input type="password" inputmode="numeric" maxlength="1" class="pin-digit" id="${idPrefix}-3" data-idx="3" autocomplete="off" aria-label="الرقم الرابع">
      </div>
      <input type="hidden" id="${idPrefix}" value="">
    </div>`;

  function bindPinBoxes(root, idPrefix, onComplete) {
    const wrap = root.querySelector('#' + idPrefix + '-wrap');
    if (!wrap) return null;
    const inputs = [0, 1, 2, 3].map(i => wrap.querySelector('#' + idPrefix + '-' + i));
    const hidden = wrap.querySelector('#' + idPrefix);
    const getVal = () => inputs.map(el => el.value).join('');
    const sync = () => {
      const v = getVal();
      if (hidden) hidden.value = v;
      inputs.forEach(el => el.classList.toggle('filled', el.value !== ''));
      return v;
    };
    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        let v = inp.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g, '');
        if (v.length > 1) v = v.slice(-1);
        inp.value = v;
        const total = sync();
        if (v && idx < 3) { inputs[idx + 1].focus(); inputs[idx + 1].select(); }
        if (total.length === 4 && onComplete) onComplete(total);
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
          if (!inp.value && idx > 0) {
            inputs[idx - 1].value = '';
            inputs[idx - 1].focus();
            sync();
            e.preventDefault();
          } else {
            inp.value = '';
            sync();
          }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          inputs[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < 3) {
          inputs[idx + 1].focus();
        }
      });
      inp.addEventListener('paste', e => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g, '').slice(0, 4);
        digits.split('').forEach((d, i) => { if (inputs[i]) inputs[i].value = d; });
        const total = sync();
        const nextIdx = Math.min(digits.length, 3);
        if (inputs[nextIdx]) inputs[nextIdx].focus();
        if (total.length === 4 && onComplete) onComplete(total);
      });
    });
    return {
      get value() { return getVal(); },
      clear() {
        inputs.forEach(el => { el.value = ''; el.classList.remove('ok', 'filled'); });
        sync();
        if (inputs[0]) inputs[0].focus();
      },
      setOk() { inputs.forEach(el => el.classList.add('ok')); },
      setDigit(d) {
        const empty = inputs.find(el => !el.value);
        if (empty) {
          empty.value = d;
          const idx = inputs.indexOf(empty);
          if (idx < 3) inputs[idx + 1].focus();
          const total = sync();
          if (total.length === 4 && onComplete) onComplete(total);
        }
      },
      backspace() {
        for (let i = 3; i >= 0; i--) {
          if (inputs[i].value) {
            inputs[i].value = '';
            inputs[i].focus();
            sync();
            break;
          }
        }
      }
    };
  }

  const numpadHtml = () => `
    <div class="pin-numpad" dir="ltr" aria-label="لوحة الأرقام">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="num-key" data-k="${n}">${n}</button>`).join('')}
      <button type="button" class="num-key fn" data-k="clear" aria-label="مسح الكل">مسح</button>
      <button type="button" class="num-key" data-k="0">0</button>
      <button type="button" class="num-key fn" data-k="back" aria-label="حذف">⌫</button>
    </div>`;

  // نافذة إدخال الرقم السري ← true إذا كان صحيحاً
  function pinPrompt(p, title) {
    return new Promise(res => {
      if (document.querySelector('.pin-card')) return res(false); // نافذة رقم سري مفتوحة بالفعل
      const ov = document.createElement('div'); ov.className = 'overlay';
      ov.innerHTML = `<form class="card pin-card" role="dialog" aria-modal="true" aria-labelledby="pin-t" autocomplete="off">
        ${avatarHtml(p, true)}
        <h2 id="pin-t">${esc(title || 'أهلاً يا ' + p.name)}</h2>
        ${pinBoxesHtml('pin1', 'اكتب رقمك السري (4 أرقام)')}
        ${numpadHtml()}
        <p class="err" id="pin-err" role="alert"></p>
        <div class="actions"><button type="button" class="btn ghost" data-n>إلغاء</button><button type="submit" class="btn">دخول</button></div>
        <button type="button" class="linkish" data-forgot>نسيت رقمي السري</button>
      </form>`;
      const done = v => { ov.remove(); res(v); };
      const f = ov.querySelector('form'), err = ov.querySelector('#pin-err');
      let checking = false;

      const checkPin = async val => {
        if (checking) return;
        if (Date.now() < pinLockUntil) { err.textContent = `محاولات كثيرة. انتظر ${Math.ceil((pinLockUntil - Date.now()) / 1000)} ثانية.`; return; }
        if (!validPin(val)) { err.textContent = 'الرقم السري 4 أرقام.'; return; }
        checking = true;
        if ((await hashPin(p.id, val)) === p.pinHash) {
          pinFails = 0;
          boxes.setOk();
          setTimeout(() => done(true), 160);
          return;
        }
        checking = false;
        pinFails++;
        boxes.clear();
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        if (pinFails >= 5) { pinLockUntil = Date.now() + 30000; pinFails = 0; err.textContent = 'رقم خاطئ 5 مرات. انتظر 30 ثانية.'; }
        else err.textContent = 'الرقم السري غير صحيح، حاول مرة أخرى.';
      };

      const boxes = bindPinBoxes(ov, 'pin1', checkPin);

      ov.querySelectorAll('.num-key').forEach(b => b.onclick = () => {
        const k = b.dataset.k;
        if (k === 'clear') boxes.clear();
        else if (k === 'back') boxes.backspace();
        else boxes.setDigit(k);
      });

      ov.querySelector('[data-n]').onclick = () => done(false);
      ov.onclick = e => { if (e.target === ov) done(false); };
      ov.querySelector('[data-forgot]').onclick = async () => {
        ov.remove();
        if (store.parent && store.parent.pinHash) { toast('اطلب من ولي أمرك إعادة تعيين رقمك من صفحة ولي الأمر 👨‍👩‍👧'); return res(false); }
        const ok = await ask(`لا يمكن معرفة الرقم القديم. هل تريد إعادة تعيين الرقم السري لـ "${p.name}"؟ ستبقى درجاته كما هي. (افعل ذلك بحضور ولي الأمر)`, 'إعادة التعيين', true);
        if (ok) { delete p.pinHash; persist(); renderSetup({ existing: p.id, name: p.name, grade: p.grade, avatar: p.avatar }); }
        res(false);
      };
      f.onsubmit = e => {
        e.preventDefault();
        checkPin(boxes.value);
      };
      document.body.appendChild(ov);
      const firstInp = ov.querySelector('#pin1-0');
      if (firstInp) firstInp.focus();
    });
  }

  /* ---------- اسم الطالب في الشريط العلوي ---------- */
  function updateWho() {
    let a = document.getElementById('who');
    const nav = document.querySelector('.topbar nav');
    if (!a && nav) { a = document.createElement('a'); a.id = 'who'; a.className = 'who'; a.href = '#login'; nav.appendChild(a); }
    if (!a) return;
    const p = cur();
    const em = p && p.avatar != null ? AVATARS[p.avatar][0] : '👤';
    if (p && p.isGuest) {
      a.textContent = '⭐ زائر';
      a.title = 'حساب تجريبي (زائر) · اضغط للتسجيل أو التبديل';
    } else {
      a.textContent = p ? em + ' ' + p.name : '👤 تسجيل الدخول';
      a.title = p ? 'تبديل الطالب' : 'تسجيل الدخول';
    }
    a.setAttribute('aria-label', p ? `الطالب الحالي ${p.name}، اضغط للتبديل` : 'تسجيل الدخول');
  }

  /* ---------- تسجيل الدخول: الصف ← الاسم ← الصورة والرقم السري ---------- */
  let loginGrade = null;
  function selectProfile(p) {
    loginNew = false; loginManage = false;
    store.current = p.id;
    curGrade = p.grade;
    try { localStorage.setItem(KEY_GRADE, curGrade); } catch (e) { }
    try { sessionStorage.setItem(KEY_UNLOCK, p.id); } catch (e) { }
    persist(); updateWho();
    toast('أهلاً يا ' + p.name + ' 👋');
    go('#home');
  }
  function logout() {
    store.current = null;
    try { sessionStorage.removeItem(KEY_UNLOCK); } catch (e) { }
    persist(); updateWho(); loginGrade = null; loginNew = false; loginManage = false;
    go('#login');
  }
  async function enterProfile(p) {
    if (!p.pinHash) return renderSetup({ existing: p.id, name: p.name, grade: p.grade, avatar: p.avatar });
    if (await pinPrompt(p)) selectProfile(p);
  }

  let loginNew = false, loginManage = false;
  let wizStep = 1; // 1: الصف والاسم، 2: الصورة الرمزية، 3: الرقم السري
  let wizData = { name: '', grade: null, avatar: null };

  function loginAsGuest(grade) {
    const g = grade || loginGrade || 'الصف الثامن';
    const gid = 'guest';
    store.profiles[gid] = {
      id: gid,
      name: 'زائر',
      grade: g,
      avatar: 23, // Star avatar ⭐
      isGuest: true,
      records: [],
      wrong: {},
      created: Date.now()
    };
    store.current = gid;
    curGrade = g;
    try { localStorage.setItem(KEY_GRADE, curGrade); } catch (e) { }
    persist();
    updateWho();
    toast('أهلاً بك كزائر! يمكنك تصفح واختبار أي مادة 🌟');
    go('#subjects');
  }

  // إنشاء حساب جديد، أو إكمال حساب قديم ليس له رقم سري
  function renderSetup(d) {
    let av = d.avatar != null ? d.avatar : null;
    $app.innerHTML = `
      <section class="login">
        <h1>${d.existing ? 'أكمل حسابك' : 'أنشئ حسابك'} يا ${esc(d.name)}</h1>
        <p class="sub">${esc(d.grade)} — اختر صورتك ورقماً سرياً حتى لا يدخل أحد غيرك إلى درجاتك.</p>
        <form id="sf" autocomplete="off">
          <div class="card step">
            <h2><span class="stepn">1</span> اختر صورتك</h2>
            ${avatarGrid(av)}
          </div>
          <div class="card step">
            <h2><span class="stepn">2</span> اختر رقمك السري (4 أرقام)</h2>
            <div class="pin-row" style="justify-content:center">
              <div>${pinBoxesHtml('sp1', 'الرقم السري')}</div>
              <div>${pinBoxesHtml('sp2', 'تأكيد الرقم')}</div>
            </div>
            <p class="hint" style="text-align:center">احفظه جيداً ولا تخبر به أحداً غير ولي أمرك.</p>
            <p class="err" id="serr" role="alert"></p>
            <div class="actions" style="justify-content:center;margin-top:14px">
              <button class="btn" type="submit">${d.existing ? 'حفظ والدخول' : 'إنشاء الحساب والدخول'} ←</button>
              <button class="btn ghost" type="button" id="sback">رجوع</button>
            </div>
          </div>
        </form>
      </section>`;
    bindAvatarGrid($app, i => { av = i; });
    const b1 = bindPinBoxes($app, 'sp1');
    const b2 = bindPinBoxes($app, 'sp2');
    document.getElementById('sback').onclick = () => renderLogin();
    document.getElementById('sf').onsubmit = async e => {
      e.preventDefault();
      const err = document.getElementById('serr');
      const v1 = b1.value, v2 = b2.value;
      if (av == null) { err.textContent = 'اختر صورة رمزية.'; return; }
      if (!validPin(v1)) { err.textContent = 'الرقم السري يجب أن يكون 4 أرقام.'; return; }
      if (v1 !== v2) { err.textContent = 'الرقمان غير متطابقين.'; b2.clear(); return; }
      if (weakPin(v1)) { err.textContent = 'هذا الرقم سهل التخمين، اختر رقماً آخر.'; return; }
      let p = d.existing ? store.profiles[d.existing] : null;
      if (!p) { p = { id: newId(), name: d.name, grade: d.grade, records: [], wrong: {}, created: Date.now() }; store.profiles[p.id] = p; }
      p.avatar = av;
      p.pinHash = await hashPin(p.id, v1);
      selectProfile(p);
    };
  }

  // شاشة الدخول: صور طلاب الجهاز أولاً، ومربع «طالب جديد» يفتح خطوة الصف والاسم
  const TILE_COLORS = ['#0f766e', '#c2620a', '#2563eb', '#7c3aed', '#be185d', '#15803d', '#b45309', '#0369a1'];
  const lockIcon = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  function tileFace(p, i) {
    const a = p.avatar != null ? AVATARS[p.avatar] : null;
    return a ? `<span class="lg-face" style="background:${a[1]}" aria-hidden="true">${a[0]}</span>`
      : `<span class="lg-face" style="background:${TILE_COLORS[i % TILE_COLORS.length]}" aria-hidden="true">${esc((p.name || '؟').trim().charAt(0))}</span>`;
  }

  function renderLogin() {
    const people = Object.values(store.profiles).filter(p => !p.isGuest && GRADES.includes(p.grade))
      .sort((a, b) => (b.records.length ? b.records[b.records.length - 1].date : b.created) - (a.records.length ? a.records[a.records.length - 1].date : a.created));
    const noGrade = Object.values(store.profiles).filter(p => !p.isGuest && !GRADES.includes(p.grade));
    const showNew = loginNew || !people.length;
    if (!loginGrade) loginGrade = cur() && !cur().isGuest ? cur().grade : (people[0] ? people[0].grade : GRADES[0]);
    if (!wizData.grade) wizData.grade = loginGrade;
    const fam = window.NQFamily && window.NQFamily.enabled(), staff = window.NQSchools && window.NQSchools.enabled();
    const g = gx();

    $app.innerHTML = `
      <section class="lg-page">
        <h1 class="lg-title">${people.length ? 'من سيذاكر الآن؟' : 'أهلاً بك في قِمّة! لنبدأ'}</h1>
        ${people.length ? `<div class="lg-tiles${loginManage ? ' manage' : ''}">
          ${people.map((p, i) => {
            const xp = g ? g._totalXp(p) : 0, L = g ? g._levelOf(xp) : null;
            const isRecent = i === 0 && people.length > 1;
            const a = p.avatar != null ? AVATARS[p.avatar] : null;
            return `<div class="lg-tile-wrap">
              <button type="button" class="lg-tile${cur() && cur().id === p.id ? ' on' : ''}" data-pick="${p.id}" style="${a ? `--av-glow:${a[1]}44` : ''}">
                ${isRecent ? '<span class="lg-badge-recent">آخر نشاط</span>' : ''}
                ${tileFace(p, i)}
                <b>${esc(p.name)}</b>
                <small>${esc(p.grade)}${p.pinHash ? ' · ' + lockIcon : ''}</small>
                <span class="lg-stat">${L ? `${L.icon} ${esc(L.name)}` : `${nf(p.records.length)} اختبار`}</span>
              </button>
              ${loginManage ? `<button type="button" class="lg-del" data-del="${p.id}" aria-label="حذف ${esc(p.name)} من هذا الجهاز">حذف</button>` : ''}
            </div>`;
          }).join('')}
          ${loginManage ? '' : `<button type="button" class="lg-tile lg-new${showNew ? ' on' : ''}" id="lg-new" aria-expanded="${showNew}"><span class="lg-face add" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span><b>طالب جديد</b><small>خطوات سهلة</small></button>`}
        </div>` : ''}

        ${showNew && !loginManage ? `<div class="card lg-newcard">
          <div class="wiz-stepper">
            <span class="wiz-step ${wizStep === 1 ? 'on' : 'done'}">${wizStep > 1 ? '✓' : '①'} الصف والاسم</span>
            <span class="wiz-step ${wizStep === 2 ? 'on' : wizStep > 2 ? 'done' : ''}">${wizStep > 2 ? '✓' : '②'} صورتك الرمزية</span>
            <span class="wiz-step ${wizStep === 3 ? 'on' : ''}">③ رقمك السري</span>
          </div>

          ${wizStep === 1 ? `
            <h2>${people.length ? 'طالب جديد' : 'اختر صفك واكتب اسمك'}</h2>
            <div class="grade-tabs" role="radiogroup" aria-label="الصف الدراسي">
              ${GRADES.map(gr => `<button type="button" role="radio" class="grade-tab${gr === loginGrade ? ' on' : ''}" aria-checked="${gr === loginGrade}" data-lg="${esc(gr)}">${esc(gr)}</button>`).join('')}
            </div>
            <form id="lf" class="name-row" autocomplete="off">
              <label for="nm" class="sr">اسم الطالب</label>
              <input id="nm" value="${esc(wizData.name || '')}" placeholder="${loginGrade ? 'اكتب اسمك هنا' : 'اختر صفك أولاً'}" maxlength="30" required ${loginGrade ? '' : 'disabled'}>
              <button class="btn" type="submit" ${loginGrade ? '' : 'disabled'}>متابعة: صورتك ←</button>
            </form>
            <p class="err" id="lerr" role="alert"></p>
            <div class="lg-guest-wrap">
              <button type="button" class="lg-guest-btn" id="lg-guest">🚀 تجربة المنصة كزائر (بدون تسجيل)</button>
            </div>
          ` : ''}

          ${wizStep === 2 ? `
            <div class="wiz-preview">
              <span>الصف: <b>${esc(wizData.grade)}</b></span>
              <span>الطالب: <b>${esc(wizData.name)}</b></span>
            </div>
            <h2>اختر صورتك الرمزية</h2>
            ${avatarGrid(wizData.avatar)}
            <div class="actions" style="margin-top:14px;justify-content:space-between">
              <button type="button" class="btn ghost" id="wiz-b1">← رجوع</button>
              <button type="button" class="btn" id="wiz-n2" ${wizData.avatar != null ? '' : 'disabled'}>متابعة: الرقم السري ←</button>
            </div>
          ` : ''}

          ${wizStep === 3 ? `
            <div class="wiz-preview">
              ${wizData.avatar != null ? avatarHtml({ avatar: wizData.avatar, name: wizData.name }) : ''}
              <div><b>${esc(wizData.name)}</b><small class="muted" style="display:block">${esc(wizData.grade)}</small></div>
            </div>
            <h2>اختر رقمك السري (4 أرقام)</h2>
            <p class="hint">لحماية درجاتك ومستواك على هذا الجهاز حتى لا يدخل أحد غيرك.</p>
            <form id="wiz-f3" autocomplete="off">
              <div class="pin-row" style="justify-content:center">
                <div>${pinBoxesHtml('wz-p1', 'الرقم السري')}</div>
                <div>${pinBoxesHtml('wz-p2', 'تأكيد الرقم')}</div>
              </div>
              <p class="err" id="wiz-err" role="alert"></p>
              <div class="actions" style="margin-top:14px;justify-content:space-between">
                <button type="button" class="btn ghost" id="wiz-b2">← رجوع</button>
                <button type="submit" class="btn">إنشاء الحساب والبدء 🚀</button>
              </div>
            </form>
          ` : ''}
        </div>` : ''}

        ${noGrade.length ? `<div class="card lg-newcard">
          <h2>سجلات قديمة بدون صف</h2>
          <p class="hint">افتح «طالب جديد» واختر الصف، ثم اضغط على الاسم لنقله إلى ${loginGrade ? esc(loginGrade) : 'الصف المختار'}:</p>
          <div class="people">${noGrade.map(p => `<div class="person"><button type="button" class="pick" data-move="${p.id}" ${loginGrade ? '' : 'disabled'}>${avatarHtml(p)}<span><b>${esc(p.name)}</b><small>${p.records.length} اختبار</small></span></button></div>`).join('')}</div>
        </div>` : ''}

        <div class="lg-gateways">
          <div class="lg-gw-card parent">
            <div class="lg-gw-ic">👨‍👩‍👧</div>
            <div>
              <b>بوابة ولي الأمر</b>
              <small>متابعة مستوى الأبناء وتقارير الإنجاز</small>
            </div>
            <a href="#parent" class="btn sm ghost">دخول ولي الأمر ←</a>
          </div>
          ${staff ? `
          <div class="lg-gw-card staff">
            <div class="lg-gw-ic">🏫</div>
            <div>
              <b>بوابة المعلمين والمدارس</b>
              <small>إدارة الفصول والأسئلة الشائعة</small>
            </div>
            <a href="#staff" class="btn sm ghost">دخول المعلم ←</a>
          </div>` : ''}
        </div>

        <p class="lg-foot">لكل طالب صورته ورقمه السري${fam ? ' · <button type="button" class="linkish" id="fam-join">ربط هذا الجهاز بحساب الأسرة</button>' : ''}${people.length ? ` · <button type="button" class="linkish" id="lg-manage">${loginManage ? 'تم' : 'إدارة الطلاب'}</button>` : ''}</p>
      </section>`;

    const nb = document.getElementById('lg-new');
    if (nb) nb.onclick = () => {
      loginNew = !loginNew;
      wizStep = 1;
      renderLogin();
      const i = document.getElementById('nm');
      if (i && loginNew) i.focus();
    };

    const mg = document.getElementById('lg-manage');
    if (mg) mg.onclick = () => { loginManage = !loginManage; loginNew = false; renderLogin(); };

    $app.querySelectorAll('[data-lg]').forEach(b => b.onclick = () => {
      loginGrade = b.dataset.lg;
      wizData.grade = loginGrade;
      loginNew = true;
      renderLogin();
      const i = document.getElementById('nm');
      if (i) i.focus();
    });

    $app.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => enterProfile(store.profiles[b.dataset.pick]));
    const fj = document.getElementById('fam-join'); if (fj) fj.onclick = () => familyJoinDialog();
    $app.querySelectorAll('[data-move]').forEach(b => b.onclick = () => {
      const p = store.profiles[b.dataset.move]; p.grade = loginGrade; persist(); enterProfile(p);
    });

    $app.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const p = store.profiles[b.dataset.del];
      if (p.pinHash && !(await pinPrompt(p, 'لحذف "' + p.name + '" اكتب رقمه السري'))) return;
      if (!(await ask(`سيتم حذف "${p.name}" وكل درجاته وأخطائه نهائياً. هل أنت متأكد؟`, 'حذف الطالب', true))) return;
      delete store.profiles[p.id];
      if (store.current === p.id) store.current = null;
      if (!Object.keys(store.profiles).length) loginManage = false;
      persist(); updateWho(); renderLogin(); toast('تم حذف الطالب');
    });

    // أحداث معالج إنشاء طالب جديد
    const guestBtn = document.getElementById('lg-guest');
    if (guestBtn) guestBtn.onclick = () => loginAsGuest(loginGrade);

    const f1 = document.getElementById('lf');
    if (f1) f1.onsubmit = e => {
      e.preventDefault();
      const name = document.getElementById('nm').value.trim().replace(/\s+/g, ' ');
      const err = document.getElementById('lerr');
      if (name.length < 2) { err.textContent = 'اكتب اسمك (حرفين على الأقل).'; return; }
      const p = findProfile(name, loginGrade);
      if (p) return enterProfile(p);
      wizData.name = name;
      wizData.grade = loginGrade;
      wizStep = 2;
      renderLogin();
    };

    if (wizStep === 2) {
      bindAvatarGrid($app, i => {
        wizData.avatar = i;
        const n2 = document.getElementById('wiz-n2');
        if (n2) n2.disabled = false;
      });
      const b1 = document.getElementById('wiz-b1');
      if (b1) b1.onclick = () => { wizStep = 1; renderLogin(); };
      const n2 = document.getElementById('wiz-n2');
      if (n2) n2.onclick = () => {
        if (wizData.avatar != null) { wizStep = 3; renderLogin(); }
      };
    }

    if (wizStep === 3) {
      const wb1 = bindPinBoxes($app, 'wz-p1');
      const wb2 = bindPinBoxes($app, 'wz-p2');
      const b2 = document.getElementById('wiz-b2');
      if (b2) b2.onclick = () => { wizStep = 2; renderLogin(); };
      const f3 = document.getElementById('wiz-f3');
      if (f3) f3.onsubmit = async e => {
        e.preventDefault();
        const err = document.getElementById('wiz-err');
        const v1 = wb1.value, v2 = wb2.value;
        if (!validPin(v1)) { err.textContent = 'الرقم السري يجب أن يكون 4 أرقام.'; return; }
        if (v1 !== v2) { err.textContent = 'الرقمان غير متطابقين.'; wb2.clear(); return; }
        if (weakPin(v1)) { err.textContent = 'هذا الرقم سهل التخمين، اختر رقماً آخر.'; return; }
        const p = { id: newId(), name: wizData.name, grade: wizData.grade, avatar: wizData.avatar, records: [], wrong: {}, created: Date.now() };
        p.pinHash = await hashPin(p.id, v1);
        store.profiles[p.id] = p;
        wizStep = 1; wizData = { name: '', grade: null, avatar: null }; loginNew = false;
        selectProfile(p);
      };
    }
  }

  /* ---------- تعديل ملفي: الصورة والرقم السري ---------- */
  function editProfile() {
    const p = cur(); if (!p) return;
    let av = p.avatar != null ? p.avatar : null;
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<form class="card edit-card" role="dialog" aria-modal="true" aria-labelledby="ed-t" autocomplete="off">
      <h2 id="ed-t">تعديل ملفي</h2>
      <h3>صورتي</h3>
      ${avatarGrid(av)}
      <h3>تغيير الرقم السري <small>(اتركه فارغاً إذا لا تريد تغييره)</small></h3>
      <div class="pin-row">
        <div>${pinInput('ep1', 'الرقم الجديد')}</div>
        <div>${pinInput('ep2', 'أعد الرقم الجديد')}</div>
      </div>
      <h3>للحفظ</h3>
      <div class="pin-row"><div>${pinInput('ep0', 'اكتب رقمك السري الحالي')}</div></div>
      <p class="err" id="ed-err" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost" data-n>إلغاء</button><button type="submit" class="btn">حفظ</button></div>
    </form>`;
    const done = () => ov.remove();
    bindAvatarGrid(ov, i => { av = i; });
    const e0 = ov.querySelector('#ep0'), e1 = ov.querySelector('#ep1'), e2 = ov.querySelector('#ep2');
    [e0, e1, e2].forEach(digitsOnly);
    const err = ov.querySelector('#ed-err');
    ov.querySelector('[data-n]').onclick = done;
    ov.onclick = e => { if (e.target === ov) done(); };
    ov.querySelector('form').onsubmit = async e => {
      e.preventDefault();
      if (p.pinHash && (await hashPin(p.id, e0.value)) !== p.pinHash) { err.textContent = 'اكتب رقمك السري الحالي الصحيح للحفظ.'; e0.focus(); return; }
      if (e1.value || e2.value) {
        if (!validPin(e1.value)) { err.textContent = 'الرقم الجديد يجب أن يكون 4 أرقام.'; return; }
        if (e1.value !== e2.value) { err.textContent = 'الرقمان الجديدان غير متطابقين.'; return; }
        if (weakPin(e1.value)) { err.textContent = 'هذا الرقم سهل التخمين، اختر رقماً آخر.'; return; }
        p.pinHash = await hashPin(p.id, e1.value);
      }
      p.avatar = av;
      persist(); updateWho(); done(); route(); toast('تم حفظ ملفك ✓');
    };
    document.body.appendChild(ov);
  }

  /* ---------- حسابات مشتركة لصفحات الطالب ----------
     مستوى المادة = متوسط أفضل درجة في كل درس/اختبار شامل حلّه الطالب فيها.
     المستوى العام = متوسط مستويات المواد التي بدأها الطالب. */
  function subjectStats(s, recsIn) {
    const recs = (recsIn || records()).filter(r => r.subjectId === s.id);
    const best = {};
    recs.forEach(r => { if (r.key !== 'mistakes' && r.key !== 'srs') best[r.key] = Math.max(best[r.key] == null ? 0 : best[r.key], r.pct); });
    const lessons = [];
    s.units.forEach(u => u.lessons.forEach(l => lessons.push({ key: u.id + '/' + l.id, unit: u, lesson: l })));
    const done = lessons.filter(x => best[x.key] != null).length;
    const vals = Object.values(best);
    const level = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    const weak = lessons.filter(x => best[x.key] != null && best[x.key] < 65).map(x => ({ s, key: x.key, name: x.lesson.name, unit: x.unit, pct: best[x.key] }));
    return { recs, best, lessons, level, done, total: lessons.length, weak, wrong: (wrongBank()[s.id] || []).length, last: recs[recs.length - 1] || null };
  }
  function streakDays(recs) {
    const days = new Set(recs.map(r => new Date(r.date).toDateString()));
    let n = 0; const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const levelColor = p => p == null ? 'var(--muted)' : gradeOf(p).c;
  const shortDate = t => new Date(t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
  const nf = n => Number(n || 0).toLocaleString('ar-EG');
  const gradeSubjects = () => SUBJECTS.filter(s => s.grade === curGrade);
  const gx = () => window.NQGame || null;

  /* ---------- الإطار: قائمة جانبية لصفحات الطالب ---------- */
  const IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    subjects: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    achievements: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
    arena: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'
  };
  const icon = k => `<svg class="sb-ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
  function wrapShell(active) {
    const p = cur(); if (!p) return;
    const g = gx(), xp = g ? g._totalXp(p) : 0, L = g ? g._levelOf(xp) : null;
    const frag = document.createDocumentFragment();
    while ($app.firstChild) frag.appendChild($app.firstChild);
    const link = (k, href, t) => `<a class="sb-a${active === k ? ' on' : ''}" href="${href}" ${active === k ? 'aria-current="page"' : ''}>${icon(k)}<span>${t}</span></a>`;
    $app.innerHTML = `<div class="shell">
      <nav class="sb" aria-label="أقسام صفحة الطالب">
        <div class="sb-me">${avatarHtml(p)}<div><b>${esc(p.name)}</b><small>${esc(p.grade)}${L ? ' · ' + L.icon + ' ' + esc(L.name) : ''}</small></div></div>
        <div class="sb-links">
          ${link('home', '#home', 'الرئيسية')}${link('subjects', '#subjects', 'موادي')}${link('progress', '#progress', 'تقدّمي')}${link('achievements', '#achievements', 'إنجازاتي')}
          <span class="sb-sep" aria-hidden="true"></span>
          ${link('arena', '#arena', 'المنافسة')}
          <button type="button" class="sb-a" id="sb-pomo"><span class="sb-ic" style="display:inline-grid;place-items:center;font-size:1.1rem">⏱️</span><span>مؤقت التركيز</span></button>
          <button type="button" class="sb-a" id="sb-edit">${icon('edit')}<span>ملفي</span></button>
          <button type="button" class="sb-a" id="sb-out">${icon('out')}<span>تسجيل الخروج</span></button>
        </div>
      </nav>
      <div class="shell-main" id="pg"></div>
    </div>`;
    document.getElementById('pg').appendChild(frag);
    const sbp = document.getElementById('sb-pomo'); if (sbp) sbp.onclick = () => openPomodoro();
    document.getElementById('sb-edit').onclick = () => editProfile();
    document.getElementById('sb-out').onclick = () => logout();
  }

  /* ---------- 1) الرئيسية ---------- */
  function nextLesson(stats) {
    const last = records().filter(r => stats.some(x => x.s.id === r.subjectId) && /^u\d+\/l/.test(r.key)).slice(-1)[0];
    const order = last ? [stats.find(x => x.s.id === last.subjectId)].concat(stats.filter(x => x.s.id !== last.subjectId)) : stats;
    for (const { s, st } of order) {
      const l = st.lessons.find(x => st.best[x.key] == null || st.best[x.key] < 65);
      if (l) return { s, ...l, best: st.best[l.key] };
    }
    return null;
  }
  function renderHome() {
    const p = cur(), g = gx();
    const subs = gradeSubjects();
    const stats = subs.map(s => ({ s, st: subjectStats(s) }));
    const started = stats.filter(x => x.st.level != null);
    const overall = started.length ? Math.round(started.reduce((a, x) => a + x.st.level, 0) / started.length) : null;
    const og = overall == null ? null : gradeOf(overall);
    const rec = records();
    const sorted = started.slice().sort((a, b) => b.st.level - a.st.level);
    const strong = sorted[0], weakest = sorted.length > 1 ? sorted[sorted.length - 1] : null;
    const xp = g ? g._totalXp(p) : 0, L = g ? g._levelOf(xp) : null, lg = g ? g._leagueOf(xp) : null, wk = g ? g._xpIn(p, g._weekKey()) : 0;
    const d = g ? g._today() : '', goal = g ? g._goalOf(p) : 20, ans = g ? g._answeredOn(p, d) : 0, gp = Math.min(1, ans / goal);
    const dailyDone = p.daily && d && p.daily[d];
    const weekAgo = Date.now() - 7 * 864e5;
    const wRec = rec.filter(r => r.date > weekAgo);
    const nx = nextLesson(stats);
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'صباح الخير' : 'مساء الخير';
    const left = Math.max(0, goal - ans);
    const tile = (label, value, note) => `<div class="card pg-tile"><small>${label}</small><b>${value}</b><small class="note">${note}</small></div>`;
    $app.innerHTML = `
      <header class="pg-head">
        <div><h1>${hello} يا ${esc(p.name.split(/\s+/)[0])}</h1>
          <p class="sub">${new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })} · ${left ? `أنت على بُعد ${nf(left)} سؤال من هدف اليوم` : 'حققت هدف اليوم 🎉'}</p></div>
        <a class="btn" href="#subjects">ابدأ اختباراً جديداً</a>
      </header>
      ${window.NQP ? window.NQP.homeHtml(p, 'top') : ''}
      <section class="pg-grid2">
        <div class="hero-lvl">
          <div class="ring hero-ring" style="--p:${overall || 0};--rc:#FBBF24" role="img" aria-label="المستوى العام ${overall == null ? 'لم يُحسب بعد' : overall + '%'}"><div><b>${overall == null ? '—' : overall + '%'}</b><small>المستوى العام</small></div></div>
          <div class="hero-txt"><span>تقديرك العام</span><b>${og ? og.t : 'ابدأ أول اختبار'}</b>
            <span>${strong ? `أقوى مادة: ${esc(strong.s.name)} ${strong.st.level}%` : 'سيظهر مستواك بعد أول اختبار'}${weakest && weakest.s.id !== strong.s.id ? ` · تحتاج تركيزاً: ${esc(weakest.s.name)} ${weakest.st.level}%` : ''}</span></div>
        </div>
        ${L ? `<div class="card pg-lvl">
          <div class="pg-row"><b>المستوى: ${L.icon} ${esc(L.name)}</b><span class="xp">${nf(xp)} نقطة</span></div>
          <div class="db-bar"><i style="width:${Math.round(L.prog * 100)}%;background:var(--accent)"></i></div>
          <small class="muted">${L.next ? `باقي ${nf(L.next.xp - xp)} نقطة للوصول إلى مستوى «${esc(L.next.name)}»` : 'وصلت لأعلى مستوى 👑'}</small>
          <div class="pg-chips"><span class="chip-a">${lg.icon} ${esc(lg.name)}</span><span class="chip-b">${nf(wk)} نقطة هذا الأسبوع</span></div>
        </div>` : ''}
      </section>
      <section class="pg-tiles">
        ${tile('اختبارات محلولة', nf(rec.length), `+${nf(wRec.length)} هذا الأسبوع`)}
        ${tile('أسئلة أجبت عليها', nf(rec.reduce((a, r) => a + r.total, 0)), `+${nf(wRec.reduce((a, r) => a + r.total, 0))} هذا الأسبوع`)}
        ${tile('وقت المذاكرة', nf(Math.round(rec.reduce((a, r) => a + r.secs, 0) / 60)) + ' د', `${nf(Math.round(wRec.reduce((a, r) => a + r.secs, 0) / 60))} د هذا الأسبوع`)}
        ${tile('أيام متتالية', nf(streakDays(rec)) + ' ' + (streakDays(rec) === 1 ? 'يوم' : 'أيام'), streakDays(rec) >= 3 ? 'استمر! 🔥' : 'ذاكر يومياً لتحصل على وسام')}
      </section>
      ${srsCard(p)}
      <section class="pg-grid3">
        <div class="card pg-card">
          <h2>هدف اليوم</h2>
          <div class="pg-big"><b>${nf(ans)}</b><span>من ${nf(goal)} سؤالاً</span></div>
          <div class="db-bar"><i style="width:${Math.round(gp * 100)}%;background:var(--ok)"></i></div>
          <small class="muted">${gp >= 1 ? 'حققت هدفك اليوم 🎉' : 'أكمل الهدف واحصل على 25 نقطة إضافية'}</small>
        </div>
        <div class="card pg-card warm">
          <h2>تحدي اليوم</h2>
          <p>${dailyDone ? `أنهيت تحدي اليوم: <b>${nf(dailyDone.score)} من ${nf(dailyDone.total)}</b>` : `10 أسئلة من كل المواد، نفس الأسئلة لكل طلاب ${esc(p.grade)}.`}</p>
          <a class="btn warn" href="#daily">${dailyDone ? 'ترتيب اليوم' : 'ابدأ التحدي'}</a>
        </div>
        <div class="card pg-card">
          <h2>أكمل من حيث توقفت</h2>
          ${nx ? `<div><b>${esc(nx.lesson.short)}: ${esc(nx.lesson.name)}</b><small class="muted" style="display:block">${esc(nx.s.name)} · ${esc(nx.unit.name.split(':')[0])} · ${nf(nx.lesson.questions.length)} سؤال${nx.best != null ? ` · أفضل درجة ${nx.best}%` : ''}</small></div>
            <button type="button" class="btn ghost" id="nxgo">${nx.best != null ? 'أعد المحاولة' : 'ابدأ الدرس'}</button>` : '<p>أنهيت كل الدروس بدرجة جيدة! جرّب الاختبارات الشاملة 🎓</p>'}
        </div>
      </section>
      ${window.NQP ? window.NQP.homeHtml(p, 'bottom') : ''}
      <section class="card">
        <div class="pg-row"><h2>آخر نتائجي</h2><a href="#progress">كل النتائج</a></div>
        ${rec.length ? `<ul class="pg-list">${rec.slice(-5).reverse().map(r => {
          const s = subjectById(r.subjectId), gg = gradeOf(r.pct);
          return `<li><span class="dot" style="background:${gg.c}"></span><div><b>${esc(r.title)}</b><small>${s ? esc(s.name) : (r.kind === 'daily' ? 'تحدي اليوم' : 'تحدي صديق')} · ${r.mode === 'exam' ? 'اختبار' : 'تدريب'} · ${shortDate(r.date)}</small></div><span class="pct" style="color:${gg.c}">${r.pct}%</span></li>`;
        }).join('')}</ul>` : '<p class="empty">لم تحل أي اختبار بعد. <a href="#subjects">اختر مادة وابدأ</a></p>'}
      </section>
      <div class="sync" id="sync"></div>`;
    const go1 = document.getElementById('nxgo'); if (go1) go1.onclick = () => openStart(nx.s, nx.key);
    if (window.NQP) window.NQP.bindHome(p);
    bindSrs(p);
    refreshSync();
  }

  /* ---------- 2) موادي ---------- */
  let subjFilter = 'all';
  function renderSubjectsPage() {
    const subs = gradeSubjects();
    const stats = subs.map(s => ({ s, st: subjectStats(s) }));
    const allWeak = stats.flatMap(x => x.st.weak).sort((a, b) => a.pct - b.pct);
    const sugg = allWeak[0] || null;
    const lessons = stats.reduce((a, x) => a + x.st.total, 0), qs = subs.reduce((a, s) => a + allQuestions(s).length, 0);
    const shown = stats.filter(x => subjFilter === 'all' || (subjFilter === 'focus' && x.st.level != null && x.st.level < 80) || (subjFilter === 'new' && x.st.done === 0));
    const chip = (k, t) => `<button type="button" class="gm-chip${subjFilter === k ? ' on' : ''}" aria-pressed="${subjFilter === k}" data-sf="${k}">${t}</button>`;
    $app.innerHTML = `
      <header class="pg-head">
        <div><h1>موادي</h1><p class="sub">${nf(subs.length)} مواد · ${nf(lessons)} درساً · ${nf(qs)} سؤالاً في ${esc(curGrade)}</p></div>
        <div class="pg-chips" role="group" aria-label="تصفية المواد">${chip('all', 'الكل')}${chip('focus', 'تحتاج تركيزاً')}${chip('new', 'لم أبدأها')}</div>
      </header>
      ${sugg ? `<section class="pg-sugg"><div><span>اقتراح اليوم</span><b>راجع «${esc(sugg.name)}» في ${esc(sugg.s.name)}</b><small>أفضل درجة لك ${sugg.pct}%${(wrongBank()[sugg.s.id] || []).length ? ` · لديك ${nf((wrongBank()[sugg.s.id] || []).length)} سؤال في مراجعة الأخطاء` : ''}</small></div>
        <button type="button" class="btn" id="sgo">ابدأ المراجعة</button></section>` : ''}
      <section class="pg-subjects">
        ${shown.map(({ s, st }) => {
          const gg = st.level == null ? null : gradeOf(st.level), prog = st.total ? Math.round(st.done / st.total * 100) : 0;
          return `<article class="card pg-subj" style="--c:${s.color}">
            <header><span class="ic" aria-hidden="true">${s.icon}</span><div><h2>${esc(s.name)}</h2><small>${st.last ? 'آخر اختبار ' + shortDate(st.last.date) : 'لم تبدأ بعد'}</small></div>
              <b class="lvl" style="color:${levelColor(st.level)}">${st.level == null ? '—' : st.level + '%'}</b></header>
            <div><div class="pg-row sm"><span>الدروس المنجزة</span><span>${nf(st.done)} من ${nf(st.total)}</span></div>
              <div class="db-bar"><i style="width:${prog}%;background:${s.color}"></i></div></div>
            <div class="pg-chips"><span class="tag">${gg ? gg.t : 'جديدة'}</span><span class="tag">${st.wrong ? nf(st.wrong) + ' أخطاء' : 'لا أخطاء'}</span></div>
            <div class="pg-btns"><a class="btn" href="#subject-${s.id}" style="background:${s.color}">${st.done ? 'أكمل الدروس' : 'ابدأ المادة'}</a>
              <button type="button" class="btn ghost" data-mist="${s.id}" ${st.wrong ? '' : 'disabled'}>الأخطاء</button></div>
          </article>`;
        }).join('') || '<p class="empty">لا توجد مواد في هذا التصنيف.</p>'}
        ${subjFilter === 'all' ? COMING.filter(c => !subs.some(s => s.name === c.name)).map(c => `<div class="card pg-subj soon"><header><span class="ic" aria-hidden="true">${c.icon}</span><div><h2>${c.name}</h2><small>قريباً</small></div></header></div>`).join('') : ''}
      </section>`;
    $app.querySelectorAll('[data-sf]').forEach(b => b.onclick = () => { subjFilter = b.dataset.sf; route(); });
    $app.querySelectorAll('[data-mist]').forEach(b => b.onclick = () => openStart(subjectById(b.dataset.mist), 'mistakes'));
    const sg = document.getElementById('sgo'); if (sg) sg.onclick = () => openStart(sugg.s, sugg.key);
  }

  /* ---------- 3) تقدّمي ---------- */
  let progPeriod = 'week';
  function renderProgress() {
    const subs = gradeSubjects(), all = records();
    const span = progPeriod === 'week' ? 7 : progPeriod === 'month' ? 30 : null;
    const now = Date.now(), from = span ? now - span * 864e5 : 0, prevFrom = span ? from - span * 864e5 : 0;
    const cur1 = all.filter(r => r.date >= from), prev = span ? all.filter(r => r.date >= prevFrom && r.date < from) : [];
    const avg = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.pct, 0) / rs.length) : null;
    const trend = (a, b, unit, better) => {
      if (!span || a == null || b == null) return { t: span ? 'لا توجد بيانات للمقارنة' : 'منذ بداية الفصل', c: 'var(--muted)' };
      const d = a - b; if (!d) return { t: 'بدون تغيير', c: 'var(--muted)' };
      const good = better === 'up' ? d > 0 : d < 0;
      return { t: `${d > 0 ? '▲' : '▼'} ${nf(Math.abs(d))}${unit} عن الفترة السابقة`, c: good ? 'var(--ok)' : 'var(--bad)' };
    };
    const kp = (label, value, tr) => `<div class="card pg-tile"><small>${label}</small><b>${value}</b><small class="note" style="color:${tr.c}">${tr.t}</small></div>`;
    const avgT = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.secs, 0) / rs.length / 60) : null;
    const g = gx(), goal = g ? g._goalOf(cur()) : 20;
    const days = Array.from({ length: 7 }, (_, i) => { const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() - 6 + i); return dt; })
      .map(dt => { const n = all.filter(r => new Date(r.date).toDateString() === dt.toDateString()).reduce((a, r) => a + r.total, 0); return { day: dt.toLocaleDateString('ar-EG', { weekday: 'short' }), n }; });
    const maxN = Math.max(goal * 1.5, ...days.map(x => x.n));
    const subRows = subs.map(s => { const a = avg(cur1.filter(r => r.subjectId === s.id)), b = avg(prev.filter(r => r.subjectId === s.id)); const lvl = subjectStats(s).level; return { s, lvl, d: a != null && b != null ? a - b : null }; }).filter(x => x.lvl != null).sort((a, b) => b.lvl - a.lvl);
    const weak = subs.flatMap(s => subjectStats(s).weak).sort((a, b) => a.pct - b.pct).slice(0, 6);
    const per = (k, t) => `<button type="button" class="seg${progPeriod === k ? ' on' : ''}" aria-pressed="${progPeriod === k}" data-per="${k}">${t}</button>`;
    $app.innerHTML = `
      <header class="pg-head">
        <div><h1>تقدّمي</h1><p class="sub">كيف تتحسن درجاتك مع الوقت</p></div>
        <div class="segs" role="group" aria-label="الفترة">${per('week', 'آخر 7 أيام')}${per('month', 'آخر 30 يوماً')}${per('all', 'الفصل كله')}</div>
      </header>
      <section class="pg-tiles">
        ${kp('متوسط درجاتي', avg(cur1) == null ? '—' : avg(cur1) + '%', trend(avg(cur1), avg(prev), '%', 'up'))}
        ${kp('عدد الاختبارات', nf(cur1.length), trend(cur1.length, span ? prev.length : null, '', 'up'))}
        ${kp('أسئلة أجبت عليها', nf(cur1.reduce((a, r) => a + r.total, 0)), trend(cur1.reduce((a, r) => a + r.total, 0), span ? prev.reduce((a, r) => a + r.total, 0) : null, '', 'up'))}
        ${kp('متوسط وقت الاختبار', avgT(cur1) == null ? '—' : nf(avgT(cur1)) + ' د', trend(avgT(cur1), avgT(prev), ' د', 'down'))}
      </section>
      <section class="pg-grid2">
        <div class="card">
          <h2>الأسئلة يومياً (آخر 7 أيام)</h2><p class="muted" style="margin:0 0 12px">الخط المتقطع = هدفك اليومي (${nf(goal)} سؤالاً)</p>
          <div class="pg-chart" role="img" aria-label="${days.map(x => x.day + ' ' + x.n).join('، ')}">
            <span class="goal-line" style="bottom:${Math.round(goal / maxN * 100)}%"></span>
            ${days.map(x => `<div class="col"><small>${nf(x.n)}</small><i style="height:${Math.max(2, Math.round(x.n / maxN * 100))}%;background:${x.n >= goal ? 'var(--brand)' : 'var(--brand-soft-2)'}"></i></div>`).join('')}
          </div>
          <div class="pg-chart-x">${days.map(x => `<small>${x.day}</small>`).join('')}</div>
        </div>
        <div class="card">
          <h2>مستواي في كل مادة</h2>
          ${subRows.length ? `<div class="pg-bars">${subRows.map(x => `<div><div class="pg-row sm"><b>${x.s.icon} ${esc(x.s.name)}</b><span style="font-weight:800;color:${levelColor(x.lvl)}">${x.lvl}%${x.d != null ? ` <small class="muted">${x.d > 0 ? '+' : ''}${nf(x.d)}</small>` : ''}</span></div>
            <div class="db-bar"><i style="width:${x.lvl}%;background:${levelColor(x.lvl)}"></i></div></div>`).join('')}</div>` : '<p class="empty">ابدأ بحل الاختبارات ليظهر مستواك في كل مادة.</p>'}
        </div>
      </section>
      <section class="card">
        <h2>دروس تحتاج مراجعة</h2>
        ${weak.length ? `<div class="pg-weak">${weak.map(w => `<div class="weak-card"><b>${esc(w.name)}</b><small class="muted">${esc(w.s.name)} · ${esc(w.unit.name.split(':')[0])}</small>
          <div class="pg-row sm"><span style="font-weight:800;color:var(--bad)">أفضل درجة ${w.pct}%</span><button type="button" class="btn warn small" data-retry="${w.s.id}|${w.key}">أعد الاختبار</button></div></div>`).join('')}</div>`
          : `<p class="empty">${all.length ? 'ممتاز! كل الدروس التي حللتها درجتك فيها 65% أو أكثر 🎉' : 'ستظهر هنا الدروس التي درجتك فيها أقل من 65%.'}</p>`}
      </section>
      <section class="card">
        <div class="pg-row"><h2>آخر الاختبارات</h2><a href="#records">السجل الكامل والنسخة الاحتياطية</a></div>
        ${all.length ? `<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>المادة</th><th>الاختبار</th><th>الوضع</th><th>الدرجة</th><th>النقاط</th></tr></thead><tbody>
          ${all.slice(-10).reverse().map(r => { const s = subjectById(r.subjectId), gg = gradeOf(r.pct); return `<tr><td>${shortDate(r.date)}</td><td>${s ? s.icon + ' ' + esc(s.name) : (r.kind === 'daily' ? '📅 تحدي اليوم' : '⚔️ تحدي صديق')}</td><td>${esc(r.title)}</td><td>${r.mode === 'exam' ? 'اختبار' : 'تدريب'}</td><td><span class="best ${gg.cls}">${r.pct}%</span></td><td class="xp">+${nf(r.xp != null ? r.xp : 0)}</td></tr>`; }).join('')}
        </tbody></table></div>` : '<p class="empty">لا توجد اختبارات بعد.</p>'}
      </section>`;
    $app.querySelectorAll('[data-per]').forEach(b => b.onclick = () => { progPeriod = b.dataset.per; route(); });
    $app.querySelectorAll('[data-retry]').forEach(b => b.onclick = () => { const [sid, key] = b.dataset.retry.split('|'); openStart(subjectById(sid), key); });
  }

  /* ---------- صفحة المادة ---------- */
  function badge(p) {
    if (p == null) return '<span class="best">لم يُحل بعد</span>';
    return `<span class="best ${gradeOf(p).cls}">أفضل درجة ${p}%</span>`;
  }
  function renderSubject(s) {
    if (curGrade !== s.grade) { curGrade = s.grade; try { localStorage.setItem(KEY_GRADE, curGrade); } catch (e) { } }
    const wrongCount = (wrongBank()[s.id] || []).length;
    $app.innerHTML = `
      <div class="crumbs"><a href="#home">المواد</a> › ${esc(s.grade)} › ${esc(s.name)}</div>
      <h1>${s.icon} ${esc(s.name)}</h1>
      <p class="sub">${esc(s.grade)} — اختر الدرس الذي تريد الاختبار فيه</p>
      ${s.units.map(u => `
        <section class="unit">
          <h2>${esc(u.name)} ${G('unitBadge', s, u) || ''}</h2>
          <div class="lessons">
            ${u.lessons.map((l, i) => `
              <div class="card lesson">
                <div class="num">${i + 1}</div>
                <div class="info"><b>${esc(l.name)}</b><small>${esc(l.short)} · ${l.questions.length} سؤال</small></div>
                ${badge(bestFor(s.id, u.id + '/' + l.id))}
                <button class="btn" data-start="${u.id}/${l.id}">ابدأ</button>
              </div>`).join('')}
            <div class="card lesson exam">
              <div class="num">★</div>
              <div class="info"><b>الاختبار الشامل للوحدة</b><small>${EXAM_SIZE} سؤالاً عشوائياً من كل الدروس</small></div>
              ${badge(bestFor(s.id, u.id + '/exam'))}
              <button class="btn warn" data-start="${u.id}/exam">ابدأ</button>
            </div>
          </div>
        </section>`).join('')}
      <section class="card lesson">
        <div class="num">↺</div>
        <div class="info"><b>مراجعة أخطائي</b><small>${wrongCount ? wrongCount + ' سؤال أخطأت فيه سابقاً' : 'لا توجد أخطاء محفوظة حالياً 👏'}</small></div>
        <button class="btn ghost" data-start="mistakes" ${wrongCount ? '' : 'disabled'}>راجع</button>
      </section>`;
    $app.querySelectorAll('[data-start]').forEach(b => b.onclick = () => openStart(s, b.dataset.start));
  }

  /* ---------- المراجعة المتباعدة للأخطاء ----------
     السؤال الخاطئ يعود بعد يوم، ثم 3 أيام، ثم أسبوع، ثم أسبوعين. إذا أخطأ فيه يبدأ من جديد. */
  const SRS_GAPS = [1, 3, 7, 14];
  const dayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const addDays = n => dayKey(Date.now() + n * 864e5);
  function srsInit(p) {
    if (!p || p.srs) return;
    p.srs = {};
    Object.entries(p.wrong || {}).forEach(([sid, ids]) => (ids || []).forEach(id => { p.srs[id] = { s: sid, b: 0, d: dayKey() }; }));
  }
  function srsUpdate(p, sid, pairs) {
    if (!p) return; srsInit(p);
    const today = dayKey();
    pairs.forEach(([id, sc]) => {
      const e = p.srs[id];
      if (sc < 1) p.srs[id] = { s: sid, b: 0, d: addDays(SRS_GAPS[0]) };
      else if (e && e.d <= today) {
        const b = e.b + 1;
        if (b >= SRS_GAPS.length) delete p.srs[id];
        else p.srs[id] = { s: sid, b, d: addDays(SRS_GAPS[b]) };
      }
    });
  }
  function srsDue(p) {
    srsInit(p);
    const today = dayKey(), bySub = {}; let next = null, nextN = 0;
    Object.entries(p.srs || {}).forEach(([id, e]) => {
      const s = subjectById(e.s); if (!s || s.grade !== p.grade) return;
      if (e.d <= today) (bySub[s.id] = bySub[s.id] || { s, ids: [] }).ids.push(id);
      else if (!next || e.d < next) { next = e.d; nextN = 1; } else if (e.d === next) nextN++;
    });
    return { subs: Object.values(bySub), next, nextN };
  }
  function srsCard(p) {
    const d = srsDue(p), total = d.subs.reduce((a, x) => a + x.ids.length, 0);
    if (!total && !d.next) return '';
    const days = d.next ? Math.round((new Date(d.next + 'T00:00') - new Date(dayKey() + 'T00:00')) / 864e5) : 0;
    return `<section class="card srs-card">
      <div class="pg-row"><h2>🔁 مراجعة اليوم</h2>${total ? `<span class="pr-tag" style="background:var(--accent-soft);color:var(--accent-ink)">${nf(total)} سؤال</span>` : ''}</div>
      ${total ? `<p class="muted" style="margin:0 0 10px">أسئلة أخطأت فيها من قبل وحان موعد مراجعتها. كل مرة تجيب صح تبتعد المراجعة القادمة (يوم ← 3 أيام ← أسبوع ← أسبوعان) حتى تثبت.</p>
        <div class="srs-subs">${d.subs.map(x => `<button type="button" class="srs-sub" data-srs="${x.s.id}"><span aria-hidden="true">${x.s.icon}</span><b>${esc(x.s.name)}</b><small>${nf(x.ids.length)} سؤال</small></button>`).join('')}</div>`
        : `<p class="muted" style="margin:0">لا توجد مراجعة اليوم 👏 المراجعة القادمة ${days === 1 ? 'غداً' : `بعد ${nf(days)} أيام`} (${nf(d.nextN)} سؤال).</p>`}
    </section>`;
  }
  function bindSrs(p) {
    $app.querySelectorAll('[data-srs]').forEach(b => b.onclick = () => {
      const s = subjectById(b.dataset.srs); if (!s) return;
      const ids = new Set(srsDue(p).subs.filter(x => x.s.id === s.id).flatMap(x => x.ids));
      const pool = allQuestions(s).filter(q => ids.has(q.id)).slice(0, 15);
      if (!pool.length) return toast('لا توجد أسئلة للمراجعة الآن');
      startQuiz(s, 'srs', '🔁 مراجعة اليوم – ' + s.name, pool, 'practice');
    });
  }

  /* ---------- مؤقت التركيز (Pomodoro) ---------- */
  let pomoTimer = null;
  let pomoSecsLeft = 25 * 60;
  let pomoTotalSecs = 25 * 60;
  let pomoRunning = false;
  let pomoMode = 'work'; // 'work' | 'break'

  function openPomodoro() {
    if (document.querySelector('.pomo-modal')) return;
    const ov = document.createElement('div');
    ov.className = 'overlay pomo-modal';

    const renderPomo = () => {
      const mins = Math.floor(pomoSecsLeft / 60);
      const secs = pomoSecsLeft % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const pct = Math.round((pomoSecsLeft / pomoTotalSecs) * 100);

      ov.innerHTML = `
        <div class="card pomo-card" role="dialog" aria-modal="true">
          <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
            <h2 style="margin:0;font-size:1.2rem">⏱️ مؤقت التركيز للمذاكرة</h2>
            <button type="button" class="btn ghost small" id="pomo-close" aria-label="إغلاق">✕</button>
          </div>

          <div class="pomo-modes">
            <button type="button" class="pomo-mode ${pomoMode === 'work' ? 'on' : ''}" data-pm="work">🎯 تركيز (25 د)</button>
            <button type="button" class="pomo-mode ${pomoMode === 'break' ? 'on' : ''}" data-pm="break">☕ استراحة (5 د)</button>
          </div>

          <div class="pomo-ring" style="--p:${pct};--brand:${pomoMode === 'work' ? 'var(--brand)' : 'var(--ok)'}">
            <div class="pomo-inner">
              <div class="pomo-time">${timeStr}</div>
              <span class="pomo-label">${pomoMode === 'work' ? 'جلسة مذاكرة' : 'استراحة قصيرة'}</span>
            </div>
          </div>

          <div class="pomo-btns">
            <button type="button" class="btn ${pomoRunning ? 'warn' : ''}" id="pomo-toggle">${pomoRunning ? '⏸️ إيقاف مؤقت' : '▶️ ابدأ الجلسة'}</button>
            <button type="button" class="btn ghost" id="pomo-reset">🔄 إعادة ضبط</button>
          </div>

          <small class="muted">${pomoMode === 'work' ? '🔥 أكمل جلسة التركيز واحصل على +15 نقطة خبرة' : 'استرخِ واستعد للجلسة القادمة'}</small>
        </div>`;

      ov.querySelector('#pomo-close').onclick = () => ov.remove();
      ov.onclick = e => { if (e.target === ov) ov.remove(); };

      ov.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => {
        pomoMode = b.dataset.pm;
        pomoTotalSecs = (pomoMode === 'work' ? 25 : 5) * 60;
        pomoSecsLeft = pomoTotalSecs;
        pomoRunning = false;
        clearInterval(pomoTimer);
        renderPomo();
      });

      ov.querySelector('#pomo-toggle').onclick = () => {
        if (pomoRunning) {
          pomoRunning = false;
          clearInterval(pomoTimer);
          renderPomo();
        } else {
          pomoRunning = true;
          NQSound.playTock();
          renderPomo();
          clearInterval(pomoTimer);
          pomoTimer = setInterval(() => {
            if (pomoSecsLeft > 0) {
              pomoSecsLeft--;
              const m = Math.floor(pomoSecsLeft / 60);
              const s = pomoSecsLeft % 60;
              const tStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
              const tEl = ov.querySelector('.pomo-time');
              if (tEl) tEl.textContent = tStr;
              const rEl = ov.querySelector('.pomo-ring');
              if (rEl) rEl.style.setProperty('--p', Math.round((pomoSecsLeft / pomoTotalSecs) * 100));
            } else {
              clearInterval(pomoTimer);
              pomoRunning = false;
              NQSound.playChime();
              if (pomoMode === 'work' && window.NQGame && cur()) {
                window.NQGame._addXp(cur(), 15, 'pomodoro');
                persist();
                toast('🎉 رائع! أنهيت جلسة تركيز كاملة (+15 نقطة XP)');
              } else {
                toast('☕ انتهى وقت الاستراحة! هل أنت مستعد للتركيز؟');
              }
              pomoMode = pomoMode === 'work' ? 'break' : 'work';
              pomoTotalSecs = (pomoMode === 'work' ? 25 : 5) * 60;
              pomoSecsLeft = pomoTotalSecs;
              renderPomo();
            }
          }, 1000);
        }
      };

      ov.querySelector('#pomo-reset').onclick = () => {
        clearInterval(pomoTimer);
        pomoRunning = false;
        pomoSecsLeft = pomoTotalSecs;
        renderPomo();
      };
    };

    renderPomo();
    document.body.appendChild(ov);
  }

  /* ---------- وضع بطاقات الحفظ والتلخيص (Flashcards) ---------- */
  function startFlashcards(s, title, pool) {
    if (!pool || !pool.length) return;
    let deck = shuffle(pool).slice();
    let currentIdx = 0;
    let isFlipped = false;

    const ov = document.createElement('div');
    ov.className = 'overlay';

    const drawCard = () => {
      if (currentIdx >= deck.length) {
        NQSound.playWin();
        if (window.NQGame && cur()) {
          window.NQGame._addXp(cur(), 10, 'flashcards');
          persist();
        }
        ov.innerHTML = `
          <div class="card" role="dialog" aria-modal="true" style="max-width:440px;text-align:center;padding:32px 24px">
            <div style="font-size:3.5rem;margin-bottom:8px">🎉</div>
            <h2 style="font-size:1.6rem;margin:0 0 6px">أحسنت صنعاً!</h2>
            <p class="sub" style="margin:0 0 16px">أتممت مراجعة كل بطاقات «${esc(title)}» بنجاح!</p>
            <div class="chip-b" style="margin:0 auto 20px;font-size:1rem;padding:6px 16px">+10 نقاط خبرة XP 🌟</div>
            <div class="actions" style="justify-content:center;gap:10px">
              <button type="button" class="btn" id="fc-restart">🔁 مراجعة مرة أخرى</button>
              <button type="button" class="btn ghost" id="fc-close">إغلاق</button>
            </div>
          </div>`;
        ov.querySelector('#fc-restart').onclick = () => {
          deck = shuffle(pool).slice();
          currentIdx = 0;
          isFlipped = false;
          drawCard();
        };
        ov.querySelector('#fc-close').onclick = () => ov.remove();
        return;
      }

      const q = deck[currentIdx];
      isFlipped = false;
      const progPct = Math.round((currentIdx / deck.length) * 100);

      // تخصيص المحتوى الأمامي والخلفي بذكاء بحسب نوع السؤال
      let kindTag = esc(q.kind || 'مفهوم');
      let frontBodyHtml = '';
      let frontHintText = 'انقر على البطاقة لقلبها ومعرفة الإجابة 🔄';
      let backBodyHtml = '';

      if (q.type === 'match') {
        kindTag = '🏷️ تصنيف وتوصيل';
        frontHintText = 'فكر في تصنيف كل عنصر ثم اقلب البطاقة للتحقق 🔄';
        frontBodyHtml = `
          <p class="fc-qtext">${esc(q.q)}</p>
          <div class="fc-match-front">
            <div class="fc-mf-label">العناصر المطلوب تصنيفها:</div>
            <div class="fc-mf-items">
              ${(q.items || []).map(it => `<span class="fc-item-chip">${esc(it[0])}</span>`).join('')}
            </div>
            <div class="fc-mf-label" style="margin-top:10px">التصنيفات المتاحة:</div>
            <div class="fc-mf-cats">
              ${(q.categories || []).map(c => `<span class="fc-cat-chip">🏷️ ${esc(c)}</span>`).join('')}
            </div>
          </div>
        `;

        const groups = (q.categories || []).map((cat, ci) => {
          const catItems = (q.items || []).filter(it => it[1] === ci).map(it => it[0]);
          return { cat, items: catItems };
        });

        backBodyHtml = `
          <div style="width:100%">
            <div style="font-size:.9rem;font-weight:700;color:var(--muted);margin-bottom:6px">التقسيم والتصنيف الصحيح:</div>
            <div class="fc-match-groups">
              ${groups.map(g => `
                <div class="fc-group-card">
                  <div class="fc-group-title">🏷️ ${esc(g.cat)} <small>(${g.items.length})</small></div>
                  <ul class="fc-group-list">
                    ${g.items.map(it => `<li><span class="fc-bullet">✓</span> ${esc(it)}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
            ${q.explain ? `<p class="fc-exp" style="margin-top:8px">💡 ${esc(q.explain)}</p>` : ''}
          </div>
        `;
      } else if (q.type === 'fill') {
        kindTag = '✏️ أكمل الفراغ';
        const ans = (q.answers && q.answers[0]) || '';
        const hasBlankPattern = /(\.{3,}|_{2,})/.test(q.q);
        const qTextFormatted = hasBlankPattern
          ? esc(q.q).replace(/(\.{3,}|_{2,})/g, '<span class="fc-blank-box">[ . . . . . ]</span>')
          : esc(q.q);

        frontBodyHtml = `
          <p class="fc-qtext">${qTextFormatted}</p>
          ${qImg(q, true)}
        `;

        let completedSentenceHtml = '';
        if (hasBlankPattern) {
          const completed = esc(q.q).replace(/(\.{3,}|_{2,})/g, `<strong class="fc-filled-word">${esc(ans)}</strong>`);
          completedSentenceHtml = `<div class="fc-completed-sentence">« ${completed} »</div>`;
        }

        backBodyHtml = `
          <div style="width:100%">
            <b class="fc-ans">✓ ${esc(ans)}</b>
            ${completedSentenceHtml}
            ${q.answers && q.answers.length > 1 ? `<div class="fc-exp" style="margin-top:6px">إجابات بديلة مقبولة: ${esc(q.answers.slice(1).join(' أو '))}</div>` : ''}
            ${q.explain ? `<p class="fc-exp" style="margin-top:8px">💡 ${esc(q.explain)}</p>` : ''}
          </div>
        `;
      } else if (q.type === 'multi') {
        kindTag = '☑️ اختيار متعدد';
        frontBodyHtml = `
          <p class="fc-qtext">${esc(q.q)}</p>
          ${qImg(q, true)}
          ${q.options && q.options.length ? `
            <button type="button" class="btn ghost small fc-hint-toggle" id="fc-toggle-opts">💡 إظهار خيارات السؤال</button>
            <div class="fc-opts-hint" id="fc-opts-box" style="display:none">
              ${q.options.map((opt, oi) => `<div class="fc-opt-item"><span class="fc-opt-let">${LETTERS[oi] || (oi + 1)}</span><span>${esc(opt)}</span></div>`).join('')}
            </div>
          ` : ''}
        `;

        const correctList = (q.answers || []).map(ai => q.options[ai]).filter(Boolean);
        backBodyHtml = `
          <div style="width:100%">
            <div style="font-size:.9rem;font-weight:700;color:var(--muted);margin-bottom:6px">الإجابات الصحيحة:</div>
            <div class="fc-multi-answers">
              ${correctList.map(t => `<div class="fc-multi-item">✓ ${esc(t)}</div>`).join('')}
            </div>
            ${q.explain ? `<p class="fc-exp" style="margin-top:8px">💡 ${esc(q.explain)}</p>` : ''}
          </div>
        `;
      } else {
        // MCQ / TF
        const isTf = !!q.tf;
        if (isTf) kindTag = '⚖️ صح أم خطأ';
        const ansText = correctText(q);

        frontBodyHtml = `
          <p class="fc-qtext">${esc(q.q)}</p>
          ${qImg(q, true)}
          ${!isTf && q.options && q.options.length ? `
            <button type="button" class="btn ghost small fc-hint-toggle" id="fc-toggle-opts">💡 إظهار الخيارات للتلميح</button>
            <div class="fc-opts-hint" id="fc-opts-box" style="display:none">
              ${q.options.map((opt, oi) => `<div class="fc-opt-item"><span class="fc-opt-let">${LETTERS[oi] || (oi + 1)}</span><span>${esc(opt)}</span></div>`).join('')}
            </div>
          ` : ''}
        `;

        const isWrongAnswer = isTf && (q.answer === 1 || ansText === 'خطأ' || ansText === 'خاطئة');
        backBodyHtml = `
          <div style="width:100%">
            <b class="fc-ans">✓ ${esc(ansText)}</b>
            ${isWrongAnswer && q.explain ? `
              <div class="fc-correction">
                <b>📌 تصويب العبارة:</b> ${esc(q.explain)}
              </div>
            ` : (q.explain ? `<p class="fc-exp" style="margin-top:8px">💡 ${esc(q.explain)}</p>` : '')}
          </div>
        `;
      }

      ov.innerHTML = `
        <div class="card" role="dialog" aria-modal="true" style="max-width:600px;width:100%;padding:22px">
          <div class="fc-head">
            <div>
              <span class="kind">بطاقة ${currentIdx + 1} من ${deck.length}</span>
              <small class="muted" style="margin-inline-start:8px">${esc(s.name)} · ${esc(title)}</small>
            </div>
            <button type="button" class="btn ghost small" id="fc-exit" aria-label="خروج">✕</button>
          </div>
          <div class="bar" style="margin:12px 0 16px"><i style="width:${progPct}%"></i></div>

          <div class="fc-card-container" id="fc-flipper">
            <div class="fc-card" id="fc-card-inner">
              <div class="fc-face fc-front">
                <div class="fc-head">
                  <span class="chip-a">${kindTag}</span>
                  <button type="button" class="btn-tts" id="fc-tts" title="استمع للسؤال">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  </button>
                </div>
                <div class="fc-body">
                  ${frontBodyHtml}
                </div>
                <p class="fc-hint">${frontHintText}</p>
              </div>

              <div class="fc-face fc-back">
                <div class="fc-head">
                  <span class="chip-b">الإجابة والملخص</span>
                </div>
                <div class="fc-body">
                  ${backBodyHtml}
                </div>
                <p class="fc-hint">قيّم نفسك للانتقال للبطاقة التالية 👇</p>
              </div>
            </div>
          </div>

          <div class="fc-btns">
            <button type="button" class="fc-btn review" id="fc-act-rev">🔁 أحتاج مراجعة</button>
            <button type="button" class="fc-btn master" id="fc-act-ok">✅ أتقنتها</button>
          </div>
        </div>`;

      const flipper = ov.querySelector('#fc-flipper');
      const inner = ov.querySelector('#fc-card-inner');
      flipper.onclick = e => {
        if (e.target.closest('#fc-tts') || e.target.closest('#fc-toggle-opts') || e.target.closest('#fc-opts-box')) return;
        isFlipped = !isFlipped;
        inner.classList.toggle('flipped', isFlipped);
        NQSound.playTock();
      };

      const toggleOpts = ov.querySelector('#fc-toggle-opts');
      if (toggleOpts) {
        toggleOpts.onclick = e => {
          e.stopPropagation();
          const box = ov.querySelector('#fc-opts-box');
          if (box) {
            const isHidden = box.style.display === 'none';
            box.style.display = isHidden ? 'flex' : 'none';
            toggleOpts.textContent = isHidden ? '🙈 إخفاء الخيارات' : '💡 إظهار الخيارات للتلميح';
          }
        };
      }

      const tts = ov.querySelector('#fc-tts');
      if (tts) tts.onclick = e => {
        e.stopPropagation();
        NQSound.speak(q.q);
      };

      ov.querySelector('#fc-exit').onclick = () => ov.remove();
      ov.querySelector('#fc-act-ok').onclick = () => {
        NQSound.playCorrect();
        currentIdx++;
        drawCard();
      };
      ov.querySelector('#fc-act-rev').onclick = () => {
        NQSound.playTock();
        const curr = deck.splice(currentIdx, 1)[0];
        deck.push(curr);
        drawCard();
      };
    };

    drawCard();
    document.body.appendChild(ov);
  }

  /* ---------- طباعة ورقة العمل (Worksheet) ---------- */
  function renderPrintWorksheet(s, title, pool) {
    if (!pool || !pool.length) return;
    const p = cur();
    const ov = document.createElement('div');
    ov.className = 'overlay ws-print';
    // الخيارات في بنك الأسئلة تبدأ بالإجابة الصحيحة، فنخلطها في الورقة (صح/خطأ يبقى بترتيبه)
    const ordered = pool.map(q => ({ q, opts: q.options ? (q.tf ? q.options.slice() : shuffle(q.options)) : null }));
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    // بعض الدروس اسمها المختصر جزء من اسمها الكامل («دالة القيمة المطلقة: 1-1 دالة القيمة المطلقة»)
    const [t1, t2] = title.split(': ');
    const wsTitle = t2 && t2.includes(t1) ? t2 : title;
    const body = ({ q, opts }) => {
      if ((q.type === 'mcq' || q.type === 'multi') && opts) {
        const box = q.type === 'multi' ? '<span class="ws-opt-box"></span>' : '<span class="ws-opt-circ"></span>';
        return `${q.type === 'multi' ? '<small class="ws-note">(اختر كل الإجابات الصحيحة)</small>' : ''}<div class="ws-opts">${opts.map(o => `<div class="ws-opt">${box}<span>${esc(o)}</span></div>`).join('')}</div>`;
      }
      if (q.type === 'fill') return '<div class="ws-line">الإجابة:</div>';
      if (q.type === 'match') return `<table class="ws-match"><thead><tr><th>العنصر</th><th>التصنيف (${q.categories.map(esc).join(' / ')})</th></tr></thead><tbody>${shuffle(q.items).map(it => `<tr><td>${esc(it[0])}</td><td></td></tr>`).join('')}</tbody></table>`;
      return '';
    };

    ov.innerHTML = `
      <div class="card ws-modal" role="dialog" aria-modal="true" aria-label="ورقة عمل للطباعة">
        <div class="no-print ws-bar">
          <b>معاينة ورقة العمل</b>
          <div>
            <button type="button" class="btn" id="ws-do-print">🖨️ طباعة / حفظ PDF</button>
            <button type="button" class="btn ghost" id="ws-close">إغلاق</button>
          </div>
        </div>
        <div class="ws-paper">
          <div class="ws-head">
            <div>
              <h2>ورقة تدريب: ${esc(wsTitle)}</h2>
              <p>المادة: <b>${esc(s.name)}</b> · ${esc(s.grade)} · المنهج الكويتي</p>
            </div>
            <div class="ws-brand"><b>قِمّة</b><small>تعلَّم. أتقِن. تصدَّر.</small></div>
          </div>
          <div class="ws-meta">
            <span>اسم الطالب: <b>${esc((p && !p.isGuest ? p.name : '') || '....................................')}</b></span>
            <span>التاريخ: ${today}</span>
            <span>الدرجة: ______ / ${pool.length}</span>
          </div>
          <div class="ws-questions">
            ${ordered.map((x, idx) => `
              <div class="ws-q">
                <div><span class="ws-q-num">(${idx + 1})</span> <b>${esc(x.q.q)}</b></div>
                ${x.q.img ? `<img class="ws-img" src="${esc(x.q.img)}" alt="${esc(x.q.alt || '')}">` : ''}
                ${body(x)}
              </div>`).join('')}
          </div>
          <div class="ws-ans-key">
            <h3>نموذج الإجابات الصحيحة (لولي الأمر والمعلم)</h3>
            <ol>${pool.map(q => `<li>${esc(correctText(q))}</li>`).join('')}</ol>
          </div>
        </div>
      </div>`;

    const close = () => { ov.remove(); document.body.classList.remove('ws-printing'); };
    ov.querySelector('#ws-close').onclick = close;
    ov.onclick = e => { if (e.target === ov) close(); };
    ov.querySelector('#ws-do-print').onclick = () => {
      document.body.classList.add('ws-printing');
      try { window.print(); } catch (e) { toast('الطباعة غير متاحة هنا'); }
      setTimeout(() => document.body.classList.remove('ws-printing'), 800);
    };
    document.body.appendChild(ov);
  }

  /* ---------- نافذة بدء الاختبار ---------- */
  function openStart(s, key) {
    let title, pool;
    if (key === 'mistakes') {
      const ids = new Set(wrongBank()[s.id] || []);
      pool = allQuestions(s).filter(q => ids.has(q.id)); title = 'مراجعة أخطائي';
    } else {
      const [uid, lid] = key.split('/');
      const unit = s.units.find(u => u.id === uid);
      if (lid === 'exam') { pool = shuffle(unit.lessons.flatMap(l => l.questions)).slice(0, EXAM_SIZE); title = 'الاختبار الشامل – ' + unit.name.split(':')[0]; }
      else { const l = unit.lessons.find(x => x.id === lid); pool = l.questions; title = l.short + ': ' + l.name; }
    }
    if (!pool.length) { toast('لا توجد أسئلة هنا حالياً'); return; }
    let mode = key.endsWith('exam') ? 'exam' : 'practice';
    const ov = document.createElement('div');
    ov.className = 'overlay';
    const draw = () => {
      ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" style="max-width:440px">
        <h2>${esc(title)}</h2>
        <p class="sub" style="margin:0">${pool.length} سؤال · ${esc(subjLabel(s))}</p>
        <div class="modes">
          <button class="mode ${mode === 'practice' ? 'sel' : ''}" data-m="practice"><b>✏️ تدريب</b><small>تصحيح فوري بعد كل سؤال</small></button>
          <button class="mode ${mode === 'exam' ? 'sel' : ''}" data-m="exam"><b>⏱️ اختبار</b><small>النتيجة تظهر في النهاية فقط</small></button>
          <button class="mode ${mode === 'flashcards' ? 'sel' : ''}" data-m="flashcards"><b>🗂️ بطاقات الحفظ</b><small>تقليب ومراجعة سريعة للمفاهيم</small></button>
        </div>
        <div class="actions" style="justify-content:space-between;margin-top:14px">
          <button type="button" class="btn ghost small" id="ws-print-btn">🖨️ ورقة عمل</button>
          <div>
            <button class="btn ghost" data-x>إلغاء</button>
            <button class="btn" data-go>${mode === 'flashcards' ? 'ابدأ البطاقات 🗂️' : 'ابدأ 🚀'}</button>
          </div>
        </div>
      </div>`;
      ov.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      ov.querySelector('[data-x]').onclick = () => ov.remove();
      const wsBtn = ov.querySelector('#ws-print-btn');
      if (wsBtn) wsBtn.onclick = () => { ov.remove(); renderPrintWorksheet(s, title, pool); };
      ov.querySelector('[data-go]').onclick = () => {
        ov.remove();
        if (mode === 'flashcards') startFlashcards(s, title, pool);
        else startQuiz(s, key, title, pool, mode);
      };
    };
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    draw();
    document.body.appendChild(ov);
  }

  function startQuiz(s, key, title, pool, mode, opts) {
    const block = window.NQP && cur() ? window.NQP.blocked(cur()) : null;
    if (block) { toast('⏰ ' + block); return; }
    const qs = shuffle(pool).map(q => ({
      q,
      order: q.type === 'match' ? shuffle(q.items.map((_, i) => i)) : q.type === 'fill' ? [] : q.tf ? [0, 1] : shuffle(q.options.map((_, i) => i))
    }));
    const limit = (opts && opts.limit) || qs.length * SECS_PER_Q;
    quiz = { limit, subjectId: s.id, key, title, mode, qs, idx: 0, resp: qs.map(() => null), checked: qs.map(() => false), start: Date.now(), done: false, opts: opts || {} };
    go('#quiz');
  }

  /* ---------- العداد التنازلي ---------- */
  const timeLeft = () => Math.max(0, quiz.limit - Math.floor((Date.now() - quiz.start) / 1000));
  const timerHtml = () => `⏳ متبقٍ <b>${fmtTime(timeLeft())}</b>`;

  const qImg = (q, small) => q.img ? `<figure class="q-fig${small ? ' sm' : ''}"><img src="${esc(q.img)}" alt="${esc(q.alt || 'صورة السؤال')}" loading="lazy"></figure>` : '';

  /* ---------- عرض السؤال ---------- */
  function renderQuestion() {
    const { qs, idx, mode } = quiz;
    const item = qs[idx], q = item.q, r = quiz.resp[idx], checked = quiz.checked[idx];
    const showFb = mode === 'practice' && checked;
    let body = '';

    if (q.type === 'mcq' || q.type === 'multi') {
      const multi = q.type === 'multi';
      body = `<div class="opts${q.tf ? ' tf' : ''}">${item.order.map((oi, n) => {
        const sel = multi ? (r || []).includes(oi) : r === oi;
        let cls = sel ? 'sel' : '';
        if (showFb) {
          const isRight = multi ? q.answers.includes(oi) : q.answer === oi;
          cls = isRight ? 'right' : (sel ? 'wrong' : '');
        }
        return `<button class="opt ${multi ? 'multi' : ''} ${cls}" data-o="${oi}" ${showFb ? 'disabled' : ''}>
          <span class="mark">${multi ? (sel || (showFb && cls === 'right') ? '✓' : '') : q.tf ? (oi === 0 ? '✓' : '✗') : LETTERS[n]}</span><span>${esc(q.options[oi])}</span></button>`;
      }).join('')}</div>`;
    } else if (q.type === 'fill') {
      const cls = showFb ? (scoreOf(q, r) === 1 ? 'right' : 'wrong') : '';
      body = `<div class="fill ${cls}"><label class="sr" for="fill-in">إجابتك</label>
        <input id="fill-in" type="text" autocomplete="off" spellcheck="false" maxlength="80" placeholder="اكتب إجابتك هنا" value="${esc(r || '')}" ${showFb ? 'disabled' : ''}></div>`;
    } else {
      body = `<div class="match">${item.order.map(ii => {
        const it = q.items[ii], v = r ? r[ii] : null;
        let cls = '';
        if (showFb) cls = v === it[1] ? 'right' : 'wrong';
        return `<div class="mrow ${cls}"><b>${esc(it[0])}</b>
          <div>${showFb && cls === 'wrong' ? `<span class="fix">الصحيح: ${esc(q.categories[it[1]])}</span> ` : ''}
          <select id="m-${q.id}-${ii}" data-i="${ii}" ${showFb ? 'disabled' : ''} aria-label="${esc(it[0])}">
            <option value="">— اختر —</option>
            ${q.categories.map((c, ci) => `<option value="${ci}" ${v === ci ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select></div></div>`;
      }).join('')}</div>`;
    }

    const hint = q.type === 'multi' ? 'اختر كل الإجابات الصحيحة' : q.type === 'match' ? 'اختر التصنيف المناسب لكل عنصر' : q.type === 'fill' ? 'اكتب الإجابة في المربع (رقم أو كلمة)' : q.tf ? 'هل العبارة صحيحة أم خاطئة؟' : 'اختر إجابة واحدة';
    let fb = '';
    if (showFb) {
      const sc = scoreOf(q, r);
      fb = sc === 1 ? `<div class="feedback ok">✓ إجابة صحيحة! أحسنت</div>`
        : sc > 0 ? `<div class="feedback part">◐ إجابة صحيحة جزئياً (${Math.round(sc * 100)}%)</div>`
          : `<div class="feedback no">✗ إجابة خاطئة — الصحيح: ${esc(correctText(q))}</div>`;
      if (q.explain) fb += `<p class="q-explain">💡 ${esc(q.explain)}</p>`;
    }

    const last = idx === qs.length - 1;
    let actions;
    if (mode === 'practice') {
      actions = `<span></span>` + (!checked
        ? `<button class="btn" data-check ${isAnswered(q, r) ? '' : 'disabled'}>تحقق من الإجابة</button>`
        : `<button class="btn" data-next>${last ? 'عرض النتيجة' : 'السؤال التالي ←'}</button>`);
    } else {
      const answered = quiz.resp.filter((x, i) => isAnswered(qs[i].q, x)).length;
      actions = `<button class="btn ghost" data-prev ${idx === 0 ? 'disabled' : ''}>→ السابق</button>` +
        (last ? `<button class="btn warn" data-finish>تسليم (${answered}/${qs.length})</button>` : `<button class="btn" data-next>التالي ←</button>`);
    }

    $app.innerHTML = `
      <div class="crumbs">${esc(quiz.title)} · ${mode === 'exam' ? 'وضع الاختبار' : 'وضع التدريب'}</div>
      <div class="qhead"><span>السؤال ${idx + 1} من ${qs.length}</span><span class="timer" id="tm" role="timer" aria-label="الوقت المتبقي">${timerHtml()}</span></div>
      <div class="bar"><i style="width:${(idx + (checked || mode === 'exam' ? 1 : 0)) / qs.length * 100}%"></i></div>
      <section class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span class="kind" style="margin:0">${esc(q.kind || 'سؤال')}</span>
          <button type="button" class="btn-tts" id="q-tts" title="استمع للسؤال بصوت واضح" aria-label="استمع للسؤال">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
        </div>
        <p class="qtext">${esc(q.q)}</p>
        ${qImg(q)}
        <p class="hint">${hint}</p>
        ${body}
        ${fb}
        <div class="actions">${actions}</div>
        ${window.NQReports ? window.NQReports.button(q.id) : ''}
      </section>`;

    $app.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      const oi = +b.dataset.o;
      if (q.type === 'mcq') quiz.resp[idx] = oi;
      else { const cur = (quiz.resp[idx] || []).slice(); const k = cur.indexOf(oi); k >= 0 ? cur.splice(k, 1) : cur.push(oi); quiz.resp[idx] = cur; }
      renderQuestion();
    });
    const fin = document.getElementById('fill-in');
    if (fin) {
      if (!showFb) fin.focus();
      fin.oninput = () => {
        quiz.resp[idx] = fin.value;
        const ck = $app.querySelector('[data-check]'); if (ck) ck.disabled = !fin.value.trim();
        const fs = $app.querySelector('[data-finish]'); if (fs) fs.textContent = `تسليم (${quiz.resp.filter((x, i) => isAnswered(qs[i].q, x)).length}/${qs.length})`;
      };
      fin.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const b = $app.querySelector('[data-check]:not([disabled])') || $app.querySelector('[data-next]'); if (b) b.click(); } };
    }
    $app.querySelectorAll('select[data-i]').forEach(sel => sel.onchange = () => {
      const cur = quiz.resp[idx] ? quiz.resp[idx].slice() : q.items.map(() => null);
      cur[+sel.dataset.i] = sel.value === '' ? null : +sel.value;
      quiz.resp[idx] = cur; renderQuestion();
    });
    const on = (sel, fn) => { const el = $app.querySelector(sel); if (el) el.onclick = fn; };
    on('[data-check]', () => {
      quiz.checked[idx] = true;
      const sc = scoreOf(item.q, quiz.resp[idx]);
      if (sc === 1) NQSound.playCorrect(); else NQSound.playWrong();
      renderQuestion();
    });
    const ttsBtn = document.getElementById('q-tts');
    if (ttsBtn) ttsBtn.onclick = () => {
      ttsBtn.classList.add('speaking');
      NQSound.speak(item.q.q);
      setTimeout(() => ttsBtn.classList.remove('speaking'), 3500);
    };
    on('[data-next]', () => { if (last) finish(); else { quiz.idx++; renderQuestion(); window.scrollTo(0, 0); } });
    on('[data-prev]', () => { quiz.idx--; renderQuestion(); });
    on('[data-finish]', async () => {
      const missing = quiz.resp.filter((x, i) => !isAnswered(qs[i].q, x)).length;
      if (missing && !(await ask(`لم تُجب على ${missing} سؤال. هل تريد التسليم الآن؟`, 'تسليم'))) return;
      finish();
    });

    clearInterval(timerId);
    timerId = setInterval(() => {
      if (!quiz || quiz.done) return clearInterval(timerId);
      if (timeLeft() <= 0) { clearInterval(timerId); toast('⏰ انتهى الوقت! تم تسليم الاختبار'); finish(); return; }
      const t = document.getElementById('tm'); if (t) { t.innerHTML = timerHtml(); t.classList.toggle('low', timeLeft() <= 60); }
    }, 1000);
    const t0 = document.getElementById('tm'); if (t0) t0.classList.toggle('low', timeLeft() <= 60);
  }

  /* ---------- إنهاء وحفظ ---------- */
  function finish() {
    clearInterval(timerId);
    const q = quiz;
    q.done = true;
    const scores = q.qs.map((it, i) => scoreOf(it.q, q.resp[i]));
    const total = q.qs.length, score = round1(scores.reduce((a, b) => a + b, 0));
    const pct = Math.round(score / total * 100);
    const secs = Math.floor((Date.now() - q.start) / 1000);
    const rec = { id: Date.now(), subjectId: q.subjectId, key: q.key, title: q.title, mode: q.mode, score, total, pct, secs, date: Date.now() };
    if (q.opts.kind) rec.kind = q.opts.kind;
    rec.ans = q.qs.map((it, i) => [it.q.id, q.resp[i], Math.round(scores[i] * 100) / 100]);
    rec.xp = G('xpFor', rec) || 0;
    state.records.push(rec);
    if (window.NQP) window.NQP.trimDetails(cur());

    if (!q.opts.noWrong) {
      const set = new Set(state.wrong[q.subjectId] || []);
      q.qs.forEach((it, i) => { scores[i] < 1 ? set.add(it.q.id) : set.delete(it.q.id); });
      state.wrong[q.subjectId] = [...set];
      srsUpdate(cur(), q.subjectId, q.qs.map((it, i) => [it.q.id, scores[i]]));
    }
    if (q.opts.onDone) q.opts.onDone(rec);
    const extras = G('afterResult', rec) || null;
    persist();

    lastResult = { rec, extras, items: q.qs.map((it, i) => ({ q: it.q, r: q.resp[i], s: scores[i] })) };
    quiz = null;
    if (pct >= 85) { NQSound.playWin(); } else { NQSound.playCorrect(); }
    go('#result');
  }

  /* ---------- النتيجة ---------- */
  function renderResult() {
    const { rec, items } = lastResult;
    const g = gradeOf(rec.pct);
    const wrong = items.filter(x => x.s < 1);
    const s = subjectById(rec.subjectId);
    $app.innerHTML = `
      <section class="card result">
        <div class="crumbs">${esc(rec.title)}</div>
        <div class="ring" style="--p:${rec.pct};--rc:${g.c}"><div><b>${rec.pct}%</b><small>${rec.score} من ${rec.total}</small></div></div>
        <p class="grade" style="color:${g.c}">${g.t}</p>
        <p class="rmeta">الوقت: ${fmtTime(rec.secs)} · صحيح ${items.filter(x => x.s === 1).length} · خطأ ${wrong.length} · تم الحفظ في السجل ✓</p>
        <div id="gm-result"></div>
        <div class="rbtns">
          ${rec.kind ? `<a class="btn" href="${rec.kind === 'daily' ? '#daily' : '#duel-' + esc(rec.key.split('/')[1] || '')}">${rec.kind === 'daily' ? '📅 ترتيب تحدي اليوم' : '⚔️ نتيجة التحدي'}</a>`
            : `<button class="btn" id="again">إعادة الاختبار</button>
          <a class="btn ghost" href="#subject-${rec.subjectId}">العودة للدروس</a>`}
          <button type="button" class="btn wa-btn" id="share-wa"><span>📲 مشاركة النتيجة واتساب</span></button>
          <a class="btn ghost" href="#home">لوحتي</a>
        </div>
        <div class="review">
          <h2>${wrong.length ? 'راجع أخطاءك' : 'ممتاز! لا توجد أخطاء 🎉'}</h2>
          ${wrong.map(x => `<div class="rv">
            <p><span class="kind">${esc(x.q.kind || '')}</span> ${esc(x.q.q)}</p>
            ${qImg(x.q, true)}
            <p class="yours">إجابتك: ${esc(respText(x.q, x.r))}</p>
            <p class="ans">الصحيح: ${esc(correctText(x.q))}</p>
            ${x.q.explain ? `<p class="rv-ex">💡 ${esc(x.q.explain)}</p>` : ''}
            ${window.NQReports ? window.NQReports.button(x.q.id) : ''}</div>`).join('')}
        </div>
      </section>`;
    const ag = document.getElementById('again'); if (ag && s) ag.onclick = () => openStart(s, rec.key);
    const shareWa = document.getElementById('share-wa');
    if (shareWa) {
      shareWa.onclick = () => {
        const studentName = state.name || 'طالب';
        const subjName = s ? (s.name || subjLabel(s)) : (rec.title || 'الاختبار');
        const text = `🎉 حقق الطالب (${studentName}) نتيجة رائعة في منصة مسابقة التعليمية!\n` +
          `📚 المادة: ${subjName}\n` +
          `📝 الاختبار: ${rec.title}\n` +
          `🎯 النسبة: ${rec.pct}%\n` +
          `🏆 التقدير: ${g.t}\n` +
          `⏱️ الوقت: ${fmtTime(rec.secs)}\n` +
          `🚀 جرب المنصة وتحداني في المذاكرة!`;
        const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
      };
    }
    G('resultExtras', rec, lastResult.extras);
  }

  /* ---------- سجل الدرجات ---------- */
  let recFilter = 'all';
  function renderRecords() {
    const all = records().slice().reverse();
    const rows = recFilter === 'all' ? all : all.filter(r => r.subjectId === recFilter);
    const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length) : 0;
    const best = rows.length ? Math.max(...rows.map(r => r.pct)) : 0;
    const time = rows.reduce((a, r) => a + r.secs, 0);
    $app.innerHTML = `
      <h1>سجل درجات ${esc(state.name)}</h1>
      <p class="sub" id="sync"></p>
      <div class="toolbar">
        <select id="flt" aria-label="تصفية حسب المادة"><option value="all">كل المواد</option>${SUBJECTS.map(s => `<option value="${s.id}" ${recFilter === s.id ? 'selected' : ''}>${esc(subjLabel(s))}</option>`).join('')}</select>
        <span style="flex:1"></span>
        <button class="btn ghost small" id="exp">⬇ نسخة احتياطية</button>
        <label class="btn ghost small" style="cursor:pointer">⬆ استرجاع<input type="file" id="imp" accept=".json,application/json" hidden></label>
        <button class="btn danger small" id="clr">مسح السجل</button>
      </div>
      <div class="summary">
        <div class="card"><b>${rows.length}</b><small>عدد الاختبارات</small></div>
        <div class="card"><b>${rows.length ? avg + '%' : '—'}</b><small>متوسط الدرجات</small></div>
        <div class="card"><b>${rows.length ? best + '%' : '—'}</b><small>أعلى درجة</small></div>
        <div class="card"><b>${Math.round(time / 60)} د</b><small>وقت المذاكرة</small></div>
      </div>
      <div class="card table-wrap">
        ${rows.length ? `<table>
          <thead><tr><th>التاريخ</th><th>المادة</th><th>الاختبار</th><th>الوضع</th><th>الدرجة</th><th>النسبة</th><th>الوقت</th></tr></thead>
          <tbody>${rows.map(r => {
            const g = gradeOf(r.pct), s = subjectById(r.subjectId);
            return `<tr><td>${fmtDate(r.date)}</td><td>${s ? s.icon + ' ' + esc(subjLabel(s)) : (r.kind === 'daily' ? '📅 تحدي اليوم' : r.kind === 'duel' ? '⚔️ تحدي صديق' : '—')}</td><td>${esc(r.title)}</td>
              <td>${r.mode === 'exam' ? 'اختبار' : 'تدريب'}</td><td>${r.score}/${r.total}</td>
              <td><span class="best ${g.cls}">${r.pct}% · ${g.t}</span></td><td>${fmtTime(r.secs)}</td></tr>`;
          }).join('')}</tbody></table>` : `<div class="empty">لا توجد اختبارات محفوظة بعد. <a href="#home" style="color:var(--brand);font-weight:700">ابدأ أول اختبار</a></div>`}
      </div>`;
    refreshSync();
    document.getElementById('flt').onchange = e => { recFilter = e.target.value; route(); };
    document.getElementById('clr').onclick = async () => {
      if (await ask(`سيتم حذف كل درجات وأخطاء "${state.name}" نهائياً (الطلاب الآخرون لن يتأثروا). هل أنت متأكد؟`, 'مسح السجل', true)) {
        state.records = []; state.wrong = {}; persist(); route(); toast('تم مسح السجل');
      }
    };
    document.getElementById('exp').onclick = exportBackup;
    document.getElementById('imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        const d = JSON.parse(t);
        if (!Array.isArray(d.records)) throw new Error();
        const ids = new Set(state.records.map(r => r.id));
        d.records.forEach(r => { if (!ids.has(r.id)) state.records.push(r); });
        state.records.sort((a, b) => a.date - b.date);
        if (d.wrong) Object.keys(d.wrong).forEach(k => { state.wrong[k] = [...new Set([...(state.wrong[k] || []), ...d.wrong[k]])]; });
        persist(); toast('تم استرجاع السجل ✓'); route();
      }).catch(() => toast('الملف غير صالح'));
    };
  }
  async function exportBackup() {
    const data = JSON.stringify({ app: 'nq', version: 1, exported: new Date().toISOString(), student: state.name, grade: cur() ? cur().grade : '', records: state.records, wrong: state.wrong }, null, 2);
    const filename = 'سجل-' + state.name.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0, 10) + '.json';
    let dl = null;
    if (window.claude && typeof window.claude.use === 'function') { try { dl = await window.claude.use('downloads'); } catch (e) { } }
    if (dl) {
      try { await dl.save({ filename, data }); toast('تم حفظ النسخة ✓'); } catch (e) { if (e && e.code !== 'declined') toast('تعذّر التنزيل هنا'); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // واجهة مكشوفة لملف المنافسة
  window.NQ = {
    store, cur, persist, SUBJECTS, GRADES, allQuestions, subjectById, gradeOf, esc, toast, ask, go, route,
    startQuiz, openStart, records, respText, correctText, qImg, hashPin, avatarHtml, AVATARS, fmtDate, fmtTime, shuffle, newId, subjectStats, streakDays, validPin, weakPin, digitsOnly, pinInput,
    joinFamily, familyJoinDialog, syncNow: () => initCloud(), get cloudKind() { return cloudKind; }, get synced() { return !!cloud; },
    get grade() { return curGrade; }, renderHome: () => renderHome(), app: $app,
    openPomodoro, startFlashcards, renderPrintWorksheet, NQSound, NQTheme
  };
  initTopbarTools();
  route();
  initCloud();
  G('init');
})();
