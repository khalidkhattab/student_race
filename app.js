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
    const h = location.hash.replace(/^#/, '') || 'welcome';
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

  // نافذة إدخال الرقم السري ← true إذا كان صحيحاً
  function pinPrompt(p, title) {
    return new Promise(res => {
      if (document.querySelector('.pin-card')) return res(false); // نافذة رقم سري مفتوحة بالفعل
      const ov = document.createElement('div'); ov.className = 'overlay';
      ov.innerHTML = `<form class="card pin-card" role="dialog" aria-modal="true" aria-labelledby="pin-t" autocomplete="off">
        ${avatarHtml(p, true)}
        <h2 id="pin-t">${esc(title || 'أهلاً يا ' + p.name)}</h2>
        ${pinInput('pin1', 'اكتب رقمك السري')}
        <p class="err" id="pin-err" role="alert"></p>
        <div class="actions"><button type="button" class="btn ghost" data-n>إلغاء</button><button type="submit" class="btn">دخول</button></div>
        <button type="button" class="linkish" data-forgot>نسيت رقمي السري</button>
      </form>`;
      const done = v => { ov.remove(); res(v); };
      const f = ov.querySelector('form'), inp = ov.querySelector('#pin1'), err = ov.querySelector('#pin-err');
      digitsOnly(inp);
      ov.querySelector('[data-n]').onclick = () => done(false);
      ov.onclick = e => { if (e.target === ov) done(false); };
      ov.querySelector('[data-forgot]').onclick = async () => {
        ov.remove();
        if (store.parent && store.parent.pinHash) { toast('اطلب من ولي أمرك إعادة تعيين رقمك من صفحة ولي الأمر 👨‍👩‍👧'); return res(false); }
        const ok = await ask(`لا يمكن معرفة الرقم القديم. هل تريد إعادة تعيين الرقم السري لـ "${p.name}"؟ ستبقى درجاته كما هي. (افعل ذلك بحضور ولي الأمر)`, 'إعادة التعيين', true);
        if (ok) { delete p.pinHash; persist(); renderSetup({ existing: p.id, name: p.name, grade: p.grade, avatar: p.avatar }); }
        res(false);
      };
      f.onsubmit = async e => {
        e.preventDefault();
        if (Date.now() < pinLockUntil) { err.textContent = `محاولات كثيرة. انتظر ${Math.ceil((pinLockUntil - Date.now()) / 1000)} ثانية.`; return; }
        if (!validPin(inp.value)) { err.textContent = 'الرقم السري 4 أرقام.'; return; }
        if ((await hashPin(p.id, inp.value)) === p.pinHash) { pinFails = 0; return done(true); }
        pinFails++; inp.value = '';
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        if (pinFails >= 5) { pinLockUntil = Date.now() + 30000; pinFails = 0; err.textContent = 'رقم خاطئ 5 مرات. انتظر 30 ثانية.'; }
        else err.textContent = 'الرقم السري غير صحيح، حاول مرة أخرى.';
        inp.focus();
      };
      document.body.appendChild(ov);
      inp.focus();
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
    a.textContent = p ? em + ' ' + p.name : '👤 تسجيل الدخول';
    a.title = p ? 'تبديل الطالب' : 'تسجيل الدخول';
    a.setAttribute('aria-label', p ? `الطالب الحالي ${p.name}، اضغط للتبديل` : 'تسجيل الدخول');
  }

  /* ---------- تسجيل الدخول: الصف ← الاسم ← الصورة والرقم السري ---------- */
  let loginGrade = null;
  function selectProfile(p) {
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
    persist(); updateWho(); loginGrade = null;
    go('#login');
  }
  async function enterProfile(p) {
    if (!p.pinHash) return renderSetup({ existing: p.id, name: p.name, grade: p.grade, avatar: p.avatar });
    if (await pinPrompt(p)) selectProfile(p);
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
            <h2><span class="stepn">3</span> اختر صورتك</h2>
            ${avatarGrid(av)}
          </div>
          <div class="card step">
            <h2><span class="stepn">4</span> اختر رقمك السري (4 أرقام)</h2>
            <div class="pin-row">
              <div>${pinInput('sp1', 'الرقم السري')}</div>
              <div>${pinInput('sp2', 'أعد كتابة الرقم')}</div>
            </div>
            <p class="hint">احفظه جيداً ولا تخبر به أحداً غير ولي أمرك.</p>
            <p class="err" id="serr" role="alert"></p>
            <div class="actions" style="justify-content:flex-start">
              <button class="btn" type="submit">${d.existing ? 'حفظ والدخول' : 'إنشاء الحساب والدخول'} ←</button>
              <button class="btn ghost" type="button" id="sback">رجوع</button>
            </div>
          </div>
        </form>
      </section>`;
    bindAvatarGrid($app, i => { av = i; });
    const p1 = document.getElementById('sp1'), p2 = document.getElementById('sp2'), err = document.getElementById('serr');
    digitsOnly(p1); digitsOnly(p2);
    document.getElementById('sback').onclick = () => renderLogin();
    document.getElementById('sf').onsubmit = async e => {
      e.preventDefault();
      if (av == null) { err.textContent = 'اختر صورة رمزية.'; return; }
      if (!validPin(p1.value)) { err.textContent = 'الرقم السري يجب أن يكون 4 أرقام.'; p1.focus(); return; }
      if (p1.value !== p2.value) { err.textContent = 'الرقمان غير متطابقين.'; p2.value = ''; p2.focus(); return; }
      if (weakPin(p1.value)) { err.textContent = 'هذا الرقم سهل التخمين، اختر رقماً آخر.'; return; }
      let p = d.existing ? store.profiles[d.existing] : null;
      if (!p) { p = { id: newId(), name: d.name, grade: d.grade, records: [], wrong: {}, created: Date.now() }; store.profiles[p.id] = p; }
      p.avatar = av;
      p.pinHash = await hashPin(p.id, p1.value);
      selectProfile(p);
    };
  }

  function renderLogin() {
    if (!loginGrade) loginGrade = cur() ? cur().grade : null;
    const people = Object.values(store.profiles)
      .filter(p => p.grade === loginGrade)
      .sort((a, b) => (b.records.length ? b.records[b.records.length - 1].date : b.created) - (a.records.length ? a.records[a.records.length - 1].date : a.created));
    const noGrade = Object.values(store.profiles).filter(p => !GRADES.includes(p.grade));
    $app.innerHTML = `
      <section class="login">
        <h1>من سيذاكر الآن؟</h1>
        <p class="sub">كل طالب له صورته ورقمه السري وسجل درجات خاص به، حتى لو استخدمتم نفس الجهاز. <a href="#parent" class="linkish">👨‍👩‍👧 دخول ولي الأمر</a>${window.NQFamily && window.NQFamily.enabled() ? ' · <button type="button" class="linkish" id="fam-join">📱 عندي كود أسرة من جهاز آخر</button>' : ''}</p>

        <div class="card step">
          <h2><span class="stepn">1</span> اختر صفك</h2>
          <div class="grade-tabs big" role="radiogroup" aria-label="الصف الدراسي">
            ${GRADES.map(g => `<button type="button" role="radio" class="grade-tab${g === loginGrade ? ' on' : ''}" aria-checked="${g === loginGrade}" data-lg="${esc(g)}">${esc(g)}</button>`).join('')}
          </div>
        </div>

        ${loginGrade ? `
        <div class="card step">
          <h2><span class="stepn">2</span> ${people.length ? 'اضغط على صورتك أو اكتب اسمك' : 'اكتب اسمك'}</h2>
          ${people.length ? `
            <div class="people">
              ${people.map(p => `<div class="person${cur() && cur().id === p.id ? ' on' : ''}">
                <button type="button" class="pick" data-pick="${p.id}">${avatarHtml(p)}<span><b>${esc(p.name)}</b><small>${p.pinHash ? '🔒 ' : ''}${p.records.length} اختبار</small></span></button>
                <button type="button" class="del" data-del="${p.id}" aria-label="حذف ${esc(p.name)} من هذا الجهاز" title="حذف">✕</button>
              </div>`).join('')}
            </div>
            <p class="hint">طالب جديد؟ اكتب اسمك:</p>` : ''}
          <form id="lf" class="name-row" autocomplete="off">
            <label for="nm" class="sr">اسم الطالب</label>
            <input id="nm" placeholder="اكتب اسمك هنا" maxlength="30" required>
            <button class="btn" type="submit">التالي ←</button>
          </form>
          <p class="err" id="lerr" role="alert"></p>
        </div>` : ''}

        ${noGrade.length ? `<div class="card step">
          <h2>سجلات قديمة بدون صف</h2>
          <p class="hint">اختر الصف أولاً ثم اضغط على الاسم لنقله إلى ${loginGrade ? esc(loginGrade) : 'الصف المختار'}:</p>
          <div class="people">${noGrade.map(p => `<div class="person"><button type="button" class="pick" data-move="${p.id}" ${loginGrade ? '' : 'disabled'}>${avatarHtml(p)}<span><b>${esc(p.name)}</b><small>${p.records.length} اختبار</small></span></button></div>`).join('')}</div>
        </div>` : ''}
      </section>`;

    $app.querySelectorAll('[data-lg]').forEach(b => b.onclick = () => {
      loginGrade = b.dataset.lg; renderLogin();
      const i = document.getElementById('nm'); if (i) i.focus();
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
      persist(); updateWho(); renderLogin(); toast('تم حذف الطالب');
    });
    const f = document.getElementById('lf');
    if (f) f.onsubmit = e => {
      e.preventDefault();
      const name = document.getElementById('nm').value.trim().replace(/\s+/g, ' ');
      const err = document.getElementById('lerr');
      if (name.length < 2) { err.textContent = 'اكتب اسمك (حرفين على الأقل).'; return; }
      const p = findProfile(name, loginGrade);
      if (p) return enterProfile(p);
      renderSetup({ name, grade: loginGrade });
    };
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
          <button type="button" class="sb-a" id="sb-edit">${icon('edit')}<span>ملفي</span></button>
          <button type="button" class="sb-a" id="sb-out">${icon('out')}<span>تسجيل الخروج</span></button>
        </div>
      </nav>
      <div class="shell-main" id="pg"></div>
    </div>`;
    document.getElementById('pg').appendChild(frag);
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
      ov.innerHTML = `<div class="card" role="dialog" aria-modal="true">
        <h2>${esc(title)}</h2>
        <p class="sub" style="margin:0">${pool.length} سؤال · ${esc(subjLabel(s))}</p>
        <div class="modes">
          <button class="mode ${mode === 'practice' ? 'sel' : ''}" data-m="practice"><b>✏️ تدريب</b><small>تصحيح فوري بعد كل سؤال</small></button>
          <button class="mode ${mode === 'exam' ? 'sel' : ''}" data-m="exam"><b>⏱️ اختبار</b><small>النتيجة تظهر في النهاية فقط</small></button>
        </div>
        <div class="actions"><button class="btn ghost" data-x>إلغاء</button><button class="btn" data-go>ابدأ الاختبار</button></div>
      </div>`;
      ov.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      ov.querySelector('[data-x]').onclick = () => ov.remove();
      ov.querySelector('[data-go]').onclick = () => { ov.remove(); startQuiz(s, key, title, pool, mode); };
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
        <span class="kind">${esc(q.kind || 'سؤال')}</span>
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
    on('[data-check]', () => { quiz.checked[idx] = true; renderQuestion(); });
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
    get grade() { return curGrade; }, renderHome: () => renderHome(), app: $app
  };
  route();
  initCloud();
  G('init');
})();
