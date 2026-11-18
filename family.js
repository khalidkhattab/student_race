/* حساب الأسرة على Firebase: يحفظ الطلاب ودرجاتهم ولوحة ولي الأمر في قاعدة البيانات، ويربط كل أجهزة الأسرة بكود سري.
   - كل جهاز يُنشئ كوداً تلقائياً أول مرة، ويمكن إدخال كود جهاز آخر للانضمام لنفس الأسرة.
   - التخزين: families/<code> (ولي الأمر وقائمة الطلاب) و families/<code>/kids/<id> (كل طالب في مستند).
   - الكود هو مفتاح البيانات، فلا يُشارك إلا مع أفراد الأسرة.
   - اختياري: ولي الأمر يربط الأسرة بحسابه في Google/Microsoft (parents/<uid> يحفظ كود أسرته)،
     فيستعيدها على أي جهاز بتسجيل الدخول، ويستطيع تغيير الكود لإلغاء كل الروابط القديمة. */
(function () {
  const KEY = 'nq_family', ACCT = 'nq_parent_acct';
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => { const a = new Uint32Array(20); crypto.getRandomValues(a); return Array.from(a, n => ALPHA[n % ALPHA.length]).join(''); };
  const clean = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pretty = c => clean(c).match(/.{1,4}/g).join('-');
  const cfg = () => window.NQ_FIREBASE || null;
  const enabled = () => { const fb = cfg(); return !!(fb && fb.projectId && fb.apiKey && window.fetch && window.crypto); };
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } };
  function code() {
    let c = lsGet(KEY);
    if (!c || clean(c).length < 16) { c = newCode(); lsSet(KEY, c); }
    return clean(c);
  }

  /* ---------- Firestore (REST) ---------- */
  const S = () => window.NQSchools;
  const docs = () => { const fb = cfg(); return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(fb.projectId) + '/databases/' + encodeURIComponent(fb.database || '(default)') + '/documents/'; };
  const docName = p => { const fb = cfg(); return 'projects/' + fb.projectId + '/databases/' + (fb.database || '(default)') + '/documents/' + p; };
  const key = () => 'key=' + encodeURIComponent(cfg().apiKey);
  // إذا كان ولي الأمر مسجّلاً نرسل هويته (تحتاجها عمليات المالك وparents/)، وإلا لا نحمّل مكتبة الدخول أصلاً
  async function headers() {
    const h = { 'Content-Type': 'application/json' };
    try { const u = S() && await S().signedUser(); if (u) h.Authorization = 'Bearer ' + await u.getIdToken(); } catch (e) { }
    return h;
  }
  async function getRaw(path) {
    const r = await fetch(docs() + path + '?' + key(), { headers: await headers() });
    if (r.status === 404) return null;
    if (!r.ok) throw { code: 'http_' + r.status };
    const j = await r.json(), f = j.fields || {};
    return { data: f.json ? JSON.parse(f.json.stringValue) : null, gone: !!(f.gone && f.gone.booleanValue), owners: ((f.owners && f.owners.arrayValue.values) || []).map(v => v.stringValue) };
  }
  const getDoc = async path => { const d = await getRaw('families/' + path); return d ? (d.gone ? { gone: true } : d.data) : null; };
  // PATCH مع updateMask حتى لا تُمسح الحقول الأخرى (المالكون، علامة الإلغاء)
  async function putRaw(path, obj, extra) {
    const fields = { json: { stringValue: JSON.stringify(obj) }, updated: { integerValue: String(Date.now()) } };
    Object.entries(extra || {}).forEach(([k, v]) => { fields[k] = Array.isArray(v) ? { arrayValue: { values: v.map(x => ({ stringValue: x })) } } : { booleanValue: !!v }; });
    const mask = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + k).join('&');
    const r = await fetch(docs() + path + '?' + mask + '&' + key(), { method: 'PATCH', headers: await headers(), body: JSON.stringify({ fields }) });
    if (!r.ok) throw { code: 'http_' + r.status };
  }
  const putDoc = (path, obj, extra) => putRaw('families/' + path, obj, extra);
  async function delRaw(path) {
    const r = await fetch(docs() + path + '?' + key(), { method: 'DELETE', headers: await headers() });
    if (!r.ok && r.status !== 404) throw { code: 'http_' + r.status };
  }
  async function transform(path, field, op, value) {
    const r = await fetch(docs().replace(/\/$/, '') + ':commit?' + key(), {
      method: 'POST', headers: await headers(),
      body: JSON.stringify({ writes: [{ transform: { document: docName(path), fieldTransforms: [{ fieldPath: field, [op]: { values: [{ stringValue: value }] } }] }, currentDocument: { exists: true } }] })
    });
    if (!r.ok) throw { code: 'http_' + r.status };
  }

  /* ---------- كود أُلغي: ولي الأمر غيّر رابط الأسرة ---------- */
  let goneNotice = false;
  function handleGone() {
    // هذا الجهاز يبدأ أسرة جديدة خاصة به (بياناته المحلية تبقى)، ونخبر الواجهة
    lsSet(KEY, newCode()); reset(); goneNotice = true;
    try { dispatchEvent(new Event('nq-family-gone')); } catch (e) { }
  }

  const written = {};          // آخر نسخة كُتبت لكل مستند (لتجنّب إعادة الكتابة بلا تغيير)
  const forgotten = new Set(); // طلاب حذفهم ولي الأمر (يُحذفون من قائمة الأسرة على كل الأجهزة)
  let pendingBody = null, pendingCode = null, timer = null, lastSync = 0, lastErr = null;
  function reset() { clearTimeout(timer); pendingBody = null; pendingCode = null; Object.keys(written).forEach(k => delete written[k]); }
  async function flush() {
    timer = null; const body = pendingBody, c = pendingCode; pendingBody = null; if (!body || !c) return;
    try {
      const remote = await getDoc(c);
      if (remote && remote.gone) { if (code() === c) { handleGone(); pendingBody = body; pendingCode = code(); schedule(500); } return; }
      const kids = Object.values(body.profiles || {});
      for (const p of kids) {
        const s = JSON.stringify(p);
        if (written[c + '/' + p.id] === s) continue;
        await putDoc(c + '/kids/' + encodeURIComponent(p.id), p);
        written[c + '/' + p.id] = s;
      }
      // ندمج مع القائمة المحفوظة حتى لا يحذف جهاز بياناته قديمة طلاباً أضافهم جهاز آخر
      const removed = [...new Set([...((remote && remote.removed) || []), ...forgotten])];
      const ids = [...new Set([...((remote && remote.kids) || []), ...kids.map(p => p.id)])].filter(id => !removed.includes(id));
      const meta = { v: 2, parent: body.parent || (remote && remote.parent) || null, kids: ids, removed: removed.slice(-200), updated: Date.now() };
      const ms = JSON.stringify([meta.parent, meta.kids, meta.removed]);
      if (!remote || JSON.stringify([remote.parent || null, remote.kids || [], remote.removed || []]) !== ms) await putDoc(c, meta);
      // ملف الطالب المحذوف نفسه يُمسح من السحابة (أفضل جهد: قائمة removed تمنع ظهوره حتى لو فشل المسح)
      for (const id of forgotten) { try { await delRaw('families/' + c + '/kids/' + encodeURIComponent(id)); } catch (e) { } delete written[c + '/' + id]; }
      written[c] = ms; forgotten.clear();
      lastSync = Date.now(); lastErr = null;
    } catch (e) { lastErr = e; if (!pendingBody && pendingCode === c) pendingBody = body; schedule(15000); }
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(flush, ms); }

  const ref = () => ({
    async get() {
      await followAccount();
      let c = code();
      let meta = await getDoc(c);
      if (meta && meta.gone) { handleGone(); c = code(); meta = null; }
      if (!meta) return { exists: false, data: () => null };
      const profiles = {};
      const gone = new Set(meta.removed || []);
      const kids = await Promise.all((meta.kids || []).filter(id => !gone.has(id)).map(id => getDoc(c + '/kids/' + encodeURIComponent(id)).catch(() => null)));
      kids.forEach(p => { if (p && p.id) { profiles[p.id] = p; written[c + '/' + p.id] = JSON.stringify(p); } });
      written[c] = JSON.stringify([meta.parent || null, meta.kids || [], meta.removed || []]);
      lastSync = Date.now();
      return { exists: true, data: () => ({ v: 2, profiles, parent: meta.parent || null }) };
    },
    async set(body) { pendingBody = JSON.parse(JSON.stringify(body)); pendingCode = code(); schedule(1500); }
  });
  // يُحفظ آخر تغيير قبل إغلاق الصفحة قدر الإمكان
  addEventListener('pagehide', () => { if (pendingBody) flush(); });

  async function exists(c) { const m = await getDoc(clean(c)); return !!(m && !m.gone); }
  function join(c) {
    lsSet(KEY, clean(c));
    // البيانات المحلية تُدمج مع الأسرة الجديدة بعد جلبها، فلا نكتب النسخة القديمة الآن
    reset();
  }
  const forget = id => { forgotten.add(id); };

  /* ---------- حساب ولي الأمر (Google / Microsoft) ---------- */
  const acctInfo = () => { try { return JSON.parse(lsGet(ACCT) || 'null'); } catch (e) { return null; } };
  const canAccount = () => enabled() && !!S() && !!S().auth;
  async function user() {
    if (!canAccount() || !acctInfo()) return null;
    try { await S().auth(); } catch (e) { return null; }
    const u = await S().signedUser();
    if (!u) lsSet(ACCT, null);
    return u;
  }
  async function signIn(kind) {
    const a = await S().auth();
    await a.signInWithPopup(S().provider(kind));
    const u = a.currentUser;
    lsSet(ACCT, JSON.stringify({ n: u.displayName || u.email || '', e: u.email || '', p: kind }));
    return u;
  }
  async function signOut() { try { const a = await S().auth(); await a.signOut(); } catch (e) { } lsSet(ACCT, null); }
  const mapping = async uid => { const d = await getRaw('parents/' + uid); return d && d.data && d.data.fid ? clean(d.data.fid) : null; };
  const putMapping = (uid, fid) => putRaw('parents/' + uid, { fid, at: Date.now() });
  // يربط أسرة هذا الجهاز بالحساب، أو يعيد { other } إذا كان الحساب مربوطاً بأسرة أخرى (للاستعادة)
  async function link() {
    const u = await user(); if (!u) throw { code: 'no_user' };
    const m = await mapping(u.uid);
    if (m && m !== code() && await exists(m)) return { other: m };
    const c = code();
    const meta = await getDoc(c);
    if (meta && meta.gone) { handleGone(); return link(); }
    if (!meta) await putDoc(c, { v: 2, parent: null, kids: [], removed: [], updated: Date.now() }, { owners: [u.uid] });
    else await transform('families/' + c, 'owners', 'appendMissingElements', u.uid);
    await putMapping(u.uid, c);
    return { ok: true };
  }
  // عند فتح الموقع: إذا غيّر ولي الأمر الكود من جهاز آخر، نتبع الكود الجديد المحفوظ في حسابه
  let followed = false;
  async function followAccount() {
    if (followed || !acctInfo()) return; followed = true;
    try {
      const u = await user(); if (!u) return;
      const m = await mapping(u.uid);
      if (m && m !== code() && await exists(m)) join(m);
    } catch (e) { followed = false; }
  }
  // تغيير الكود: نسخ الأسرة لكود جديد يملكه هذا الحساب، ثم إلغاء القديم وحذف بياناته
  async function rotate() {
    const u = await user(); if (!u) throw { code: 'no_user' };
    if (pendingBody) await flush();
    const old = code(), meta = await getDoc(old);
    if (!meta || meta.gone) throw { code: 'missing' };
    const nc = newCode(), ids = (meta.kids || []).filter(id => !(meta.removed || []).includes(id));
    const kids = await Promise.all(ids.map(id => getDoc(old + '/kids/' + encodeURIComponent(id)).catch(() => null)));
    for (const p of kids) if (p && p.id) await putDoc(nc + '/kids/' + encodeURIComponent(p.id), p);
    await putDoc(nc, Object.assign({}, meta, { updated: Date.now() }), { owners: [u.uid] });
    await putMapping(u.uid, nc);
    join(nc);
    // القديم: نحذف بيانات الأبناء ونترك علامة «أُلغي» حتى لا تعيد الأجهزة القديمة إنشاءه
    try {
      for (const id of meta.kids || []) await delRaw('families/' + old + '/kids/' + encodeURIComponent(id));
      await putDoc(old, { gone: 1 }, { gone: true });
    } catch (e) { /* الكود الجديد يعمل حتى لو فشل التنظيف */ }
    return nc;
  }

  window.NQFamily = {
    enabled, code, pretty, clean, ref, join, exists, forget,
    status: () => ({ lastSync, err: lastErr, pending: !!pendingBody }),
    canAccount, account: acctInfo, user, signIn, signOut, link, rotate,
    takeGoneNotice: () => { const g = goneNotice; goneNotice = false; return g; }
  };
})();
