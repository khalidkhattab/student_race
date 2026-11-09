/* الإبلاغ عن خطأ في سؤال + صفحة البلاغات لولي الأمر/المسؤول.
   البلاغات تُحفظ في Firestore (المجموعة reports) عند تفعيل Firebase، وإلا تُحفظ على الجهاز. */
(function () {
  const N = () => window.NQ;
  const esc = s => N().esc(s == null ? '' : s);
  const num = n => Number(n || 0).toLocaleString('ar-EG');
  const REASONS = ['الإجابة المعتبرة صحيحة خاطئة', 'أكثر من إجابة صحيحة', 'السؤال غير واضح', 'خطأ إملائي أو في الكتابة', 'خارج المنهج', 'سبب آخر'];
  const KEY_LOCAL = 'nq_reports_local', KEY_DONE = 'nq_reports_done';
  const cfg = () => window.NQ_FIREBASE || null;
  const base = () => { const fb = cfg(); return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(fb.projectId) + '/databases/' + encodeURIComponent(fb.database || '(default)') + '/documents'; };
  const lget = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
  const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  function subjectOf(qid) {
    for (const s of N().SUBJECTS) for (const u of s.units) for (const l of u.lessons) for (const q of l.questions) if (q.id === qid) return { s, u, l, q };
    return null;
  }
  async function send(rep) {
    const fb = cfg();
    if (fb && fb.projectId && fb.apiKey) {
      const r = await fetch(base() + '/reports?key=' + encodeURIComponent(fb.apiKey), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(rep) }, updated: { integerValue: String(rep.at) } } })
      });
      if (!r.ok) throw { code: 'http_' + r.status };
      return 'cloud';
    }
    const all = lget(KEY_LOCAL, []); all.push(rep); lset(KEY_LOCAL, all.slice(-300)); return 'local';
  }
  async function list() {
    const fb = cfg(); let out = lget(KEY_LOCAL, []).slice();
    if (fb && fb.projectId && fb.apiKey) {
      const r = await fetch(base() + ':runQuery?key=' + encodeURIComponent(fb.apiKey), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'reports' }], orderBy: [{ field: { fieldPath: 'updated' }, direction: 'DESCENDING' }], limit: 500 } })
      });
      if (!r.ok) throw { code: 'http_' + r.status };
      const rows = await r.json();
      (Array.isArray(rows) ? rows : []).forEach(x => { try { const v = JSON.parse(x.document.fields.json.stringValue); if (v && v.qid) out.push(v); } catch (e) { } });
    }
    return out;
  }

  /* ----- نافذة الإبلاغ ----- */
  function open(qid) {
    const NQ = N(), info = subjectOf(qid); if (!info) return;
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<form class="card rp-form" role="dialog" aria-modal="true" aria-labelledby="rpt">
      <h2 id="rpt">🚩 الإبلاغ عن خطأ في السؤال</h2>
      <p class="rp-q">${esc(info.q.q)}</p>
      <fieldset class="rp-reasons"><legend class="sr">سبب البلاغ</legend>
        ${REASONS.map((r, i) => `<label><input type="radio" name="rr" value="${i}" ${i === 0 ? 'checked' : ''}> ${esc(r)}</label>`).join('')}</fieldset>
      <label class="pin-lbl" for="rpn">ملاحظة (اختياري): ما الإجابة الصحيحة في رأيك؟</label>
      <textarea id="rpn" maxlength="300" rows="2"></textarea>
      <p class="hint" style="margin:0">لا تكتب اسمك أو أي بيانات شخصية.</p>
      <p class="err" id="rpe" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost" data-x>إلغاء</button><button class="btn" type="submit">إرسال البلاغ</button></div></form>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    ov.querySelector('form').onsubmit = async e => {
      e.preventDefault();
      const reason = +ov.querySelector('input[name=rr]:checked').value;
      const rep = { qid, sid: info.s.id, grade: info.s.grade, reason, note: ov.querySelector('#rpn').value.trim().slice(0, 300), at: Date.now() };
      const btn = ov.querySelector('button[type=submit]'); btn.disabled = true;
      try { await send(rep); ov.remove(); NQ.toast('شكراً! وصل البلاغ وسنراجع السؤال ✓'); }
      catch (err) { btn.disabled = false; ov.querySelector('#rpe').textContent = 'تعذّر الإرسال. تأكد من الاتصال وحاول مرة أخرى.'; }
    };
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-report]'); if (b) open(b.dataset.report); });
  const button = qid => `<button type="button" class="rp-btn" data-report="${esc(qid)}">🚩 أبلغ عن خطأ في السؤال</button>`;

  /* ----- صفحة البلاغات ----- */
  async function renderPage() {
    const NQ = N(), app = NQ.app;
    app.innerHTML = `<section class="pr-page"><header class="pg-head"><div><h1>🚩 بلاغات الأسئلة</h1><p class="sub">الأسئلة التي أبلغ الطلاب عن خطأ فيها، الأكثر بلاغات أولاً. صحّح السؤال في ملف المادة ثم اضغط «تم».</p></div>
      <a class="btn ghost small" href="#parent">→ لوحة ولي الأمر</a></header><div id="rp-list"><p class="empty">⏳ جارٍ التحميل…</p></div></section>`;
    let all;
    try { all = await list(); } catch (e) { document.getElementById('rp-list').innerHTML = '<p class="empty">تعذّر تحميل البلاغات. تأكد من الاتصال.</p>'; return; }
    // الصفوف غير المحمّلة: نحمّلها لعرض نص الأسئلة
    if (window.NQLoadGrade) await Promise.all([...new Set(all.map(r => r.grade).filter(Boolean))].map(g => window.NQLoadGrade(g).catch(() => { })));
    const done = lget(KEY_DONE, {});
    const groups = {};
    all.forEach(r => { if (done[r.qid] && r.at <= done[r.qid]) return; (groups[r.qid] = groups[r.qid] || []).push(r); });
    const rows = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    const el = document.getElementById('rp-list'); if (!el) return;
    el.innerHTML = rows.length ? rows.map(([qid, rs]) => {
      const info = subjectOf(qid);
      const reasons = {}; rs.forEach(r => { reasons[r.reason] = (reasons[r.reason] || 0) + 1; });
      return `<article class="card rp-item"><div class="pg-row"><b>${info ? `${info.s.icon} ${esc(info.s.name)} · ${esc(info.s.grade)} · ${esc(info.l.short)}` : esc(qid)}</b><span class="pr-tag">${num(rs.length)} ${rs.length === 1 ? 'بلاغ' : 'بلاغات'}</span></div>
        ${info ? `<p class="rp-q">${esc(info.q.q)}</p><p class="rp-a">الإجابة المعتبرة الآن: <b>${esc(NQ.correctText(info.q))}</b></p>` : '<p class="muted">السؤال غير موجود في الملفات الحالية (ربما عُدّل أو حُذف).</p>'}
        <ul class="rp-reasons-list">${Object.entries(reasons).map(([k, n]) => `<li>${esc(REASONS[k] || '—')} <small>(${num(n)})</small></li>`).join('')}</ul>
        ${rs.filter(r => r.note).slice(0, 5).map(r => `<p class="rp-note">💬 ${esc(r.note)}</p>`).join('')}
        <div class="pg-row sm"><small class="muted">رقم السؤال: <code dir="ltr">${esc(qid)}</code> · آخر بلاغ ${NQ.fmtDate(Math.max(...rs.map(r => r.at)))}</small><button type="button" class="btn ghost small" data-rpdone="${esc(qid)}">تم ✓</button></div>
      </article>`;
    }).join('') : '<p class="empty">لا توجد بلاغات جديدة 🎉</p>';
    el.querySelectorAll('[data-rpdone]').forEach(b => b.onclick = () => { const d = lget(KEY_DONE, {}); d[b.dataset.rpdone] = Date.now(); lset(KEY_DONE, d); renderPage(); });
  }

  window.NQReports = { open, button, renderPage };
})();
