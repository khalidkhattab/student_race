/* المدارس والمعلمون والفصول.
   - مدير المنصة يوافق على المدارس ويرسل لكل مدرسة رابط «حساب المدرسة».
   - حساب المدرسة يدعو المعلمين برابط، والمعلم ينشئ فصوله ويرسل رابط الفصل لأولياء الأمور.
   - ولي الأمر يقبل الدعوة لأبنائه، فتظهر درجاتهم للمعلم ويدخلون منافسة الفصل والمدرسة والمنطقة.
   الحسابات (المدير/المدرسة/المعلم) تسجّل الدخول عبر Firebase Auth، والطلاب بلا تسجيل. */
(function () {
  const N = () => window.NQ;
  const esc = s => N().esc(s == null ? '' : s);
  const num = n => Number(n || 0).toLocaleString('ar-EG');
  const cfg = () => window.NQ_FIREBASE || null;
  const enabled = () => { const c = cfg(); return !!(c && c.projectId && c.apiKey && window.fetch); };
  const REGIONS = ['العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء', 'مبارك الكبير', 'التعليم الخاص'];
  const ALL_GRADES = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'];
  const STAGES = ['ابتدائي', 'متوسط', 'ثانوي'];
  const stageOf = g => { const i = ALL_GRADES.indexOf(g); return i < 0 ? null : i < 5 ? 'ابتدائي' : i < 9 ? 'متوسط' : 'ثانوي'; };
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rid = n => { const a = new Uint32Array(n); crypto.getRandomValues(a); return Array.from(a, x => ALPHA[x % ALPHA.length]).join(''); };
  const DAY = 864e5;

  /* ================= Firestore (REST) ================= */
  const enc = v => v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v }
    : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
    : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { mapValue: { fields: encF(v) } };
  const encF = o => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined).map(([k, x]) => [k, enc(x)]));
  const dec = f => !f ? null : 'stringValue' in f ? f.stringValue : 'integerValue' in f ? Number(f.integerValue) : 'doubleValue' in f ? f.doubleValue
    : 'booleanValue' in f ? f.booleanValue : 'arrayValue' in f ? (f.arrayValue.values || []).map(dec) : 'mapValue' in f ? decF(f.mapValue.fields) : 'timestampValue' in f ? f.timestampValue : null;
  const decF = fs => Object.fromEntries(Object.entries(fs || {}).map(([k, v]) => [k, dec(v)]));
  const docOf = j => Object.assign({ id: j.name.split('/').pop() }, decF(j.fields));
  const base = () => { const c = cfg(); return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) + '/databases/' + encodeURIComponent(c.database || '(default)') + '/documents'; };
  async function req(method, path, body) {
    const h = { 'Content-Type': 'application/json' };
    const u = await signedUser(); if (u) h.Authorization = 'Bearer ' + await u.getIdToken();
    const r = await fetch(base() + (path ? (path[0] === ':' ? '' : '/') + path : '') + (path && path.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(cfg().apiKey), { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 404 && method === 'GET') return null;
    if (!r.ok) { let m = ''; try { m = (await r.json()).error.status; } catch (e) { } throw { code: r.status === 403 ? 'denied' : 'http_' + r.status, status: m }; }
    return r.status === 204 ? {} : r.json();
  }
  const db = {
    async get(path) { const j = await req('GET', path); return j && j.fields ? docOf(j) : null; },
    async set(path, data) { return req('PATCH', path, { fields: encF(data) }); },
    async del(path) { return req('DELETE', path); },
    async query(coll, filters, opts) {
      opts = opts || {};
      const where = (filters || []).map(([f, op, v]) => ({ fieldFilter: { field: { fieldPath: f }, op: op === '==' ? 'EQUAL' : op, value: enc(v) } }));
      const q = { from: [{ collectionId: coll }], limit: opts.limit || 300 };
      if (where.length === 1) q.where = where[0]; else if (where.length) q.where = { compositeFilter: { op: 'AND', filters: where } };
      const rows = await req('POST', (opts.parent ? opts.parent : '') + ':runQuery', { structuredQuery: q });
      return (Array.isArray(rows) ? rows : []).filter(x => x.document).map(x => docOf(x.document));
    }
  };

  /* ================= تسجيل الدخول (Firebase Auth) ================= */
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const loadScript = src => new Promise((res, rej) => { if (document.querySelector('script[src="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('sdk')); document.head.appendChild(s); });
  let authP = null, authed = null;
  function auth() {
    if (!authP) authP = loadScript(SDK + 'firebase-app-compat.js').then(() => loadScript(SDK + 'firebase-auth-compat.js')).then(() => {
      const c = cfg();
      const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp({ apiKey: c.apiKey, authDomain: c.authDomain || (c.projectId + '.firebaseapp.com'), projectId: c.projectId });
      const a = app.auth(); a.languageCode = 'ar';
      return new Promise(res => { const un = a.onAuthStateChanged(u => { authed = u; un(); res(a); }); });
    }).catch(e => { authP = null; throw e; });
    return authP;
  }
  // للطلاب (بلا تسجيل) لا نحمّل مكتبة الدخول أصلاً
  async function signedUser() { if (!authP) return null; try { const a = await authP; return a.currentUser; } catch (e) { return null; } }

  /* ================= أدوات واجهة ================= */
  const ICO = {
    near: '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    far: '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1"/></svg>',
    wa: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z"/></svg>',
    copy: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/></svg>'
  };
  let qrLib = null;
  const loadQr = () => qrLib || (qrLib = loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js').catch(e => { qrLib = null; throw e; }));
  const siteUrl = h => location.origin + location.pathname + '#' + h;
  async function copyText(t, ok) { try { await navigator.clipboard.writeText(t); N().toast(ok); } catch (e) { N().toast(t); } }
  // نافذة مشاركة رابط (QR إذا كان الجهاز قريباً، أو واتساب/نسخ)
  function shareWindow({ title, url, text, note }) {
    document.querySelectorAll('.overlay.px-link').forEach(x => x.remove());
    const ov = document.createElement('div'); ov.className = 'overlay px-link';
    const opener = document.activeElement;
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); if (opener && opener.focus) opener.focus(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    const shell = (t, body, back) => `<div class="card px-sheet" role="dialog" aria-modal="true" aria-labelledby="sw-t"><span class="px-grab" aria-hidden="true"></span>
      <div class="px-sheet-head">${back ? '<button type="button" class="px-icon-btn" data-back aria-label="رجوع">→</button>' : ''}<h2 id="sw-t">${t}</h2><button type="button" class="px-icon-btn" data-x aria-label="إغلاق">×</button></div>
      ${body}${note ? `<p class="hint px-sheet-note">${note}</p>` : ''}</div>`;
    const bind = () => { ov.querySelector('[data-x]').onclick = close; const b = ov.querySelector('[data-back]'); if (b) b.onclick = () => step('choose'); const f = ov.querySelector('[data-go],[data-copy]'); if (f) f.focus(); };
    function step(s) {
      if (s === 'choose') {
        ov.innerHTML = shell(title, `<div class="px-choose">
          <button type="button" class="px-choice on" data-go="far">${ICO.far}<b>إرسال رابط</b><small>واتساب أو جروب الفصل</small></button>
          <button type="button" class="px-choice" data-go="near">${ICO.near}<b>عرض كود QR</b><small>على الشاشة أو السبورة</small></button></div>`);
        bind(); ov.querySelectorAll('[data-go]').forEach(b => b.onclick = () => step(b.dataset.go));
      } else if (s === 'near') {
        ov.innerHTML = shell('صوّر هذا الكود', `<div class="px-qr-step"><div class="px-qr-img" id="sw-qr"><p class="muted">⏳ جارٍ التجهيز…</p></div>
          <ol class="px-steps"><li>افتح كاميرا الموبايل.</li><li>وجّهها على الكود حتى يظهر رابط.</li><li>اضغط الرابط واتبع الخطوات.</li></ol></div>`, true);
        bind();
        loadQr().then(() => { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); const el = ov.querySelector('#sw-qr'); if (el) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'كود QR'); el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } })
          .catch(() => { const el = ov.querySelector('#sw-qr'); if (el) el.innerHTML = '<p class="muted">تعذّر تجهيز الكود (يحتاج إنترنت).</p>'; });
      } else {
        ov.innerHTML = shell('أرسل الرابط', `<div class="px-send">
          <a class="px-send-btn wa" href="https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}" target="_blank" rel="noopener">${ICO.wa}<span><b>إرسال بالواتساب</b><small>لشخص أو لجروب</small></span></a>
          <button type="button" class="px-send-btn" data-copy>${ICO.copy}<span><b>نسخ الرابط</b><small>للصقه في أي مكان</small></span></button></div>
          <p class="muted px-link-url" dir="ltr">${esc(url)}</p>`, true);
        bind(); ov.querySelector('[data-copy]').onclick = () => copyText(url, 'تم نسخ الرابط ✓');
      }
    }
    ov.onclick = e => { if (e.target === ov) close(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov); step('choose');
  }
  const errTxt = e => e && e.code === 'denied' ? 'ليس لديك صلاحية لهذا الإجراء.' : 'تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.';
  const page = (title, sub, body, actions) => `<section class="pr-page sc-page"><header class="pg-head"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions ? `<div class="db-btns">${actions}</div>` : ''}</header>${body}</section>`;
  // المادة: اسم عام يطابق أسماء المواد في كل صف (الرياضيات، العلوم…)
  const SUBJECT_NAMES = ['الرياضيات', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'القرآن الكريم', 'الاجتماعيات', 'دولة الكويت'];
  const ALL_SUBJ = 'كل المواد (مربي الفصل)';
  const subjectOpts = sel => SUBJECT_NAMES.concat(ALL_SUBJ).map(s => `<option ${s === sel ? 'selected' : ''}>${s}</option>`).join('');
  const subjLabel = c => !c.subject ? 'لم تُحدَّد المادة' : c.subject === ALL_SUBJ ? 'مربي الفصل' : c.subject;
  const gradeOpts = sel => ALL_GRADES.map(g => `<option ${g === sel ? 'selected' : ''}>${g}</option>`).join('');
  const regionOpts = sel => REGIONS.map(r => `<option ${r === sel ? 'selected' : ''}>${r}</option>`).join('');

  /* ================= شاشة الدخول للمعلمين والمدارس ================= */
  async function signInView(next, intro) {
    const app = N().app;
    app.innerHTML = page('🏫 دخول المعلمين والمدارس', intro || 'سجّل الدخول بحساب جوجل أو بالبريد الإلكتروني.', `
      <div class="sc-grid2">
        <section class="card sc-signin">
          <button type="button" class="btn sc-google" id="sc-g"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#fff" opacity=".85" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z"/></svg>الدخول بحساب Google</button>
          <div class="sc-or"><span>أو بالبريد</span></div>
          <form id="sc-ef" class="px-form">
            <label class="wide"><span>البريد الإلكتروني</span><input type="email" id="sc-em" autocomplete="email" required dir="ltr"></label>
            <label class="wide"><span>كلمة المرور (6 أحرف على الأقل)</span><input type="password" id="sc-pw" autocomplete="current-password" minlength="6" required dir="ltr"></label>
            <div class="sc-row"><button class="btn" type="submit" data-mode="in">دخول</button><button class="btn ghost" type="submit" data-mode="up">إنشاء حساب جديد</button></div>
          </form>
          <p class="err" id="sc-err" role="alert"></p>
        </section>
        <section class="card sc-help"><h2>كيف تبدأ؟</h2>
          <ol class="px-steps"><li><b>المدرسة:</b> أرسلوا <a href="#school-request">طلب تسجيل المدرسة</a>، وبعد الموافقة يصلكم رابط «حساب المدرسة».</li>
          <li><b>المعلم:</b> اطلب من إدارة مدرستك «رابط دعوة المعلمين» وافتحه هنا.</li>
          <li>أنشئ فصولك، ثم أرسل رابط كل فصل لجروب أولياء الأمور.</li></ol></section>
      </div>`);
    const err = document.getElementById('sc-err');
    const done = () => next();
    document.getElementById('sc-g').onclick = async () => {
      err.textContent = '';
      try { const a = await auth(); await a.signInWithPopup(new window.firebase.auth.GoogleAuthProvider()); done(); }
      catch (e) { err.textContent = authErr(e); }
    };
    let mode = 'in';
    document.querySelectorAll('#sc-ef [data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; });
    document.getElementById('sc-ef').onsubmit = async e => {
      e.preventDefault(); err.textContent = '⏳';
      const em = document.getElementById('sc-em').value.trim(), pw = document.getElementById('sc-pw').value;
      try { const a = await auth(); if (mode === 'up') await a.createUserWithEmailAndPassword(em, pw); else await a.signInWithEmailAndPassword(em, pw); done(); }
      catch (e2) { err.textContent = authErr(e2); }
    };
  }
  function authErr(e) {
    const c = (e && e.code) || '';
    if (/popup-closed|cancelled/.test(c)) return '';
    if (/wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)) return 'البريد أو كلمة المرور غير صحيحة.';
    if (/email-already-in-use/.test(c)) return 'هذا البريد مسجّل بالفعل، اختر «دخول».';
    if (/weak-password/.test(c)) return 'كلمة المرور قصيرة (6 أحرف على الأقل).';
    if (/unauthorized-domain|operation-not-allowed/.test(c)) return 'طريقة الدخول هذه غير مفعّلة بعد في إعدادات المنصة.';
    if (/sdk/.test(e && e.message)) return 'تعذّر تحميل خدمة الدخول. تأكد من الإنترنت.';
    return 'تعذّر الدخول. حاول مرة أخرى.';
  }
  async function needUser(next, intro) {
    if (!enabled()) { N().app.innerHTML = page('🏫 المدارس والمعلمون', 'هذه الخاصية متاحة في نسخة الموقع المنشورة على الإنترنت فقط.', ''); return null; }
    N().app.innerHTML = '<p class="empty">⏳ جارٍ التحميل…</p>';
    try { await auth(); } catch (e) { N().app.innerHTML = '<p class="empty">تعذّر تحميل خدمة الدخول. تأكد من الإنترنت.</p>'; return null; }
    const u = await signedUser(); if (u) return u;
    signInView(next, intro); return null;
  }
  async function signOut() { try { const a = await auth(); await a.signOut(); } catch (e) { } N().go('#staff'); }

  /* ================= طلب تسجيل مدرسة (عام) ================= */
  function renderSchoolRequest() {
    const app = N().app;
    app.innerHTML = page('🏫 طلب تسجيل مدرسة', 'بعد مراجعة الطلب والموافقة عليه يصلكم رابط «حساب المدرسة» على وسيلة التواصل التي تكتبونها.', `
      <form class="card px-form sc-form" id="sr">
        <label class="wide"><span>اسم المدرسة</span><input id="sr-n" required maxlength="100"></label>
        <label><span>المنطقة التعليمية</span><select id="sr-r">${regionOpts()}</select></label>
        <fieldset class="sc-stages"><legend>المراحل في المدرسة</legend>${STAGES.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label>`).join('')}</fieldset>
        <label class="wide"><span>وسيلة التواصل (بريد أو هاتف المسؤول)</span><input id="sr-c" required maxlength="120" dir="ltr"></label>
        <button class="btn" type="submit">إرسال الطلب</button><p class="err" id="sr-e" role="alert"></p>
      </form>`, '<a class="btn ghost small" href="#staff">→ دخول المعلمين</a>');
    document.getElementById('sr').onsubmit = async e => {
      e.preventDefault(); const er = document.getElementById('sr-e');
      const stages = [...document.querySelectorAll('.sc-stages input:checked')].map(x => x.value);
      if (!stages.length) { er.textContent = 'اختر مرحلة واحدة على الأقل.'; return; }
      er.textContent = '⏳';
      try {
        await db.set('schoolRequests/' + rid(20), { name: document.getElementById('sr-n').value.trim(), region: document.getElementById('sr-r').value, stages, contact: document.getElementById('sr-c').value.trim(), at: Date.now() });
        app.innerHTML = page('✅ تم إرسال الطلب', 'سنراجع الطلب ونتواصل معكم قريباً.', '');
      } catch (x) { er.textContent = errTxt(x); }
    };
  }

  /* ================= مدير المنصة ================= */
  async function renderAdmin() {
    const u = await needUser(renderAdmin, 'هذه الصفحة لمدير المنصة فقط.'); if (!u) return;
    const app = N().app;
    let reqs = null, schools = [];
    try { [reqs, schools] = await Promise.all([db.query('schoolRequests', [], { limit: 200 }), db.query('schools', [], { limit: 500 })]); }
    catch (e) {
      app.innerHTML = page('🛡️ مدير المنصة', '', `<section class="card"><p>هذا الحساب ليس مدير المنصة بعد.</p>
        <p class="muted">لتفعيله: انسخ رقم الحساب التالي وضعه في قواعد Firebase مكان <code>ADMIN_UID</code>.</p>
        <div class="px-fam-code"><b dir="ltr">${esc(u.uid)}</b><button type="button" class="btn ghost small" id="ad-cp">نسخ</button></div></section>`, '<button type="button" class="btn ghost small" id="sc-out">خروج</button>');
      document.getElementById('ad-cp').onclick = () => copyText(u.uid, 'تم النسخ ✓');
      document.getElementById('sc-out').onclick = signOut; return;
    }
    const nameOf = new Map(schools.map(s => [s.id, s]));
    app.innerHTML = page('🛡️ مدير المنصة', `${num(schools.length)} مدرسة · ${num(reqs.length)} طلب جديد`, `
      <section class="card"><h2>طلبات التسجيل</h2>${reqs.length ? `<ul class="pg-list">${reqs.sort((a, b) => b.at - a.at).map(r => `<li><div><b>${esc(r.name)}</b><small>${esc(r.region)} · ${esc((r.stages || []).join('، '))} · تواصل: <span dir="ltr">${esc(r.contact)}</span></small></div>
        <button type="button" class="btn small" data-ok="${r.id}">موافقة</button><button type="button" class="linkish" data-no="${r.id}">رفض</button></li>`).join('')}</ul>` : '<p class="empty">لا توجد طلبات جديدة.</p>'}</section>
      <section class="card"><h2>إضافة مدرسة مباشرة</h2><form class="px-form" id="ad-add">
        <label class="wide"><span>اسم المدرسة</span><input id="ad-n" required maxlength="100"></label>
        <label><span>المنطقة</span><select id="ad-r">${regionOpts()}</select></label>
        <fieldset class="sc-stages"><legend>المراحل</legend>${STAGES.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label>`).join('')}</fieldset>
        <button class="btn" type="submit">إضافة</button></form></section>
      <section class="card"><h2>المدارس</h2>${schools.length ? `<ul class="pg-list">${schools.sort((a, b) => a.name.localeCompare(b.name, 'ar')).map(s => `<li><div><b>${esc(s.name)}</b><small>${esc(s.region)} · ${esc((s.stages || []).join('، '))}</small></div>
        <button type="button" class="btn ghost small" data-inv="${s.id}">رابط حساب المدرسة</button></li>`).join('')}</ul>` : '<p class="empty">لا توجد مدارس بعد.</p>'}</section>`,
      '<button type="button" class="btn ghost small" id="sc-out">خروج</button>');
    document.getElementById('sc-out').onclick = signOut;
    const createSchool = async (data) => { const sid = rid(16); await db.set('schools/' + sid, Object.assign({ created: Date.now() }, data)); return sid; };
    const invite = async sid => {
      const token = rid(24); await db.set('invites/' + token, { type: 'school', sid, at: Date.now() });
      const s = nameOf.get(sid) || { name: '' };
      shareWindow({ title: 'رابط حساب المدرسة', url: siteUrl('staff-invite-' + token), text: `رابط تفعيل حساب «${s.name}» في منصة قِمّة (لإدارة المدرسة فقط):`, note: '🔒 هذا الرابط يمنح صلاحية إدارة المدرسة، فأرسله لمسؤول المدرسة فقط.' });
    };
    app.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => {
      const r = reqs.find(x => x.id === b.dataset.ok); b.disabled = true;
      try { const sid = await createSchool({ name: r.name, region: r.region, stages: r.stages || [] }); nameOf.set(sid, { name: r.name }); await db.del('schoolRequests/' + r.id); await invite(sid); N().toast('تمت الموافقة ✓ أرسل الرابط للمدرسة'); }
      catch (e) { b.disabled = false; N().toast(errTxt(e)); }
    });
    app.querySelectorAll('[data-no]').forEach(b => b.onclick = async () => { if (!(await N().ask('رفض الطلب وحذفه؟', 'رفض', true))) return; try { await db.del('schoolRequests/' + b.dataset.no); renderAdmin(); } catch (e) { N().toast(errTxt(e)); } });
    app.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => invite(b.dataset.inv).catch(e => N().toast(errTxt(e))));
    document.getElementById('ad-add').onsubmit = async e => {
      e.preventDefault(); const stages = [...document.querySelectorAll('#ad-add .sc-stages input:checked')].map(x => x.value);
      if (!stages.length) return N().toast('اختر مرحلة واحدة على الأقل');
      try { const name = document.getElementById('ad-n').value.trim(); const sid = await createSchool({ name, region: document.getElementById('ad-r').value, stages }); nameOf.set(sid, { name }); await invite(sid); renderAdmin(); }
      catch (x) { N().toast(errTxt(x)); }
    };
  }

  /* ================= قبول دعوة (حساب مدرسة أو معلم) ================= */
  async function renderStaffInvite(token) {
    const u = await needUser(() => renderStaffInvite(token), 'سجّل الدخول أولاً لقبول الدعوة.'); if (!u) return;
    const app = N().app;
    let inv, school;
    try { inv = await db.get('invites/' + token); school = inv && await db.get('schools/' + inv.sid); } catch (e) { inv = null; }
    if (!inv || !school) { app.innerHTML = page('الدعوة غير صالحة', 'ربما انتهت أو أُلغيت. اطلب رابطاً جديداً.', ''); return; }
    const role = inv.type === 'school' ? 'school' : 'teacher';
    app.innerHTML = page(role === 'school' ? '🏫 تفعيل حساب المدرسة' : '👩‍🏫 الانضمام كمعلم', `${esc(school.name)} · ${esc(school.region)}`, `
      <form class="card px-form sc-form" id="si"><label class="wide"><span>${role === 'school' ? 'اسم المسؤول' : 'اسمك كما يظهر لأولياء الأمور'}</span><input id="si-n" required maxlength="60" value="${esc(u.displayName || '')}"></label>
      <button class="btn" type="submit">${role === 'school' ? 'تفعيل الحساب' : 'انضمام'}</button><p class="err" id="si-e" role="alert"></p></form>`);
    document.getElementById('si').onsubmit = async e => {
      e.preventDefault(); const er = document.getElementById('si-e'); er.textContent = '⏳';
      try { await db.set('staff/' + u.uid, { role, sid: inv.sid, invite: token, name: document.getElementById('si-n').value.trim(), at: Date.now() }); history.replaceState(null, '', '#staff'); renderStaff(); }
      catch (x) { er.textContent = errTxt(x); }
    };
  }

  /* ================= لوحة المدرسة / المعلم ================= */
  let staffCache = null;
  async function loadStaff(u) {
    const me = await db.get('staff/' + u.uid);
    if (!me) return null;
    const school = await db.get('schools/' + me.sid);
    staffCache = { me, school }; return staffCache;
  }
  async function renderStaff() {
    const u = await needUser(renderStaff); if (!u) return;
    const app = N().app; app.innerHTML = '<p class="empty">⏳ جارٍ التحميل…</p>';
    let st; try { st = await loadStaff(u); } catch (e) { app.innerHTML = page('تعذّر التحميل', errTxt(e), ''); return; }
    if (!st) {
      app.innerHTML = page('👋 أهلاً', `أنت مسجّل باسم ${esc(u.email || u.displayName || '')}`, `<section class="card"><p>هذا الحساب غير مرتبط بمدرسة بعد.</p>
        <ul class="px-steps"><li>إذا كنت معلماً: اطلب من إدارة مدرستك «رابط دعوة المعلمين» وافتحه.</li><li>إذا كنتم مدرسة جديدة: <a href="#school-request">أرسلوا طلب تسجيل</a>.</li></ul></section>`, '<button type="button" class="btn ghost small" id="sc-out">خروج</button>');
      document.getElementById('sc-out').onclick = signOut; return;
    }
    const { me, school } = st;
    const classes = await db.query('classes', me.role === 'school' ? [['sid', '==', me.sid]] : [['teacher', '==', u.uid]]).catch(() => []);
    const teachers = me.role === 'school' ? await db.query('staff', [['sid', '==', me.sid]]).catch(() => []) : [];
    const tname = new Map(teachers.map(t => [t.id, t.name]));
    classes.sort((a, b) => ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade) || String(a.section).localeCompare(String(b.section)));
    app.innerHTML = page(me.role === 'school' ? `🏫 ${esc(school ? school.name : '')}` : `👩‍🏫 ${esc(me.name)}`, `${esc(school ? school.name + ' · ' + school.region : '')} · ${me.role === 'school' ? 'حساب المدرسة' : 'معلم'}`, `
      ${me.role === 'school' ? `<div id="sd-root" class="sd-root" aria-live="polite"><section class="card"><p class="muted" style="margin:0">⏳ جارٍ حساب إحصائيات المدرسة…</p></section></div>` : ''}
      ${me.role === 'school' ? `<section class="card"><div class="pg-row"><h2>المعلمون (${num(teachers.filter(t => t.role === 'teacher').length)})</h2><button type="button" class="btn small" id="st-inv">+ دعوة معلمين</button></div>
        <ul class="pg-list">${teachers.map(t => `<li><div><b>${esc(t.name)}</b><small>${t.role === 'school' ? 'حساب المدرسة' : 'معلم'}</small></div>${t.role === 'teacher' ? `<button type="button" class="linkish" data-rm="${t.id}">إزالة</button>` : ''}</li>`).join('')}</ul></section>` : ''}
      <section class="card"><div class="pg-row"><h2>الفصول (${num(classes.length)})</h2></div>
        ${classes.length ? `<div class="sc-classes">${classes.map(c => `<button type="button" class="sc-class" data-cls="${c.id}"><b>${esc(c.grade)} · ${esc(c.section)}</b><small>${esc(subjLabel(c))}${c.title ? ' · ' + esc(c.title) : ''}${me.role === 'school' ? ' · ' + esc(tname.get(c.teacher) || '') : ''}</small><span class="sc-stat" data-stat="${c.id}">⏳</span></button>`).join('')}</div>` : '<p class="empty">لا توجد فصول بعد.</p>'}
        <form class="px-form" id="st-add"><label><span>الصف</span><select id="st-g">${gradeOpts('الصف العاشر')}</select></label>
          <label><span>الشعبة</span><input id="st-s" required maxlength="10" placeholder="مثال: 3"></label>
          <label><span>المادة التي تدرّسها</span><select id="st-sub" required><option value="">— اختر —</option>${subjectOpts()}</select></label>
          <label><span>ملاحظة (اختياري)</span><input id="st-t" maxlength="40" placeholder="مثال: مجموعة التقوية"></label>
          <button class="btn" type="submit">+ إنشاء فصل</button></form></section>
      <section class="card sc-ranks"><h2>🏆 ترتيب المدرسة</h2><div id="st-rank"><p class="muted">⏳</p></div></section>`,
      '<button type="button" class="btn ghost small" id="sc-out">خروج</button>');
    document.getElementById('sc-out').onclick = signOut;
    const inv = document.getElementById('st-inv');
    if (inv) inv.onclick = async () => {
      try { const token = rid(24); await db.set('invites/' + token, { type: 'teacher', sid: me.sid, at: Date.now() });
        shareWindow({ title: 'دعوة المعلمين', url: siteUrl('staff-invite-' + token), text: `رابط انضمام معلمي «${school.name}» إلى منصة قِمّة:`, note: 'يمكن لأكثر من معلم استخدام هذا الرابط. أرسله لمعلمي المدرسة فقط.' }); }
      catch (e) { N().toast(errTxt(e)); }
    };
    app.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if (!(await N().ask('إزالة هذا المعلم من المدرسة؟', 'إزالة', true))) return; try { await db.del('staff/' + b.dataset.rm); renderStaff(); } catch (e) { N().toast(errTxt(e)); } });
    app.querySelectorAll('[data-cls]').forEach(b => b.onclick = () => N().go('#staff-class-' + b.dataset.cls));
    document.getElementById('st-add').onsubmit = async e => {
      e.preventDefault();
      const cid = rid(14);
      const subject = document.getElementById('st-sub').value; if (!subject) return N().toast('اختر المادة');
      try { await db.set('classes/' + cid, { sid: me.sid, teacher: u.uid, teacherName: me.name, subject, grade: document.getElementById('st-g').value, section: document.getElementById('st-s').value.trim(), title: document.getElementById('st-t').value.trim(), schoolName: school.name, region: school.region, open: true, created: Date.now() });
        N().go('#staff-class-' + cid); }
      catch (x) { N().toast(errTxt(x)); }
    };
    // ملخص كل فصل: عدد الطلاب والنشطين ومتوسط الأسبوع، مع تنبيه عند التراجع
    kidsCache = new Map();
    classStats(classes.slice(0, 30));
    if (me.role === 'school') schoolDash({ me, school, classes: classes.slice(0, 60), teachers, tname });
    // ترتيب المدرسة من لوحة الشرف المشتركة
    const el = document.getElementById('st-rank');
    try { const list = await window.NQGame.backend.list(true); el.innerHTML = schoolBoardHtml(list.filter(x => x.cls && x.cls.sid === me.sid)); }
    catch (e) { el.innerHTML = '<p class="muted">تعذّر تحميل الترتيب.</p>'; }
  }
  // طلاب كل فصل (تُحمّل مرة واحدة لكل عرض للصفحة ويستخدمها الملخص ولوحة المدرسة)
  let kidsCache = new Map();
  const loadKids = c => {
    if (!kidsCache.has(c.id)) kidsCache.set(c.id, db.query('students', [], { parent: 'classes/' + c.id, limit: 200 })
      .then(rows => rows.map(r => { try { return JSON.parse(r.json); } catch (e) { return null; } }).filter(Boolean)));
    return kidsCache.get(c.id);
  };
  async function classStats(classes) {
    const now = Date.now(), avg = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.pct, 0) / rs.length) : null;
    await Promise.all(classes.map(async c => {
      const el = document.querySelector(`[data-stat="${c.id}"]`); if (!el) return;
      try {
        const kids = await loadKids(c);
        const w = kids.map(p => (p.records || []).filter(r => r.date > now - 7 * DAY)), pw = kids.flatMap(p => (p.records || []).filter(r => r.date > now - 14 * DAY && r.date <= now - 7 * DAY));
        const act = w.filter(x => x.length).length, a = avg(w.flat()), b = avg(pw), down = a != null && b != null && a <= b - 5;
        el.innerHTML = kids.length ? `${kidsN(kids.length)} · ${num(act)} نشط هذا الأسبوع${a != null ? ` · متوسط ${num(a)}٪` : ''}${down ? ` <b class="sc-down" title="تراجع عن الأسبوع الماضي">⚠️ تراجع ${num(b - a)}٪</b>` : ''}` : 'لم ينضم طلاب بعد';
        if (down) el.closest('.sc-class').classList.add('warn');
      } catch (e) { el.textContent = ''; }
    }));
  }
  /* ================= لوحة حساب المدرسة ================= */
  const sdView = { sort: 'avg', dir: -1 };
  const avgOf = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.pct, 0) / rs.length) : null;
  const twoNames = n => String(n || '').trim().split(/\s+/).slice(0, 2).join(' ');
  const monthName = () => new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  async function schoolDash({ me, school, classes, teachers, tname }) {
    const root = document.getElementById('sd-root'); if (!root) return;
    const NQ = N(), now = Date.now(), W = 7 * DAY, M = 30 * DAY;
    // 1) تحميل طلاب كل الفصول ودمج الطالب الموجود في أكثر من فصل
    const perClass = await Promise.all(classes.map(c => loadKids(c).then(k => ({ c, kids: k })).catch(() => ({ c, kids: [] }))));
    if (!document.getElementById('sd-root')) return;
    await Promise.all([...new Set(classes.map(c => c.grade))].map(g => window.NQLoadGrade ? window.NQLoadGrade(g).catch(() => { }) : null));
    const byId = new Map();
    perClass.forEach(({ c, kids }) => kids.forEach(p => {
      const o = byId.get(p.id);
      if (!o) byId.set(p.id, Object.assign({}, p, { records: (p.records || []).slice(), _cls: [c], _allow: new Set(p._allowed || gradeSubs(p.grade).map(s => s.id)) }));
      else { const seen = new Set(o.records.map(r => r.id)); (p.records || []).forEach(r => { if (!seen.has(r.id)) o.records.push(r); }); o._cls.push(c); (p._allowed || gradeSubs(p.grade).map(s => s.id)).forEach(x => o._allow.add(x)); }
    }));
    const all = [...byId.values()];
    const wk = p => p.records.filter(r => r.date > now - W), pwk = p => p.records.filter(r => r.date > now - 2 * W && r.date <= now - W);
    const act = all.filter(p => wk(p).length), sAvg = avgOf(all.flatMap(wk)), sPrev = avgOf(all.flatMap(pwk));
    const trendTxt = (a, b) => a == null || b == null ? '<span class="pr-flat">—</span>' : a > b ? `<span class="pr-up">▲ ${num(a - b)}</span>` : a < b ? `<span class="pr-down">▼ ${num(b - a)}</span>` : '<span class="pr-flat">=</span>';
    const color = v => v == null ? 'var(--muted)' : NQ.gradeOf(v).c;
    const pctTxt = v => v == null ? '—' : num(v) + '٪';
    const grades = [...new Set(all.map(p => p.grade))].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b));
    const gradeRows = grades.map(g => { const ps = all.filter(p => p.grade === g); return { g, n: ps.length, act: ps.filter(p => wk(p).length).length, avg: avgOf(ps.flatMap(wk)), prev: avgOf(ps.flatMap(pwk)) }; });

    // 2) مقارنة الفصول
    const clsRows = perClass.map(({ c, kids }) => { const w = kids.map(p => (p.records || []).filter(r => r.date > now - W)); const pw = kids.flatMap(p => (p.records || []).filter(r => r.date > now - 2 * W && r.date <= now - W));
      return { c, teacher: tname.get(c.teacher) || c.teacherName || '', n: kids.length, act: kids.length ? Math.round(w.filter(x => x.length).length / kids.length * 100) : null, avg: avgOf(w.flat()), prev: avgOf(pw) }; });

    // 3) ترتيب المدرسة في المنطقة والكويت (متوسط نقاط أفضل 20 طالباً هذا الأسبوع)
    let rankHtml = '<p class="muted">تعذّر تحميل الترتيب.</p>';
    try {
      const list = await window.NQGame.backend.list(true), wkKey = window.NQGame._weekKey(), by = {};
      list.filter(e => e.cls && e.cls.sid && e.week === wkKey && (e.weekXp || 0) > 0).forEach(e => { (by[e.cls.sid] = by[e.cls.sid] || { name: e.cls.school, region: e.cls.region, xs: [] }).xs.push(e.weekXp); });
      const rows = Object.entries(by).map(([sid, v]) => ({ sid, ...v, score: Math.round(v.xs.sort((a, b) => b - a).slice(0, 20).reduce((a, b) => a + b, 0) / 20) })).sort((a, b) => b.score - a.score);
      const place = rs => { const i = rs.findIndex(r => r.sid === me.sid); return i < 0 ? null : { i, n: rs.length, gap: i > 0 ? rs[i - 1].score - rs[i].score + 1 : 0, above: i > 0 ? rs[i - 1].name : null, score: rs[i].score }; };
      const k = place(rows), reg = place(rows.filter(r => r.region === school.region));
      rankHtml = k ? `<div class="sd-rank"><div><small>في ${esc(school.region)}</small><b>${num(reg.i + 1)}</b><small>من ${cnt(reg.n, 'مدرسة واحدة', 'مدرستين', 'مدارس', 'مدرسة')}</small></div><div><small>على مستوى الكويت</small><b>${num(k.i + 1)}</b><small>من ${cnt(k.n, 'مدرسة واحدة', 'مدرستين', 'مدارس', 'مدرسة')}</small></div><div><small>نقاط المدرسة هذا الأسبوع</small><b>${num(k.score)}</b><small>متوسط أفضل 20 طالباً</small></div></div>
        <p class="sd-gap">${reg.i === 0 ? `🥇 مدرستكم الأولى في ${esc(school.region)} هذا الأسبوع! حافظوا على الصدارة.` : `تحتاجون <b>${cnt(reg.gap, 'نقطة واحدة', 'نقطتين', 'نقاط', 'نقطة')}</b> إضافية في المتوسط لتتقدموا على «${esc(reg.above)}» في ${esc(school.region)}.`}</p>`
        : '<p class="muted">مدرستكم لم تدخل الترتيب هذا الأسبوع بعد. تدخل المدرسة الترتيب عندما يجمع طلابها نقاطاً هذا الأسبوع.</p>';
    } catch (e) { }

    // 4) نشاط المعلمين
    const tRows = teachers.filter(t => t.role === 'teacher').map(t => {
      const mine = perClass.filter(x => x.c.teacher === t.id), kids = mine.flatMap(x => x.kids);
      const tasks = mine.reduce((a, x) => a + (Array.isArray(x.c.tasks) ? x.c.tasks.filter(k => now - (k.created || 0) < M).length : 0), 0);
      const lastMsg = Math.max(0, ...mine.map(x => (x.c.msg && x.c.msg.t) || 0));
      return { t, cls: mine.length, n: kids.length, act: kids.length ? Math.round(kids.filter(p => (p.records || []).some(r => r.date > now - W)).length / kids.length * 100) : null, tasks, lastMsg };
    }).sort((a, b) => b.n - a.n);

    // 5) أضعف الدروس على مستوى المدرسة
    const weakL = [];
    grades.forEach(g => gradeSubs(g).forEach(s => {
      const ps = all.filter(p => p.grade === g && p._allow.has(s.id)); if (ps.length < 3) return;
      const bests = ps.map(p => NQ.subjectStats(s, p.records).best);
      s.units.forEach(u => u.lessons.forEach(l => { const k = u.id + '/' + l.id, v = bests.map(b => b[k]).filter(x => x != null); if (v.length >= 3) { const a = Math.round(v.reduce((x, y) => x + y, 0) / v.length); if (a < 65) weakL.push({ g, s, l, a, n: v.length }); } }));
    }));
    weakL.sort((a, b) => a.a - b.a);

    // 8) أبطال الشهر لكل صف (يُستثنى من أخفى ولي أمره اسمه من لوحة الشرف)
    const heroes = grades.map(g => ({ g, top: all.filter(p => p.grade === g && !p.hidden).map(p => ({ p, xp: p.records.filter(r => r.date > now - M).reduce((a, r) => a + (r.xp || 0), 0) })).filter(x => x.xp > 0).sort((a, b) => b.xp - a.xp).slice(0, 3) })).filter(x => x.top.length);
    const sectionOf = p => (p._cls[0] && p._cls[0].section) || '';

    const cols = [['cls', 'الفصل'], ['teacher', 'المعلم'], ['n', 'الطلاب'], ['act', 'النشطون'], ['avg', 'متوسط الأسبوع'], ['tr', 'الاتجاه']];
    const sortV = (r, k) => k === 'cls' ? ALL_GRADES.indexOf(r.c.grade) * 100 + (parseInt(r.c.section, 10) || 0) : k === 'teacher' ? r.teacher : k === 'tr' ? (r.avg != null && r.prev != null ? r.avg - r.prev : -999) : r[k] == null ? -1 : r[k];
    const clsTable = () => clsRows.slice().sort((a, b) => { const x = sortV(a, sdView.sort), y = sortV(b, sdView.sort); return (typeof x === 'string' ? x.localeCompare(y, 'ar') : x - y) * sdView.dir; })
      .map(r => `<tr class="${r.avg != null && r.prev != null && r.avg <= r.prev - 5 ? 'sd-down' : ''}"><td><button type="button" class="linkish" data-sdcls="${r.c.id}">${esc(r.c.grade)} · ${esc(r.c.section)}</button><small class="sc-allowed">${esc(subjLabel(r.c))}</small></td><td>${esc(r.teacher)}</td><td>${num(r.n)}</td><td>${r.act == null ? '—' : num(r.act) + '٪'}</td><td style="color:${color(r.avg)};font-weight:800">${pctTxt(r.avg)}</td><td>${trendTxt(r.avg, r.prev)}</td></tr>`).join('');
    const clsHead = () => cols.map(([k, t]) => `<th aria-sort="${sdView.sort === k ? (sdView.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sc-sort" data-sdsort="${k}">${t}${sdView.sort === k ? (sdView.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`).join('');
    const ago = t => { if (!t) return '—'; const d = Math.floor((now - t) / DAY); return d <= 0 ? 'اليوم' : d === 1 ? 'أمس' : `منذ ${num(d)} أيام`; };

    root.innerHTML = `
      <section class="pg-tiles">
        <div class="card pg-tile"><small>الطلاب المنضمون</small><b>${num(all.length)}</b><small class="note muted">في ${cnt(classes.length, 'فصل واحد', 'فصلين', 'فصول', 'فصلاً')}</small></div>
        <div class="card pg-tile"><small>نشطون هذا الأسبوع</small><b>${all.length ? num(Math.round(act.length / all.length * 100)) + '٪' : '—'}</b><small class="note muted">${num(act.length)} من ${num(all.length)}</small></div>
        <div class="card pg-tile"><small>متوسط المدرسة (7 أيام)</small><b style="color:${color(sAvg)}">${pctTxt(sAvg)}</b><small class="note">${trendTxt(sAvg, sPrev)} عن الأسبوع الماضي</small></div>
        <div class="card pg-tile"><small>أسئلة هذا الأسبوع</small><b>${num(all.reduce((a, p) => a + wk(p).reduce((s, r) => s + (r.total || 0), 0), 0))}</b><small class="note muted">من كل طلاب المدرسة</small></div>
      </section>
      <div class="sd-actions db-btns"><button type="button" class="btn" id="sd-ann">📣 إعلان للمدرسة</button><button type="button" class="btn ghost" id="sd-report">🖨️ تقرير المدرسة الشهري</button><button type="button" class="btn ghost" id="sd-poster" ${heroes.length ? '' : 'disabled'}>🏆 لوحة شرف للطباعة</button></div>
      <section class="pg-grid2">
        <div class="card"><h2>🏅 ترتيب المدرسة</h2>${rankHtml}</div>
        <div class="card"><h2>📚 حسب الصف</h2>${gradeRows.length ? `<table class="px-table"><thead><tr><th>الصف</th><th>الطلاب</th><th>النشطون</th><th>المتوسط</th><th></th></tr></thead><tbody>${gradeRows.map(r => `<tr><td><b>${esc(r.g)}</b></td><td>${num(r.n)}</td><td>${r.n ? num(Math.round(r.act / r.n * 100)) + '٪' : '—'}</td><td style="color:${color(r.avg)};font-weight:800">${pctTxt(r.avg)}</td><td>${trendTxt(r.avg, r.prev)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">لم ينضم طلاب بعد.</p>'}</div>
      </section>
      <section class="card"><h2>🏫 مقارنة الفصول</h2>${clsRows.length ? `<div class="table-wrap"><table class="px-table sc-table"><thead><tr id="sd-th">${clsHead()}</tr></thead><tbody id="sd-tb">${clsTable()}</tbody></table></div><p class="hint" style="margin:6px 0 0">الصف الملوّن: تراجع متوسطه ٥٪ أو أكثر عن الأسبوع الماضي.</p>` : '<p class="empty">لا توجد فصول بعد.</p>'}</section>
      <section class="card"><h2>👩‍🏫 نشاط المعلمين</h2>${tRows.length ? `<div class="table-wrap"><table class="px-table"><thead><tr><th>المعلم</th><th>الفصول</th><th>الطلاب</th><th>طلاب نشطون</th><th>واجبات هذا الشهر</th><th>آخر رسالة للفصل</th></tr></thead><tbody>${tRows.map(r => `<tr class="${r.cls && !r.tasks && !r.lastMsg ? 'sd-quiet' : ''}"><td><b>${esc(r.t.name)}</b></td><td>${num(r.cls)}</td><td>${num(r.n)}</td><td>${r.act == null ? '—' : num(r.act) + '٪'}</td><td>${num(r.tasks)}</td><td>${ago(r.lastMsg)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">لم ينضم معلمون بعد. ادعهم من قسم «المعلمون» أدناه.</p>'}</section>
      <section class="card"><h2>⚠️ أضعف الدروس في المدرسة</h2><p class="muted" style="margin:0 0 8px">دروس متوسط طلاب المدرسة فيها أقل من 65٪ (3 طلاب على الأقل حلّوها) — مفيدة لرؤساء الأقسام.</p>
        ${weakL.length ? `<ul class="pg-list">${weakL.slice(0, 10).map(w => `<li><span class="dot" style="background:${color(w.a)}"></span><div><b>${esc(w.l.short)}: ${esc(w.l.name)}</b><small>${esc(w.g)} · ${w.s.icon} ${esc(w.s.name)} · ${kidsN(w.n)}</small></div><span class="pct" style="color:${color(w.a)}">${num(w.a)}٪</span></li>`).join('')}</ul>` : '<p class="empty">لا توجد دروس ضعيفة على مستوى المدرسة حالياً 👏</p>'}</section>`;

    const bindT = () => { root.querySelectorAll('[data-sdsort]').forEach(b => b.onclick = () => { const k = b.dataset.sdsort; sdView.dir = sdView.sort === k ? -sdView.dir : (k === 'cls' || k === 'teacher' ? 1 : -1); sdView.sort = k; document.getElementById('sd-th').innerHTML = clsHead(); document.getElementById('sd-tb').innerHTML = clsTable(); bindT(); }); root.querySelectorAll('[data-sdcls]').forEach(b => b.onclick = () => N().go('#staff-class-' + b.dataset.sdcls)); };
    bindT();

    // 6) إعلان للمدرسة كلها: يُكتب في كل فصول المدرسة ويظهر لكل طلابها
    document.getElementById('sd-ann').onclick = () => {
      const ov = document.createElement('div'); ov.className = 'overlay';
      ov.innerHTML = `<form class="card" role="dialog" aria-modal="true" aria-labelledby="sda-t" style="max-width:480px"><h2 id="sda-t">📣 إعلان لكل طلاب المدرسة</h2>
        <p class="muted" style="margin:0">يظهر أعلى صفحة كل طالب منضم في ${cnt(classes.length, 'فصل واحد', 'فصلين', 'فصول', 'فصلاً')}، باسم «${esc(school.name)}». يحل محل آخر رسالة للفصل.</p>
        <label class="sr" for="sda-x">نص الإعلان</label><textarea id="sda-x" rows="3" maxlength="160" required placeholder="مثال: بالتوفيق في اختبارات نهاية الفترة 🍀" style="width:100%;box-sizing:border-box;margin:10px 0;padding:10px;border-radius:12px;border:1.5px solid var(--line);font:inherit;background:var(--field);color:var(--ink)"></textarea>
        <p class="muted" id="sda-p" style="margin:0" aria-live="polite"></p>
        <div class="actions"><button type="button" class="btn ghost" data-x>إلغاء</button><button class="btn" type="submit">إرسال للجميع</button></div></form>`;
      document.body.appendChild(ov); ov.querySelector('textarea').focus();
      ov.querySelector('[data-x]').onclick = () => ov.remove();
      ov.querySelector('form').onsubmit = async e => {
        e.preventDefault(); const text = ov.querySelector('textarea').value.trim().slice(0, 160); if (!text) return;
        const btn = ov.querySelector('[type=submit]'), pr = ov.querySelector('#sda-p'); btn.disabled = true; let ok = 0, bad = 0;
        const t = Date.now();
        for (const c of classes) { try { await db.set('classes/' + c.id, Object.assign({}, stripId(c), { msg: { text, t, by: school.name } })); c.msg = { text, t, by: school.name }; ok++; } catch (x) { bad++; } pr.textContent = `⏳ ${num(ok + bad)} من ${num(classes.length)}…`; }
        ov.remove(); N().toast(bad ? `أُرسل الإعلان إلى ${cnt(ok, 'فصل واحد', 'فصلين', 'فصول', 'فصلاً')}، وتعذّر ${cnt(bad, 'فصل واحد', 'فصلين', 'فصول', 'فصلاً')}` : 'تم إرسال الإعلان لكل فصول المدرسة ✓');
      };
    };

    // 7 و 8) تقرير شهري ولوحة شرف (صفحة A4 للطباعة أو الحفظ PDF)
    const printSheet = (label, html) => {
      const ov = document.createElement('div'); ov.className = 'overlay ws-print';
      ov.innerHTML = `<div class="card ws-modal" role="dialog" aria-modal="true" aria-label="${label}"><div class="no-print ws-bar"><b>${label}</b><div><button type="button" class="btn" data-pr>🖨️ طباعة / حفظ PDF</button> <button type="button" class="btn ghost" data-x>إغلاق</button></div></div><div class="ws-paper">${html}</div></div>`;
      const close = () => { ov.remove(); document.body.classList.remove('ws-printing'); };
      ov.querySelector('[data-x]').onclick = close; ov.onclick = e => { if (e.target === ov) close(); };
      ov.querySelector('[data-pr]').onclick = () => { document.body.classList.add('ws-printing'); try { window.print(); } catch (x) { N().toast('الطباعة غير متاحة هنا'); } setTimeout(() => document.body.classList.remove('ws-printing'), 800); };
      document.body.appendChild(ov); ov.querySelector('[data-pr]').focus();
    };
    document.getElementById('sd-report').onclick = () => {
      const mAll = all.flatMap(p => p.records.filter(r => r.date > now - M));
      printSheet('تقرير المدرسة الشهري', `<div class="sdr">
        <div class="ws-head"><div><h2>تقرير المدرسة الشهري</h2><p>${esc(school.name)} · ${esc(school.region)} · آخر 30 يوماً حتى ${new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><div class="ws-brand"><b>قِمّة</b><small>تعلَّم. أتقِن. تصدَّر.</small></div></div>
        <div class="sdr-kpis"><div><b>${num(all.length)}</b><small>طالباً منضماً</small></div><div><b>${num(all.filter(p => p.records.some(r => r.date > now - M)).length)}</b><small>نشطون هذا الشهر</small></div><div><b>${pctTxt(avgOf(mAll))}</b><small>متوسط الدرجات</small></div><div><b>${num(mAll.reduce((a, r) => a + (r.total || 0), 0))}</b><small>سؤالاً محلولاً</small></div></div>
        <h3>حسب الصف</h3><table><thead><tr><th>الصف</th><th>الطلاب</th><th>النشطون (7 أيام)</th><th>متوسط الأسبوع</th></tr></thead><tbody>${gradeRows.map(r => `<tr><td>${esc(r.g)}</td><td>${num(r.n)}</td><td>${r.n ? num(Math.round(r.act / r.n * 100)) + '٪' : '—'}</td><td>${pctTxt(r.avg)}</td></tr>`).join('')}</tbody></table>
        <h3>الفصول</h3><table><thead><tr><th>الفصل</th><th>المادة</th><th>المعلم</th><th>الطلاب</th><th>النشطون</th><th>المتوسط</th></tr></thead><tbody>${clsRows.map(r => `<tr><td>${esc(r.c.grade)} · ${esc(r.c.section)}</td><td>${esc(subjLabel(r.c))}</td><td>${esc(r.teacher)}</td><td>${num(r.n)}</td><td>${r.act == null ? '—' : num(r.act) + '٪'}</td><td>${pctTxt(r.avg)}</td></tr>`).join('')}</tbody></table>
        ${tRows.length ? `<h3>نشاط المعلمين</h3><table><thead><tr><th>المعلم</th><th>الفصول</th><th>الطلاب</th><th>واجبات الشهر</th></tr></thead><tbody>${tRows.map(r => `<tr><td>${esc(r.t.name)}</td><td>${num(r.cls)}</td><td>${num(r.n)}</td><td>${num(r.tasks)}</td></tr>`).join('')}</tbody></table>` : ''}
        ${weakL.length ? `<h3>أضعف الدروس</h3><table><thead><tr><th>الدرس</th><th>الصف والمادة</th><th>المتوسط</th></tr></thead><tbody>${weakL.slice(0, 8).map(w => `<tr><td>${esc(w.l.short)}: ${esc(w.l.name)}</td><td>${esc(w.g)} · ${esc(w.s.name)}</td><td>${num(w.a)}٪</td></tr>`).join('')}</tbody></table>` : ''}
        ${heroes.length ? `<h3>أبطال الشهر</h3><table><thead><tr><th>الصف</th><th>الطلاب</th></tr></thead><tbody>${heroes.map(h => `<tr><td>${esc(h.g)}</td><td>${h.top.map(x => esc(twoNames(x.p.name))).join('، ')}</td></tr>`).join('')}</tbody></table>` : ''}
      </div>`);
    };
    document.getElementById('sd-poster').onclick = () => printSheet('لوحة شرف للطباعة', `<div class="sdp">
        <div class="sdp-top"><svg aria-hidden="true" width="84" height="60" viewBox="0 0 56 40"><path d="M2 38L20 10l8 11 6-8 20 25z" fill="#0f766e"/><path d="M20 10l5 7-5-1-4 5z" fill="#fff" opacity=".85"/><path d="M34 13V1" stroke="#10233f" stroke-width="1.6"/><path d="M34 1h9l-2.5 3 2.5 3h-9z" fill="#f2b705"/></svg>
          <h1>🏆 أبطال الشهر</h1><p>${esc(school.name)} · ${monthName()}</p></div>
        <div class="sdp-grid">${heroes.map(h => `<div class="sdp-g"><h2>${esc(h.g)}</h2><ol>${h.top.map((x, i) => `<li><span>${['🥇', '🥈', '🥉'][i]}</span><b>${esc(twoNames(x.p.name))}</b>${sectionOf(x.p) ? `<small>شعبة ${esc(sectionOf(x.p))}</small>` : ''}</li>`).join('')}</ol></div>`).join('')}</div>
        <p class="sdp-foot">رحلتك إلى القمّة تبدأ هنا · منصة قِمّة لاختبارات المنهج الكويتي</p></div>`);
  }
  function schoolBoardHtml(entries) {
    const wk = window.NQGame._weekKey();
    const fresh = entries.filter(e => e.week === wk && (e.weekXp || 0) > 0);
    if (!fresh.length) return '<p class="empty">لا توجد نقاط هذا الأسبوع بعد.</p>';
    const byGrade = {}; fresh.forEach(e => (byGrade[e.grade] = byGrade[e.grade] || []).push(e));
    return `<div class="sc-rank-grid">${Object.entries(byGrade).sort((a, b) => ALL_GRADES.indexOf(a[0]) - ALL_GRADES.indexOf(b[0])).map(([g, es]) => `<div><b>${esc(g)}</b><ol class="sc-mini">${es.sort((a, b) => b.weekXp - a.weekXp).slice(0, 5).map(e => `<li><span>${esc(e.name)}${e.cls && e.cls.section ? ` <small>(${esc(e.cls.section)})</small>` : ''}</span><b>${num(e.weekXp)}</b></li>`).join('')}</ol></div>`).join('')}</div>`;
  }

  /* ----- فصل واحد ----- */
  // مواد المعلم في هذا الفصل (مربي الفصل: كل مواد الصف)
  const teachSubs = c => { const all = gradeSubs(c.grade); if (!c.subject || c.subject === ALL_SUBJ) return all; const m = all.filter(s => s.name === c.subject); return m.length ? m : all; };
  function keyTitle(s, key) {
    const [u, l] = String(key).split('/'); const unit = s.units.find(x => x.id === u); if (!unit) return null;
    if (l === 'exam') return 'الاختبار الشامل – ' + unit.name.split(':')[0];
    const les = unit.lessons.find(x => x.id === l); return les ? les.short + ': ' + les.name : null;
  }
  const pad2 = n => String(n).padStart(2, '0');
  const ymd = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const dueTxt = d => { if (!d) return 'بدون موعد'; const n = Math.round((new Date(d + 'T00:00') - new Date(ymd() + 'T00:00')) / DAY); return n < 0 ? 'انتهى الموعد' : n === 0 ? 'آخر موعد اليوم' : n === 1 ? 'آخر موعد غداً' : `آخر موعد بعد ${num(n)} أيام`; };
  const clsView = { sort: 'name', dir: 1, q: '', need: false, mapSid: null };
  // العدد مع التمييز الصحيح: (عدد، مفرد، مثنى، جمع، تمييز للأحد عشر فأكثر)
  const cnt = (n, one, two, few, many) => n === 1 ? one : n === 2 ? two : `${num(n)} ${n >= 3 && n <= 10 ? few : many}`;
  const kidsN = n => cnt(n, 'طالب واحد', 'طالبان', 'طلاب', 'طالباً'), testsN = n => cnt(n, 'اختبار واحد', 'اختباران', 'اختبارات', 'اختباراً');

  async function renderClass(cid) {
    const u = await needUser(() => renderClass(cid)); if (!u) return;
    const app = N().app; app.innerHTML = '<p class="empty">⏳ جارٍ تحميل الفصل…</p>';
    let c, rows;
    try { c = await db.get('classes/' + cid); rows = c ? await db.query('students', [], { parent: 'classes/' + cid, limit: 200 }) : []; }
    catch (e) { app.innerHTML = page('تعذّر فتح الفصل', errTxt(e), '', '<a class="btn ghost small" href="#staff">→ رجوع</a>'); return; }
    if (!c) { app.innerHTML = page('الفصل غير موجود', '', '', '<a class="btn ghost small" href="#staff">→ رجوع</a>'); return; }
    if (window.NQLoadGrade) await window.NQLoadGrade(c.grade).catch(() => { });
    const NQ = N();
    const kids = rows.map(r => { try { const p = JSON.parse(r.json); p._doc = r.id; return p; } catch (e) { return null; } }).filter(Boolean);
    const now = Date.now(), wk = now - 7 * DAY, pwk = now - 14 * DAY;
    const avgP = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.pct, 0) / rs.length) : null;
    const sum = p => {
      const rs = p.records || [], w = rs.filter(r => r.date > wk);
      const last = rs.reduce((m, r) => !m || r.date > m.date ? r : m, null);
      const subs = allowedSubs(p).map(s => ({ s, st: NQ.subjectStats(s, rs) })).filter(x => x.st.level != null);
      const lvl = subs.length ? Math.round(subs.reduce((a, x) => a + x.st.level, 0) / subs.length) : null;
      const weak = subs.slice().sort((a, b) => a.st.level - b.st.level)[0];
      return { w: w.length, q: w.reduce((a, r) => a + (r.total || 0), 0), avg: avgP(w), last, lvl, weak, need: !!(weak && weak.st.level < 65), xp: w.reduce((a, r) => a + (r.xp || 0), 0) };
    };
    const list = kids.map(p => ({ p, k: sum(p) }));
    const color = v => v == null ? 'var(--muted)' : NQ.gradeOf(v).c;
    const ago = r => { if (!r) return 'لم يبدأ'; const d = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(r.date).setHours(0, 0, 0, 0)) / DAY); return d <= 0 ? 'اليوم' : d === 1 ? 'أمس' : `منذ ${num(d)} أيام`; };
    const first = n => String(n || '').trim().split(/\s+/)[0];

    // 1) ملخص الفصل
    const active = list.filter(x => x.k.w > 0).length;
    const cAvg = avgP(kids.flatMap(p => (p.records || []).filter(r => r.date > wk))), cPrev = avgP(kids.flatMap(p => (p.records || []).filter(r => r.date > pwk && r.date <= wk)));
    const idle = list.filter(x => !x.k.w);
    const trend = cAvg != null && cPrev != null ? (cAvg - cPrev > 0 ? `<span class="pr-up">▲ ${num(cAvg - cPrev)}٪</span>` : cAvg - cPrev < 0 ? `<span class="pr-down">▼ ${num(cPrev - cAvg)}٪</span>` : '<span class="pr-flat">بدون تغيير</span>') : '<span class="pr-flat">لا توجد مقارنة</span>';
    const summary = `<section class="pg-tiles">
        <div class="card pg-tile"><small>نشطون هذا الأسبوع</small><b>${num(active)} / ${num(kids.length)}</b><small class="note muted">${kids.length ? num(Math.round(active / kids.length * 100)) + '٪ من الفصل' : '—'}</small></div>
        <div class="card pg-tile"><small>متوسط الفصل (7 أيام)</small><b style="color:${color(cAvg)}">${cAvg == null ? '—' : num(cAvg) + '٪'}</b><small class="note">${trend}</small></div>
        <div class="card pg-tile"><small>أسئلة الفصل هذا الأسبوع</small><b>${num(list.reduce((a, x) => a + x.k.q, 0))}</b><small class="note muted">${testsN(list.reduce((a, x) => a + x.k.w, 0))}</small></div>
        <div class="card pg-tile"><small>يحتاجون متابعة</small><b style="color:${list.some(x => x.k.need) ? 'var(--bad)' : 'inherit'}">${num(list.filter(x => x.k.need).length)}</b><small class="note muted">مستوى أقل من 65٪ في مادة</small></div>
      </section>
      ${idle.length && kids.length ? `<section class="card sc-idle"><div class="pg-row"><h2>😴 لم يذاكروا منذ 7 أيام (${num(idle.length)})</h2><button type="button" class="btn ghost small" id="cl-remind">📋 نسخ رسالة تذكير للجروب</button></div>
        <p class="sc-idle-names">${idle.map(x => esc(x.p.name)).join('، ')}</p></section>` : ''}`;

    // 2) واجبات الفصل
    const subsT = teachSubs(c), tasks = (Array.isArray(c.tasks) ? c.tasks : []).slice().sort((a, b) => b.created - a.created);
    const taskRows = t => {
      const s = NQ.subjectById(t.sid);
      const elig = kids.filter(p => allowedSubs(p).some(x => x.id === t.sid));
      const res = elig.map(p => { const r = (p.records || []).filter(r => r.subjectId === t.sid && r.key === t.key && r.date >= t.created).sort((a, b) => b.pct - a.pct)[0]; return { p, r }; });
      const done = res.filter(x => x.r);
      return { s, elig, res, done, avg: avgP(done.map(x => x.r)) };
    };
    const tasksCard = `<section class="card"><h2>📌 واجبات الفصل</h2>
      <p class="muted" style="margin:0 0 10px">يظهر الواجب لكل طلاب الفصل في «خطة اليوم» على صفحتهم، وتتابع هنا من أنجزه.</p>
      <form class="px-form" id="cl-tadd">
        <label><span>المادة</span><select id="cl-ts">${subsT.map(s => `<option value="${s.id}">${s.icon} ${esc(s.name)}</option>`).join('')}</select></label>
        <label class="wide"><span>الدرس</span><select id="cl-tk"></select></label>
        <label><span>آخر موعد</span><input type="date" id="cl-td" min="${ymd()}" value="${ymd(new Date(now + 3 * DAY))}"></label>
        <button class="btn" type="submit">إرسال للفصل</button>
      </form>
      ${tasks.length ? `<div class="sc-tasks">${tasks.slice(0, 12).map(t => { const x = taskRows(t); return `<details class="sc-task"><summary><div><b>${esc(t.title)}</b><small>${x.s ? x.s.icon + ' ' + esc(x.s.name) + ' · ' : ''}${dueTxt(t.due)}</small></div>
          <span class="sc-task-n"><b>${num(x.done.length)} / ${num(x.elig.length)}</b><small>${x.avg == null ? 'أنجزوا' : 'متوسط ' + num(x.avg) + '٪'}</small></span></summary>
          <div class="sc-task-body">${x.res.length ? `<ul class="sc-task-list">${x.res.sort((a, b) => (b.r ? 1 : 0) - (a.r ? 1 : 0) || a.p.name.localeCompare(b.p.name, 'ar')).map(y => `<li class="${y.r ? 'ok' : ''}"><span>${y.r ? '✓' : '○'}</span>${esc(y.p.name)}${y.r ? `<b style="color:${color(y.r.pct)}">${num(y.r.pct)}٪</b>` : '<small class="muted">لم يُنجز</small>'}</li>`).join('')}</ul>` : '<p class="muted">لا يوجد طلاب سمح أولياء أمورهم بهذه المادة.</p>'}
            <button type="button" class="linkish" data-tdel="${esc(t.id)}">حذف الواجب</button></div></details>`; }).join('')}</div>` : ''}
    </section>`;

    // 3) خريطة إتقان الفصل
    if (!clsView.mapSid || !subsT.some(s => s.id === clsView.mapSid)) clsView.mapSid = subsT[0] ? subsT[0].id : null;
    const mapS = NQ.subjectById(clsView.mapSid);
    let mapCard = '';
    if (mapS && kids.length) {
      const L = mapS.units.flatMap(un => un.lessons.map(l => ({ key: un.id + '/' + l.id, l, un })));
      const who = list.filter(x => allowedSubs(x.p).some(s => s.id === mapS.id)).sort((a, b) => a.p.name.localeCompare(b.p.name, 'ar'));
      const best = new Map(who.map(x => [x.p, NQ.subjectStats(mapS, x.p.records || []).best]));
      const colAvg = L.map(x => { const v = who.map(w => best.get(w.p)[x.key]).filter(v => v != null); return { n: v.length, a: v.length ? Math.round(v.reduce((s, y) => s + y, 0) / v.length) : null }; });
      const weakL = L.map((x, i) => ({ x, ...colAvg[i] })).filter(y => y.n >= 2 && y.a < 65).sort((a, b) => a.a - b.a).slice(0, 3);
      const cell = v => v == null ? '<td class="mm-0"></td>' : `<td class="${v >= 80 ? 'mm-3' : v >= 65 ? 'mm-2' : 'mm-1'}" title="${num(v)}٪">${num(v)}</td>`;
      mapCard = `<section class="card"><div class="pg-row"><h2>🗺️ خريطة إتقان الفصل</h2>${subsT.length > 1 ? `<select id="cl-map" aria-label="المادة">${subsT.map(s => `<option value="${s.id}" ${s.id === mapS.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>` : `<small class="muted">${esc(mapS.name)}</small>`}</div>
        ${weakL.length ? `<p class="sc-weakl">⚠️ دروس تحتاج إعادة شرح للفصل: ${weakL.map(y => `<b>${esc(y.x.l.short)}</b> (${num(y.a)}٪)`).join('، ')}</p>` : ''}
        ${who.length ? `<div class="table-wrap mm-wrap"><table class="mm"><thead><tr><th class="mm-name">الطالب</th>${L.map((x, i) => `<th title="${esc(x.l.name)}"><span>${esc(x.l.short)}</span><small style="color:${color(colAvg[i].a)}">${colAvg[i].a == null ? '' : num(colAvg[i].a) + '٪'}</small></th>`).join('')}</tr></thead>
          <tbody>${who.map(w => `<tr><th class="mm-name">${esc(w.p.name)}</th>${L.map(x => cell(best.get(w.p)[x.key])).join('')}</tr>`).join('')}</tbody></table></div>
          <div class="sp-legend"><span><i class="mm-3"></i>80٪+</span><span><i class="mm-2"></i>65–79٪</span><span><i class="mm-1"></i>أقل من 65٪</span><span><i class="mm-0"></i>لم يُحل</span></div>` : '<p class="muted">لا يوجد طلاب سمح أولياء أمورهم بهذه المادة.</p>'}
      </section>`;
    }

    // 4) أكثر الأسئلة خطأً + ورقة عمل
    const miss = {};
    kids.forEach(p => (p.records || []).filter(r => r.date > now - 30 * DAY && r.ans).forEach(r => r.ans.forEach(([id, , sc]) => { const m = miss[id] = miss[id] || { n: 0, w: 0 }; m.n++; if (sc < 1) m.w++; })));
    const qmap = {}; NQ.SUBJECTS.filter(s => s.grade === c.grade).forEach(s => NQ.allQuestions(s).forEach(q => { qmap[q.id] = { q, s }; }));
    const hardAll = Object.entries(miss).filter(([id, m]) => qmap[id] && m.n >= 2 && m.w > 0).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n || b[1].w - a[1].w);
    const hard = hardAll.slice(0, 8);

    // 5) أبطال الأسبوع + رسالة للفصل
    const heroes = list.filter(x => x.k.xp > 0).sort((a, b) => b.k.xp - a.k.xp).slice(0, 5);
    const msg = c.msg && c.msg.text ? c.msg : null;
    const heroCard = `<section class="pg-grid2">
      <div class="card"><h2>🏆 أبطال الفصل هذا الأسبوع</h2>${heroes.length ? `<ol class="sc-heroes">${heroes.map((x, i) => `<li><span>${['🥇', '🥈', '🥉', '٤', '٥'][i]}</span><b>${esc(x.p.name)}</b><small>${num(x.k.xp)} نقطة · ${testsN(x.k.w)}</small></li>`).join('')}</ol>
        <button type="button" class="btn ghost small" id="cl-cheer">🎉 هنّئهم برسالة للفصل</button>` : '<p class="empty">لا توجد نقاط هذا الأسبوع بعد.</p>'}</div>
      <div class="card"><h2>📣 رسالة للفصل</h2><small class="muted">تظهر لكل طلاب الفصل أعلى صفحتهم (مرة واحدة لكل رسالة)</small>
        ${msg ? `<div class="px-sent"><p>«${esc(msg.text)}»</p><small>أُرسلت ${NQ.fmtDate(msg.t)}</small></div>` : ''}
        <form class="px-form" id="cl-msg"><label class="wide"><span class="sr">نص الرسالة</span><textarea id="cl-mt" maxlength="160" rows="2" placeholder="مثال: لا تنسوا مراجعة الوحدة الأولى قبل اختبار الأحد 📚" required></textarea></label><button class="btn" type="submit">إرسال</button></form></div>
    </section>`;

    // 6) جدول الطلاب (ترتيب + بحث + تصفية)
    const COLS = [['name', 'الطالب'], ['last', 'آخر نشاط'], ['q', 'أسئلة الأسبوع'], ['avg', 'متوسط الأسبوع'], ['lvl', 'المستوى العام'], ['need', 'يحتاج متابعة']];
    const sortVal = (x, k) => k === 'name' ? x.p.name : k === 'last' ? (x.k.last ? x.k.last.date : 0) : k === 'need' ? (x.k.need ? x.k.weak.st.level : 999) : x.k[k] == null ? -1 : x.k[k];
    const tbody = () => {
      const q = clsView.q.trim();
      const rowsF = list.filter(x => (!q || x.p.name.includes(q)) && (!clsView.need || x.k.need || !x.k.w))
        .sort((a, b) => { const va = sortVal(a, clsView.sort), vb = sortVal(b, clsView.sort); return (typeof va === 'string' ? va.localeCompare(vb, 'ar') : va - vb) * clsView.dir; });
      return rowsF.map(({ p, k }) => `<tr><td><b>${esc(p.name)}</b><small class="sc-allowed">${esc(allowedSubs(p).map(s => s.name).join('، ') || 'لا توجد مواد مسموحة')}</small></td><td>${ago(k.last)}</td><td>${num(k.q)}</td><td style="color:${color(k.avg)};font-weight:800">${k.avg == null ? '—' : num(k.avg) + '٪'}</td><td style="color:${color(k.lvl)};font-weight:800">${k.lvl == null ? '—' : num(k.lvl) + '٪'}</td><td>${k.need ? esc(k.weak.s.name) : '—'}</td><td><button type="button" class="btn ghost small" data-stu="${esc(p._doc)}">التقرير</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">لا يوجد طلاب مطابقون.</td></tr>';
    };
    const thead = () => COLS.map(([k, t]) => `<th aria-sort="${clsView.sort === k ? (clsView.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sc-sort" data-sort="${k}">${t}${clsView.sort === k ? (clsView.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`).join('') + '<th></th>';

    app.innerHTML = page(`📚 ${esc(c.grade)} · ${esc(c.section)} · ${esc(subjLabel(c))}`, `${esc(c.schoolName || '')} · ${kidsN(kids.length)} · ${c.open ? 'الانضمام مفتوح' : 'الانضمام مغلق'}${c.title ? ' · ' + esc(c.title) : ''}`, `
      ${summary}
      <form class="card px-form sc-subj-form" id="cl-subf"><label><span>مادة هذا الفصل (تظهر لأولياء الأمور، ويُقترح عليهم مشاركة درجاتها)</span><select id="cl-sub"><option value="">— اختر —</option>${subjectOpts(c.subject)}</select></label><button class="btn ghost" type="submit">حفظ</button></form>
      <section class="card"><div class="pg-row"><h2>الطلاب</h2><div class="db-btns"><button type="button" class="btn small" id="cl-inv">+ دعوة أولياء الأمور</button><button type="button" class="btn ghost small" id="cl-csv" ${kids.length ? '' : 'disabled'}>⬇ تصدير Excel</button><button type="button" class="btn ghost small" id="cl-open">${c.open ? 'إغلاق الانضمام' : 'فتح الانضمام'}</button></div></div>
        ${list.length ? `<div class="sc-tools"><label class="sr" for="cl-q">بحث بالاسم</label><input id="cl-q" type="search" placeholder="🔎 بحث بالاسم" value="${esc(clsView.q)}"><label class="gm-check"><input type="checkbox" id="cl-need" ${clsView.need ? 'checked' : ''}> يحتاجون متابعة أو غير نشطين فقط</label></div>
          <div class="table-wrap"><table class="px-table sc-table"><thead><tr id="cl-th">${thead()}</tr></thead><tbody id="cl-tb">${tbody()}</tbody></table></div>` : '<p class="empty">لم ينضم أي طالب بعد. أرسل رابط الدعوة لجروب أولياء الأمور.</p>'}</section>
      ${tasksCard}
      ${mapCard}
      ${heroCard}
      ${hard.length ? `<section class="card"><div class="pg-row"><h2>أكثر الأسئلة خطأً في الفصل (آخر 30 يوماً)</h2><button type="button" class="btn ghost small" id="cl-ws">🖨️ ورقة عمل للفصل</button></div><ul class="pg-list">${hard.map(([id, m]) => `<li><span class="dot" style="background:var(--bad)"></span><div><b>${esc(qmap[id].q.q)}</b><small>${qmap[id].s.icon} ${esc(qmap[id].s.name)} · الصحيح: ${esc(NQ.correctText(qmap[id].q))}</small></div><span class="pct" style="color:var(--bad)">${num(Math.round(m.w / m.n * 100))}٪ خطأ</span></li>`).join('')}</ul></section>` : ''}
      <section class="pr-danger"><span class="muted">حذف الفصل يزيل قائمة طلابه من المنصة (لا تتأثر درجاتهم عند أسرهم).</span><button type="button" class="btn danger small" id="cl-del">حذف الفصل</button></section>`,
      '<a class="btn ghost small" href="#staff">→ كل الفصول</a>');

    const save = async (patch, ok) => { try { await db.set('classes/' + cid, Object.assign({}, stripId(c), patch)); if (ok) N().toast(ok); renderClass(cid); } catch (x) { N().toast(errTxt(x)); } };
    const bindRows = () => app.querySelectorAll('[data-stu]').forEach(b => b.onclick = () => { const p = kids.find(x => x._doc === b.dataset.stu); if (p) renderStudent(c, p); });
    const redrawTable = () => { const th = document.getElementById('cl-th'), tb = document.getElementById('cl-tb'); if (!tb) return; th.innerHTML = thead(); tb.innerHTML = tbody(); bindSort(); bindRows(); };
    const bindSort = () => app.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { const k = b.dataset.sort; clsView.dir = clsView.sort === k ? -clsView.dir : (k === 'name' ? 1 : -1); clsView.sort = k; redrawTable(); });
    bindSort(); bindRows();
    const qi = document.getElementById('cl-q'); if (qi) qi.oninput = () => { clsView.q = qi.value; redrawTable(); };
    const nd = document.getElementById('cl-need'); if (nd) nd.onchange = () => { clsView.need = nd.checked; redrawTable(); };
    document.getElementById('cl-inv').onclick = () => shareWindow({ title: 'دعوة أولياء الأمور', url: siteUrl('class-' + cid), text: `دعوة لانضمام أبنائكم إلى فصل ${c.grade} / ${c.section} – ${c.schoolName} في منصة قِمّة. افتح الرابط وأدخل رقم ولي الأمر:`, note: 'ولي الأمر يقبل الدعوة لأبنائه من لوحته. يمكنك إغلاق الانضمام بعد اكتمال الفصل.' });
    document.getElementById('cl-subf').onsubmit = e => { e.preventDefault(); const v = document.getElementById('cl-sub').value; if (!v) return N().toast('اختر المادة'); save({ subject: v }, 'تم حفظ المادة ✓'); };
    document.getElementById('cl-open').onclick = () => save({ open: !c.open });
    document.getElementById('cl-del').onclick = async () => {
      if (!(await N().ask('حذف الفصل نهائياً؟', 'حذف', true))) return;
      try { for (const p of kids) await db.del('classes/' + cid + '/students/' + p._doc); await db.del('classes/' + cid); N().go('#staff'); } catch (e) { N().toast(errTxt(e)); }
    };
    // تذكير لجروب أولياء الأمور (بدون أسماء الطلاب)
    const rm = document.getElementById('cl-remind');
    if (rm) rm.onclick = () => copyText(`تذكير من ${c.teacherName || 'معلم الفصل'} – فصل ${c.grade} / ${c.section}:\nبعض الطلاب لم يذاكروا على منصة قِمّة منذ أسبوع. نرجو تشجيع أبنائكم على حل اختبار قصير يومياً (١٠ دقائق تكفي) 🌟\n${siteUrl('home')}`, 'تم نسخ رسالة التذكير ✓ الصقها في جروب أولياء الأمور');
    // تصدير Excel (CSV بترميز يقرؤه Excel بالعربية)
    const csvB = document.getElementById('cl-csv');
    if (csvB) csvB.onclick = () => {
      const cell = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const subsAll = teachSubs(c);
      const head = ['الطالب', 'آخر نشاط', 'اختبارات الأسبوع', 'أسئلة الأسبوع', 'متوسط الأسبوع %', 'المستوى العام %', 'يحتاج متابعة في', ...subsAll.map(s => s.name + ' %')];
      const body = list.slice().sort((a, b) => a.p.name.localeCompare(b.p.name, 'ar')).map(({ p, k }) => [p.name, k.last ? new Date(k.last.date).toLocaleDateString('en-CA') : '', k.w, k.q, k.avg == null ? '' : k.avg, k.lvl == null ? '' : k.lvl, k.need ? k.weak.s.name : '',
        ...subsAll.map(s => allowedSubs(p).some(x => x.id === s.id) ? (NQ.subjectStats(s, p.records || []).level == null ? '' : NQ.subjectStats(s, p.records || []).level) : 'غير مسموح')]);
      const csv = '﻿' + [head, ...body].map(r => r.map(cell).join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `فصل-${c.grade}-${c.section}-${ymd()}.csv`.replace(/\s+/g, '-'); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      N().toast('تم تنزيل ملف الفصل ✓ يفتح في Excel');
    };
    // واجبات الفصل
    const ts = document.getElementById('cl-ts'), tk = document.getElementById('cl-tk');
    const fillK = () => { const s = NQ.subjectById(ts.value); tk.innerHTML = s ? s.units.map(un => `<optgroup label="${esc(un.name)}">${un.lessons.map(l => `<option value="${un.id}/${l.id}">${esc(l.short)}: ${esc(l.name)}</option>`).join('')}<option value="${un.id}/exam">★ الاختبار الشامل للوحدة</option></optgroup>`).join('') : ''; };
    if (ts) { ts.onchange = fillK; fillK(); }
    const tf = document.getElementById('cl-tadd');
    if (tf) tf.onsubmit = e => {
      e.preventDefault(); const s = NQ.subjectById(ts.value), key = tk.value; if (!s || !key) return;
      const list0 = Array.isArray(c.tasks) ? c.tasks : [];
      if (list0.some(t => t.sid === s.id && t.key === key && (!t.due || t.due >= ymd()))) return N().toast('هذا الواجب مُرسل للفصل بالفعل');
      const t = { id: rid(10), sid: s.id, key, title: keyTitle(s, key) || key, due: document.getElementById('cl-td').value || null, created: Date.now() };
      save({ tasks: list0.concat(t).slice(-30) }, 'تم إرسال الواجب للفصل ✓');
    };
    app.querySelectorAll('[data-tdel]').forEach(b => b.onclick = async () => { if (!(await N().ask('حذف هذا الواجب من الفصل؟', 'حذف', true))) return; save({ tasks: (c.tasks || []).filter(t => t.id !== b.dataset.tdel) }, 'تم حذف الواجب'); });
    // خريطة الإتقان: تغيير المادة
    const mp = document.getElementById('cl-map'); if (mp) mp.onchange = () => { clsView.mapSid = mp.value; renderClass(cid); };
    // رسالة للفصل وتهنئة الأبطال
    const mf = document.getElementById('cl-msg');
    if (mf) mf.onsubmit = e => { e.preventDefault(); const t = document.getElementById('cl-mt').value.trim().slice(0, 160); if (t) save({ msg: { text: t, t: Date.now() } }, 'تم إرسال الرسالة للفصل ✓'); };
    const ch = document.getElementById('cl-cheer');
    if (ch) ch.onclick = () => save({ msg: { text: `🏆 أبطال الأسبوع في فصلنا: ${heroes.map(x => first(x.p.name)).join('، ')}. أحسنتم! وأنتظر أسماء جديدة الأسبوع القادم 🌟`.slice(0, 160), t: Date.now() } }, 'تم إرسال التهنئة للفصل ✓');
    // ورقة عمل من أكثر الأسئلة خطأً
    const wsb = document.getElementById('cl-ws');
    if (wsb) wsb.onclick = () => {
      const pool = hardAll.slice(0, 20).map(([id]) => qmap[id].q);
      const s0 = qmap[hardAll[0][0]].s, one = hardAll.slice(0, 20).every(([id]) => qmap[id].s.id === s0.id);
      NQ.printWorksheet(one ? s0 : { name: subjLabel(c), grade: c.grade }, 'أكثر الأسئلة خطأً في الفصل', pool, { name: '' });
    };
  }
  const stripId = o => { const x = Object.assign({}, o); delete x.id; return x; };
  // المواد التي سمح بها ولي الأمر لهذا المعلم (البيانات تصل مفلترة أصلاً، وهذا للعرض)
  const allowedSubs = p => { const all = N().SUBJECTS.filter(s => s.grade === p.grade); return Array.isArray(p._allowed) ? all.filter(s => p._allowed.includes(s.id)) : all; };

  /* ----- تقرير طالب للمعلم ----- */
  function renderStudent(c, p) {
    const NQ = N(), app = NQ.app, rs = p.records || [], now = Date.now();
    const w = rs.filter(r => r.date > now - 7 * DAY), m = rs.filter(r => r.date > now - 30 * DAY);
    const avg = a => a.length ? Math.round(a.reduce((s, r) => s + r.pct, 0) / a.length) : null;
    const subs = allowedSubs(p).map(s => ({ s, st: NQ.subjectStats(s, rs) }));
    const weak = subs.flatMap(x => x.st.weak).sort((a, b) => a.pct - b.pct).slice(0, 8);
    const color = v => v == null ? 'var(--muted)' : NQ.gradeOf(v).c;
    const recent = rs.slice().sort((a, b) => b.date - a.date).slice(0, 25);
    const mins = Math.round(m.reduce((s, r) => s + (r.secs || 0), 0) / 60);
    app.innerHTML = page(`👤 ${esc(p.name)}`, `${esc(p.grade)} · ${esc(c.grade)} / ${esc(c.section)} · تقرير: ${esc(subs.map(x => x.s.name).join('، ') || '—')}`, `
      <p class="hint" style="margin:0 0 12px">يظهر هنا فقط ما سمح ولي الأمر بمشاركته معك من المواد.</p>
      <section class="pg-tiles">
        <div class="card pg-tile"><small>متوسط آخر 7 أيام</small><b style="color:${color(avg(w))}">${avg(w) == null ? '—' : num(avg(w)) + '٪'}</b><small class="note muted">${num(w.length)} اختبار</small></div>
        <div class="card pg-tile"><small>متوسط آخر 30 يوماً</small><b style="color:${color(avg(m))}">${avg(m) == null ? '—' : num(avg(m)) + '٪'}</b><small class="note muted">${num(m.length)} اختبار</small></div>
        <div class="card pg-tile"><small>وقت المذاكرة (30 يوماً)</small><b>${num(mins)} د</b><small class="note muted">${num(m.reduce((s, r) => s + (r.total || 0), 0))} سؤال</small></div>
        <div class="card pg-tile"><small>كل الاختبارات</small><b>${num(rs.length)}</b><small class="note muted">منذ البداية</small></div>
      </section>
      <section class="pg-grid2">
        <div class="card"><h2>${subs.length === 1 ? 'المستوى في المادة' : 'المستوى في المواد المسموحة'}</h2><div class="pg-bars">${subs.map(x => `<div><div class="pg-row sm"><b>${x.s.icon} ${esc(x.s.name)}</b><b style="color:${color(x.st.level)}">${x.st.level == null ? 'لم يبدأ' : num(x.st.level) + '٪'}</b></div><div class="db-bar"><i style="width:${x.st.level || 0}%;background:${color(x.st.level)}"></i></div><small class="muted">${num(x.st.done)} من ${num(x.st.total)} درس</small></div>`).join('')}</div></div>
        <div class="card"><h2>دروس تحتاج متابعة</h2>${weak.length ? `<div class="pr-weak">${weak.map(x => `<div class="${x.pct < 55 ? 'bad' : 'mid'}"><div><b>${esc(x.name)}</b><small>${esc(x.s.name)} · ${esc(x.unit.name.split(':')[0])}</small></div><b>${num(x.pct)}٪</b></div>`).join('')}</div>` : '<p class="empty">لا توجد دروس ضعيفة 🎉</p>'}</div>
      </section>
      <section class="card"><h2>الاختبارات</h2>${recent.length ? `<ul class="pg-list">${recent.map(r => { const s = NQ.subjectById(r.subjectId); return `<li><span class="dot" style="background:${color(r.pct)}"></span><div><b>${esc(r.title)}</b><small>${s ? esc(s.name) : '—'} · ${r.mode === 'exam' ? 'اختبار' : 'تدريب'} · ${NQ.fmtDate(r.date)} · ${NQ.fmtTime(r.secs || 0)}</small></div><span class="pct" style="color:${color(r.pct)}">${num(r.pct)}٪</span><button type="button" class="btn ghost small" data-rec="${r.id}">التفاصيل</button></li>`; }).join('')}</ul>` : '<p class="empty">لم يحل أي اختبار بعد.</p>'}</section>`,
      `<button type="button" class="btn ghost small" id="stu-back">→ الفصل</button><button type="button" class="btn danger small" id="stu-rm">إزالة من الفصل</button>`);
    document.getElementById('stu-back').onclick = () => renderClass(c.id);
    document.getElementById('stu-rm').onclick = async () => { if (!(await NQ.ask(`إزالة ${p.name} من الفصل؟`, 'إزالة', true))) return; try { await db.del('classes/' + c.id + '/students/' + p._doc); renderClass(c.id); } catch (e) { NQ.toast(errTxt(e)); } };
    app.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { const r = rs.find(x => String(x.id) === b.dataset.rec); if (r && window.NQP && window.NQP.showDetails) window.NQP.showDetails(r); });
    window.scrollTo(0, 0);
  }

  /* ================= ولي الأمر: قبول دعوة الفصل ================= */
  const KEY_INV = 'nq_class_invite';
  function catchInvite(cid) { try { sessionStorage.setItem(KEY_INV, cid); } catch (e) { } N().go('#parent'); }
  const pendingInvite = () => { try { return sessionStorage.getItem(KEY_INV); } catch (e) { return null; } };
  let inviteInfo = null;
  /* عضوية الطالب في الفصول: p.classes = [{cid, …, subjects:[معرّفات المواد المسموحة], t, left}]
     (الطالب قد يكون عند أكثر من معلم؛ «left» يبقى كعلامة حتى لا يرجع الفصل من جهاز آخر في الأسرة) */
  function mems(p) {
    if (p.cls && !p.classes) { p.classes = [Object.assign({ subjects: null, t: p.cls.joined || Date.now() }, p.cls)]; delete p.cls; }
    return p.classes || [];
  }
  const activeMems = p => mems(p).filter(m => !m.left);
  const primary = p => activeMems(p)[0] || null;
  const gradeSubs = g => N().SUBJECTS.filter(s => s.grade === g);
  const subjNames = (p, m) => !Array.isArray(m.subjects) ? 'كل المواد' : (gradeSubs(p.grade).filter(s => m.subjects.includes(s.id)).map(s => s.name).join('، ') || 'لا شيء');
  function defaultSubjects(c, grade) {
    const subs = gradeSubs(grade);
    if (c.subject === ALL_SUBJ) return subs.map(s => s.id);
    return subs.filter(s => s.name === c.subject).map(s => s.id);
  }
  const teacherLine = c => `${esc(c.teacherName || c.teacher || 'المعلم')}${c.subject ? ' · ' + esc(c.subject === ALL_SUBJ ? 'مربي الفصل' : 'معلم ' + c.subject) : ''}`;
  const subjBoxes = (p, chosen) => `<div class="sc-subjs">${gradeSubs(p.grade).map(s => `<label><input type="checkbox" data-subj value="${s.id}" ${chosen.includes(s.id) ? 'checked' : ''}> ${s.icon} ${esc(s.name)}</label>`).join('') || '<small class="muted">لا توجد مواد لهذا الصف بعد.</small>'}</div>`;
  function parentHtml(people) {
    if (!enabled()) return '';
    const inv = pendingInvite();
    const rows = people.flatMap(p => activeMems(p).map(m => ({ p, m })));
    let h = '';
    if (inv) {
      if (!inviteInfo || inviteInfo.id !== inv) { h += '<section class="card sc-invite" id="sc-inv"><p class="muted">⏳ جارٍ تحميل دعوة الفصل…</p></section>'; }
      else if (!inviteInfo.ok) h += `<section class="card sc-invite"><p>دعوة الفصل غير صالحة أو أُغلق الانضمام.</p><button type="button" class="btn ghost small" data-inv-x>إغلاق</button></section>`;
      else {
        const c = inviteInfo.c;
        h += `<section class="card sc-invite"><h2>🏫 دعوة من ${teacherLine(c)}</h2>
          <p style="margin:0">فصل <b>${esc(c.grade)} / ${esc(c.section)}</b>${c.title ? ' · ' + esc(c.title) : ''} · ${esc(c.schoolName)} (${esc(c.region)})</p>
          <p class="muted" style="margin:0">اختر الأبناء، ولكل ابن المواد التي يرى المعلم نشاطه ودرجاته وتفاصيل اختباراته فيها. المواد الأخرى لا تُرسل للمعلم. يدخل الابن أيضاً منافسة الفصل والمدرسة والمنطقة.</p>
          <div class="sc-kidlist">${people.map(p => { const has = activeMems(p).find(m => m.cid === c.id); const chosen = has && Array.isArray(has.subjects) ? has.subjects : defaultSubjects(c, p.grade); return `<div class="sc-kid" data-kidrow="${p.id}">
            <label class="sc-kid-head"><input type="checkbox" data-kidpick value="${p.id}" ${p.grade === c.grade ? 'checked' : ''}> <b>${esc(p.name)}</b> <small>(${esc(p.grade)})</small>${has ? ' <small class="muted">· منضم بالفعل، سيتم تحديث المواد</small>' : ''}</label>
            <small class="muted">المواد المسموحة للمعلم:</small>${subjBoxes(p, chosen)}</div>`; }).join('')}</div>
          <div class="db-btns"><button type="button" class="btn" data-inv-ok>قبول الدعوة</button><button type="button" class="btn ghost" data-inv-x>رفض</button></div></section>`;
      }
    }
    if (rows.length) h += `<section class="card"><h2>🏫 المعلمون والفصول</h2><ul class="pg-list">${rows.map(({ p, m }) => `<li><div><b>${esc(p.name)} ← ${esc(m.teacher || 'المعلم')}${m.subject ? ` <small>(${esc(m.subject === ALL_SUBJ ? 'مربي الفصل' : m.subject)})</small>` : ''}</b>
        <small>${esc(m.school)} · ${esc(m.grade || p.grade)} / ${esc(m.section)} · يرى: ${esc(subjNames(p, m))}</small></div>
        <button type="button" class="btn ghost small" data-subjedit="${p.id}|${m.cid}">المواد المسموحة</button><button type="button" class="linkish" data-leave="${p.id}|${m.cid}">إلغاء الانضمام</button></li>`).join('')}</ul></section>`;
    return h;
  }
  async function bindParent(people, rerender) {
    const inv = pendingInvite(), NQ = N();
    if (inv && (!inviteInfo || inviteInfo.id !== inv)) {
      let c = null; try { c = await db.get('classes/' + inv); } catch (e) { }
      inviteInfo = { id: inv, ok: !!(c && c.open), c }; rerender(); return;
    }
    const after = msg => { NQ.persist(); if (window.NQGame && window.NQGame.onPersist) window.NQGame.onPersist(); if (msg) NQ.toast(msg); rerender(); };
    NQ.app.querySelectorAll('[data-inv-x]').forEach(b => b.onclick = () => { try { sessionStorage.removeItem(KEY_INV); } catch (e) { } inviteInfo = null; rerender(); });
    const ok = NQ.app.querySelector('[data-inv-ok]');
    if (ok) ok.onclick = async () => {
      const picks = [...NQ.app.querySelectorAll('[data-kidpick]:checked')].map(x => ({ id: x.value, subjects: [...NQ.app.querySelectorAll(`[data-kidrow="${x.value}"] [data-subj]:checked`)].map(y => y.value) }));
      if (!picks.length) return NQ.toast('اختر ابناً واحداً على الأقل');
      if (picks.some(x => !x.subjects.length)) return NQ.toast('اختر مادة واحدة على الأقل لكل ابن');
      ok.disabled = true;
      const c = inviteInfo.c;
      try {
        for (const { id, subjects } of picks) {
          const p = NQ.store.profiles[id]; if (!p) continue;
          const list = mems(p), old = list.find(m => m.cid === c.id);
          const m = { cid: c.id, sid: c.sid, region: c.region, school: c.schoolName, grade: c.grade, section: c.section, teacher: c.teacherName || '', subject: c.subject || '', stage: stageOf(c.grade), doc: old && old.doc ? old.doc : rid(16), joined: old && !old.left ? old.joined : Date.now(), subjects, t: Date.now() };
          p.classes = list.filter(x => x.cid !== c.id).concat(m);
          await pushStudent(p, m, true);
        }
        try { sessionStorage.removeItem(KEY_INV); } catch (e) { } inviteInfo = null;
        after('تم الانضمام للفصل ✓');
      } catch (e) { ok.disabled = false; NQ.toast(errTxt(e)); }
    };
    const find = v => { const [pid, cid] = v.split('|'); const p = NQ.store.profiles[pid]; const m = p && activeMems(p).find(x => x.cid === cid); return { p, m }; };
    NQ.app.querySelectorAll('[data-leave]').forEach(b => b.onclick = async () => {
      const { p, m } = find(b.dataset.leave); if (!m) return;
      if (!(await NQ.ask(`إلغاء انضمام ${p.name} لفصل ${m.teacher || ''}؟ لن يرى المعلم درجاته بعد الآن.`, 'إلغاء الانضمام', true))) return;
      try { await db.del('classes/' + m.cid + '/students/' + m.doc); m.left = Date.now(); m.t = Date.now(); after('تم إلغاء الانضمام'); } catch (e) { NQ.toast(errTxt(e)); }
    });
    NQ.app.querySelectorAll('[data-subjedit]').forEach(b => b.onclick = () => {
      const { p, m } = find(b.dataset.subjedit); if (!m) return;
      const chosen = Array.isArray(m.subjects) ? m.subjects : gradeSubs(p.grade).map(s => s.id);
      const ov = document.createElement('div'); ov.className = 'overlay';
      ov.innerHTML = `<form class="card" role="dialog" aria-modal="true" aria-labelledby="se-t"><h2 id="se-t">المواد التي يراها ${esc(m.teacher || 'المعلم')}</h2>
        <p class="muted" style="margin:0">لـ ${esc(p.name)} · ${esc(m.school)} · ${esc(m.grade)} / ${esc(m.section)}</p>${subjBoxes(p, chosen)}
        <p class="hint" style="margin:0">المواد غير المختارة تُحذف من نسخة المعلم عند الحفظ.</p>
        <div class="actions"><button type="button" class="btn ghost" data-x>إلغاء</button><button class="btn" type="submit">حفظ</button></div></form>`;
      document.body.appendChild(ov);
      ov.querySelector('[data-x]').onclick = () => ov.remove();
      ov.querySelector('form').onsubmit = async e => {
        e.preventDefault(); const subjects = [...ov.querySelectorAll('[data-subj]:checked')].map(x => x.value);
        if (!subjects.length) return NQ.toast('اختر مادة واحدة على الأقل، أو ألغِ الانضمام');
        m.subjects = subjects; m.t = Date.now();
        try { await pushStudent(p, m, true); ov.remove(); after('تم تحديث المواد ✓'); } catch (x) { NQ.toast(errTxt(x)); }
      };
    });
  }

  /* ----- مشاركة درجات الطالب مع معلمه: المواد المسموحة فقط ----- */
  const sent = {};
  function shareable(p, m) {
    const ok = Array.isArray(m.subjects) ? new Set(m.subjects) : null, has = id => !ok || ok.has(id);
    const pick = o => Object.fromEntries(Object.entries(o || {}).filter(([k]) => has(k)));
    const x = { id: p.id, name: p.name, grade: p.grade, avatar: p.avatar, created: p.created, goal: p.goal };
    x.records = (p.records || []).filter(r => has(r.subjectId));
    x.wrong = pick(p.wrong);
    x.srs = Object.fromEntries(Object.entries(p.srs || {}).filter(([, e]) => e && has(e.s)));
    x._allowed = ok ? [...ok] : null;
    return x;
  }
  async function pushStudent(p, m, force) {
    if (!m || !m.doc || m.left) return;
    const json = JSON.stringify(shareable(p, m)), key = m.cid + '/' + m.doc;
    if (!force && sent[key] === json) return;
    await db.set('classes/' + m.cid + '/students/' + m.doc, { json, name: String(p.name || '').slice(0, 60), grade: p.grade || '', updated: Date.now() });
    sent[key] = json;
  }
  let pushT = null;
  function onPersist() {
    if (!enabled()) return;
    clearTimeout(pushT);
    pushT = setTimeout(async () => {
      for (const p of Object.values(N().store.profiles)) for (const m of activeMems(p)) { try { await pushStudent(p, m); } catch (e) { /* يُعاد عند الحفظ القادم */ } }
    }, 4000);
  }
  // دمج عضويات الفصول بين أجهزة الأسرة: الأحدث لكل فصل يفوز
  function merge(t, src) {
    if (src.classSeen) { t.classSeen = t.classSeen || {}; Object.entries(src.classSeen).forEach(([k, v]) => { if (!(t.classSeen[k] >= v)) t.classSeen[k] = v; }); }
    const a = mems(t), b = mems(src); if (!b.length) return;
    const by = new Map(a.map(m => [m.cid, m]));
    b.forEach(m => { const cur = by.get(m.cid); if (!cur || (m.t || 0) > (cur.t || 0)) by.set(m.cid, m); });
    t.classes = [...by.values()];
  }

  /* ================= صفحة الطالب: واجبات ورسائل معلميه ================= */
  // نسخة محفوظة على الجهاز من واجبات ورسائل كل فصل (تُحدَّث كل 10 دقائق على الأكثر)
  const KEY_CC = 'nq_class_cache';
  const ccGet = () => { try { return JSON.parse(localStorage.getItem(KEY_CC) || '{}') || {}; } catch (e) { return {}; } };
  let ccBusy = false;
  async function refreshClassFeed(p, onChange) {
    if (!enabled() || ccBusy || !p) return;
    const cc = ccGet(), now = Date.now(), due = activeMems(p).filter(m => !cc[m.cid] || now - cc[m.cid].at > 10 * 60000);
    if (!due.length) return;
    ccBusy = true; let changed = false;
    try {
      for (const m of due) {
        let c = null; try { c = await db.get('classes/' + m.cid); } catch (e) { continue; }
        const v = { at: now, teacher: (c && c.teacherName) || m.teacher || '', tasks: c && Array.isArray(c.tasks) ? c.tasks : [], msg: c && c.msg ? c.msg : null };
        const old = cc[m.cid]; if (!old || JSON.stringify([old.tasks, old.msg]) !== JSON.stringify([v.tasks, v.msg])) changed = true;
        cc[m.cid] = v;
      }
      try { localStorage.setItem(KEY_CC, JSON.stringify(cc)); } catch (e) { }
    } finally { ccBusy = false; }
    if (changed && onChange) onChange();
  }
  function classTasks(p) {
    const cc = ccGet();
    return activeMems(p).flatMap(m => { const v = cc[m.cid] || {}; return (v.tasks || []).map(t => ({ t, teacher: v.teacher || m.teacher || '', cid: m.cid })); })
      .filter(x => x.t && x.t.sid && x.t.key && Date.now() - (x.t.created || 0) < 30 * DAY);
  }
  function studentHtml(p) {
    if (!enabled() || !p) return '';
    const cc = ccGet(), seen = p.classSeen || {};
    return activeMems(p).map(m => {
      const v = cc[m.cid], g = v && v.msg;
      if (!g || !g.text || g.t <= (seen[m.cid] || 0) || Date.now() - g.t > 14 * DAY) return '';
      return `<section class="px-msg sc-cmsg" role="status"><span class="px-msg-ic" aria-hidden="true">📣</span><div><small>${g.by ? 'إعلان من ' + esc(g.by) : 'رسالة من ' + esc(v.teacher || 'معلمك')}</small><p>${esc(g.text)}</p></div><button type="button" class="btn small" data-cmsg="${esc(m.cid)}|${g.t}">تم 👍</button></section>`;
    }).join('');
  }
  function bindStudent(p) {
    if (!enabled() || !p) return;
    N().app.querySelectorAll('[data-cmsg]').forEach(b => b.onclick = () => { const [cid, t] = b.dataset.cmsg.split('|'); p.classSeen = Object.assign({}, p.classSeen, { [cid]: +t }); N().persist(); N().route(); });
    refreshClassFeed(p, () => { if (/^#?(home)?$/.test(location.hash)) N().route(); });
  }

  /* ================= التوجيه ================= */
  function route(h) {
    if (h === 'staff') { renderStaff(); return true; }
    if (h === 'admin') { renderAdmin(); return true; }
    if (h === 'school-request') { renderSchoolRequest(); return true; }
    if (h.startsWith('staff-invite-')) { renderStaffInvite(h.slice(13).replace(/[^A-Z0-9]/g, '')); return true; }
    if (h.startsWith('staff-class-')) { renderClass(h.slice(12).replace(/[^A-Z0-9]/g, '')); return true; }
    if (h.startsWith('class-')) { catchInvite(h.slice(6).replace(/[^A-Z0-9]/g, '')); return true; }
    return false;
  }

  window.NQSchools = { enabled, route, parentHtml, bindParent, onPersist, merge, primary, stageOf, classTasks, studentHtml, bindStudent, REGIONS, STAGES, ALL_GRADES, _db: db };
})();
