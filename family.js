/* حساب الأسرة على Firebase: يحفظ الطلاب ودرجاتهم ولوحة ولي الأمر في قاعدة البيانات، ويربط كل أجهزة الأسرة بكود سري.
   - كل جهاز يُنشئ كوداً تلقائياً أول مرة، ويمكن إدخال كود جهاز آخر للانضمام لنفس الأسرة.
   - التخزين: families/<code> (ولي الأمر وقائمة الطلاب) و families/<code>/kids/<id> (كل طالب في مستند).
   - الكود هو المفتاح الوحيد للبيانات، فلا يُشارك إلا مع أفراد الأسرة. */
(function () {
  const KEY = 'nq_family';
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => { const a = new Uint32Array(20); crypto.getRandomValues(a); return Array.from(a, n => ALPHA[n % ALPHA.length]).join(''); };
  const clean = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pretty = c => clean(c).match(/.{1,4}/g).join('-');
  const cfg = () => window.NQ_FIREBASE || null;
  const enabled = () => { const fb = cfg(); return !!(fb && fb.projectId && fb.apiKey && window.fetch && window.crypto); };
  function code() {
    let c = null; try { c = localStorage.getItem(KEY); } catch (e) { }
    if (!c || clean(c).length < 16) { c = newCode(); try { localStorage.setItem(KEY, c); } catch (e) { } }
    return clean(c);
  }
  const root = () => { const fb = cfg(); return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(fb.projectId) + '/databases/' + encodeURIComponent(fb.database || '(default)') + '/documents/families/'; };
  const q = () => '?key=' + encodeURIComponent(cfg().apiKey);
  async function getDoc(path) {
    const r = await fetch(root() + path + q());
    if (r.status === 404) return null;
    if (!r.ok) throw { code: 'http_' + r.status };
    const j = await r.json();
    return j.fields && j.fields.json ? JSON.parse(j.fields.json.stringValue) : null;
  }
  async function putDoc(path, obj) {
    const r = await fetch(root() + path + q(), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(obj) }, updated: { integerValue: String(Date.now()) } } })
    });
    if (!r.ok) throw { code: 'http_' + r.status };
  }

  const written = {};          // آخر نسخة كُتبت لكل مستند (لتجنّب إعادة الكتابة بلا تغيير)
  let pendingBody = null, timer = null, lastSync = 0, lastErr = null;
  async function flush() {
    timer = null; const body = pendingBody; pendingBody = null; if (!body) return;
    const c = code();
    try {
      const kids = Object.values(body.profiles || {});
      for (const p of kids) {
        const s = JSON.stringify(p);
        if (written[c + '/' + p.id] === s) continue;
        await putDoc(c + '/kids/' + encodeURIComponent(p.id), p);
        written[c + '/' + p.id] = s;
      }
      const meta = { v: 2, parent: body.parent || null, kids: kids.map(p => p.id), updated: Date.now() };
      const ms = JSON.stringify([meta.parent, meta.kids]);
      if (written[c] !== ms) { await putDoc(c, meta); written[c] = ms; }
      lastSync = Date.now(); lastErr = null;
    } catch (e) { lastErr = e; pendingBody = pendingBody || body; schedule(15000); }
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(flush, ms); }

  const ref = () => ({
    async get() {
      const c = code();
      const meta = await getDoc(c);
      if (!meta) return { exists: false, data: () => null };
      const profiles = {};
      const kids = await Promise.all((meta.kids || []).map(id => getDoc(c + '/kids/' + encodeURIComponent(id)).catch(() => null)));
      kids.forEach(p => { if (p && p.id) { profiles[p.id] = p; written[c + '/' + p.id] = JSON.stringify(p); } });
      written[c] = JSON.stringify([meta.parent || null, meta.kids || []]);
      lastSync = Date.now();
      return { exists: true, data: () => ({ v: 2, profiles, parent: meta.parent || null }) };
    },
    async set(body) { pendingBody = JSON.parse(JSON.stringify(body)); schedule(1500); }
  });
  // يُحفظ آخر تغيير قبل إغلاق الصفحة قدر الإمكان
  addEventListener('pagehide', () => { if (pendingBody) flush(); });

  async function exists(c) { return !!(await getDoc(clean(c))); }
  function join(c) { c = clean(c); try { localStorage.setItem(KEY, c); } catch (e) { } Object.keys(written).forEach(k => delete written[k]); }

  window.NQFamily = { enabled, code, pretty, clean, ref, join, exists, status: () => ({ lastSync, err: lastErr, pending: !!pendingBody }) };
})();
