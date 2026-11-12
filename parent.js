/* إضافات ولي الأمر: الواجبات، مراجعة الأخطاء، التقرير الأسبوعي، المقارنة، تفاصيل الاختبارات،
   أوقات المذاكرة، رسالة التشجيع، ووضع الامتحانات. يُحمَّل بعد game.js وقبل app.js. */
(function () {
  const N = () => window.NQ, Gm = () => window.NQGame;
  const esc = s => N().esc(s == null ? '' : s);
  const num = n => Number(n || 0).toLocaleString('ar-EG');
  const DAY = 864e5;
  const pad = n => String(n).padStart(2, '0');
  const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayStart = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
  const daysTo = s => Math.round((dayStart(s) - new Date().setHours(0, 0, 0, 0)) / DAY);
  const fdate = s => new Date(dayStart(s)).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  const hourTxt = h => { h = ((h % 24) + 24) % 24; const t = h === 0 ? 12 : h > 12 ? h - 12 : h; return num(t) + (h < 12 ? ' ص' : ' م'); };
  const firstName = s => String(s || '').trim().split(/\s+/)[0] || '';
  const lvlColor = v => v == null ? 'var(--muted)' : N().gradeOf(v).c;
  const avgOf = rs => rs.length ? Math.round(rs.reduce((a, r) => a + r.pct, 0) / rs.length) : null;
  const subjName = r => { const s = N().subjectById(r.subjectId); return s ? s.name : r.kind === 'daily' ? 'تحدي اليوم' : r.kind === 'duel' ? 'تحدي صديق' : '—'; };

  /* ================= 1) الواجبات ================= */
  function keyTitle(s, key) {
    if (key === 'mistakes') return 'مراجعة الأخطاء';
    const [u, l] = key.split('/'); const unit = s.units.find(x => x.id === u); if (!unit) return null;
    if (l === 'exam') return 'الاختبار الشامل – ' + unit.name.split(':')[0];
    const les = unit.lessons.find(x => x.id === l); return les ? les.short + ': ' + les.name : null;
  }
  function taskStatus(p, t) {
    if (t.doneAt) return { done: true, rec: null, late: false };
    const r = p.records.find(r => r.subjectId === t.sid && r.key === t.key && r.date >= t.created);
    if (r) return { done: true, rec: r, late: !!(t.due && r.date >= dayStart(t.due) + DAY) };
    return { done: false, late: !!(t.due && daysTo(t.due) < 0) };
  }
  function dueTxt(due) {
    if (!due) return 'بدون موعد';
    const d = daysTo(due);
    return d < 0 ? -d === 1 ? 'متأخر يوماً' : -d === 2 ? 'متأخر يومين' : `متأخر ${num(-d)} أيام` : d === 0 ? 'آخر موعد اليوم' : d === 1 ? 'آخر موعد غداً' : d === 2 ? 'آخر موعد بعد يومين' : `آخر موعد بعد ${num(d)} أيام`;
  }
  const openTasks = p => (p.tasks || []).map(t => ({ t, s: N().subjectById(t.sid), st: taskStatus(p, t) }))
    .filter(x => x.s && !x.st.done).sort((a, b) => (a.t.due || '9') < (b.t.due || '9') ? -1 : 1);

  /* ================= 6) أوقات المذاكرة ================= */
  function blocked(p) {
    const L = p && p.limits; if (!L) return null;
    const h = new Date().getHours();
    if (L.from != null && L.to != null && L.from !== L.to) {
      const inside = L.from < L.to ? (h >= L.from && h < L.to) : (h >= L.from || h < L.to);
      if (!inside) return `وقت المذاكرة المسموح من ${hourTxt(L.from)} إلى ${hourTxt(L.to)}`;
    }
    if (L.max) {
      const used = p.records.filter(r => ymd(new Date(r.date)) === ymd()).reduce((a, r) => a + (r.secs || 0), 0) / 60;
      if (used >= L.max) return `وصلت للحد اليومي للمذاكرة (${num(L.max)} دقيقة). استرح وعُد غداً 🌙`;
    }
    return null;
  }
  function timeOfDay(p, days = 30) {
    const from = Date.now() - days * DAY;
    const B = [{ t: 'الصباح', s: '5–12', n: 0 }, { t: 'الظهر', s: '12–4', n: 0 }, { t: 'المساء', s: '4–8', n: 0 }, { t: 'الليل', s: '8–5', n: 0 }];
    p.records.filter(r => r.date >= from).forEach(r => {
      const h = new Date(r.date).getHours();
      B[h >= 5 && h < 12 ? 0 : h >= 12 && h < 16 ? 1 : h >= 16 && h < 20 ? 2 : 3].n += r.total || 0;
    });
    return B;
  }

  /* ================= 8) وضع الامتحانات ================= */
  function examPlan(p, e) {
    const s = N().subjectById(e.sid); if (!s) return null;
    const st = N().subjectStats(s, p.records);
    const left = st.lessons.filter(x => st.best[x.key] == null || st.best[x.key] < 80);
    const d = daysTo(e.date);
    const per = Math.ceil(left.length / Math.max(1, d));
    return { s, left, d, today: left.slice(0, per), level: st.level };
  }
  /* العد التنازلي الحي للامتحانات */
  const examAt = e => { const [h, m] = String(e.time || '08:00').split(':').map(Number); return dayStart(e.date) + ((h || 0) * 60 + (m || 0)) * 60000; };
  const timeTxt = e => { const [h, m] = String(e.time || '08:00').split(':').map(Number); return num(h % 12 || 12) + ':' + num(m).padStart(2, '٠') + (h < 12 ? ' ص' : ' م'); };
  const examWhen = e => fdate(e.date) + ' · الساعة ' + timeTxt(e);
  function cdParts(at) {
    let s = Math.max(0, Math.floor((at - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60);
    return { d, h, m, s: s - m * 60, over: at <= Date.now(), near: at - Date.now() < 3 * DAY };
  }
  function cdInner(at) {
    const c = cdParts(at);
    if (c.over) return '<span class="px-cd-now">الامتحان الآن · بالتوفيق! 🍀</span>';
    const box = (v, l) => `<span><b>${num(v)}</b><small>${l}</small></span>`;
    return box(c.d, c.d <= 1 ? 'يوم' : c.d === 2 ? 'يومان' : c.d >= 3 && c.d <= 10 ? 'أيام' : 'يوماً') + box(c.h, 'ساعة') + box(c.m, 'دقيقة') + box(c.s, 'ثانية');
  }
  const cdHtml = at => { const c = cdParts(at); return `<div class="px-cd${c.near ? ' near' : ''}${c.over ? ' over' : ''}" data-cd="${at}" role="timer" aria-label="الوقت المتبقي على الامتحان">${cdInner(at)}</div>`; };
  let cdTimer = null;
  function startCd() {
    if (cdTimer) return;
    cdTimer = setInterval(() => {
      const els = document.querySelectorAll('[data-cd]');
      els.forEach(el => { const at = +el.dataset.cd, c = cdParts(at); el.innerHTML = cdInner(at); el.classList.toggle('near', c.near); el.classList.toggle('over', c.over); });
    }, 1000);
  }
  const upcoming = p => (p.exams || []).filter(e => daysTo(e.date) >= 0).sort((a, b) => a.date < b.date ? -1 : 1);

  /* ================= صفحة الطالب ================= */
  function homeHtml(p, part) {
    let h = '';
    if (part !== 'bottom') {
    if (p.msg && p.msg.text && !p.msg.seen) h += `<section class="px-msg" role="status"><span class="px-msg-ic" aria-hidden="true">💌</span>
      <div><small>رسالة من ولي أمرك</small><p>${esc(p.msg.text)}</p></div><button type="button" class="btn small" id="px-seen">شكراً ❤️</button></section>`;
    const b = blocked(p); if (b) h += `<div class="px-lock" role="note">⏰ ${esc(b)}</div>`;
    }
    if (part === 'top') return h;
    const open = openTasks(p);
    if (open.length) h += `<section class="card px-tasks"><div class="pg-row"><h2>📌 واجبات من ولي أمرك</h2><span class="pr-tag">${num(open.length)} مطلوب</span></div>
      <ul class="pg-list">${open.map(x => `<li><span class="dot" style="background:${x.st.late ? 'var(--bad)' : 'var(--accent)'}"></span>
        <div><b>${esc(x.t.title)}</b><small>${x.s.icon} ${esc(x.s.name)} · <span style="color:${x.st.late ? 'var(--bad)' : 'inherit'}">${dueTxt(x.t.due)}</span></small></div>
        <button type="button" class="btn small" data-task="${esc(x.t.id)}">ابدأ</button></li>`).join('')}</ul></section>`;
    const ex = upcoming(p).map(e => ({ e, pl: examPlan(p, e) })).filter(x => x.pl);
    if (ex.length) h += `<section class="card px-exams"><h2>📅 امتحاناتي القادمة</h2>${ex.map(({ e, pl }) => `<div class="px-exam col">
        <div class="px-exam-body"><b>${pl.s.icon} ${esc(pl.s.name)}</b>
          <small>${examWhen(e)} · ${pl.left.length ? `باقي ${num(pl.left.length)} ${pl.left.length === 1 ? 'درس يحتاج' : 'دروس تحتاج'} مراجعة` : 'راجعت كل الدروس 👏'}</small>
          ${cdHtml(examAt(e))}
          ${pl.today.length ? `<div class="px-plan"><small>خطة اليوم:</small>${pl.today.map(x => `<button type="button" class="chip-b" data-plan="${pl.s.id}|${x.key}">${esc(x.lesson.short)}: ${esc(x.lesson.name)}</button>`).join('')}</div>` : ''}
        </div></div>`).join('')}</section>`;
    return h;
  }
  function bindHome(p) {
    const NQ = N(), app = NQ.app;
    startCd();
    const seen = document.getElementById('px-seen');
    if (seen) seen.onclick = () => { p.msg.seen = Date.now(); NQ.persist(); NQ.route(); };
    app.querySelectorAll('[data-task]').forEach(b => b.onclick = () => {
      const t = (p.tasks || []).find(x => x.id === b.dataset.task); if (!t) return;
      const s = NQ.subjectById(t.sid); if (!s) return;
      if (t.key === 'mistakes' && !(p.wrong[s.id] || []).length) { t.doneAt = Date.now(); NQ.persist(); NQ.toast('لا توجد أخطاء متبقية، تم الواجب ✓'); NQ.route(); return; }
      NQ.openStart(s, t.key);
    });
    app.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { const [sid, key] = b.dataset.plan.split('|'); const s = NQ.subjectById(sid); if (s) NQ.openStart(s, key); });
  }

  /* ================= لوحة ولي الأمر: تنبيهات إضافية ================= */
  function alerts(p) {
    const out = [], fn = esc(firstName(p.name));
    (p.tasks || []).forEach(t => {
      const st = taskStatus(p, t);
      if (!st.done && st.late) out.push({ cls: 'bad', t: `${fn}: واجب متأخر`, s: `«${esc(t.title)}» · ${dueTxt(t.due)}`, pid: p.id });
      else if (st.done && st.rec && st.rec.date > Date.now() - 2 * DAY) out.push({ cls: 'ok', t: `${fn} أنهى واجباً`, s: `«${esc(t.title)}» · ${num(st.rec.pct)}٪`, pid: p.id });
    });
    upcoming(p).filter(e => daysTo(e.date) <= 3).forEach(e => { const s = N().subjectById(e.sid); if (s) out.push({ cls: 'mid', t: `${fn}: امتحان ${esc(s.name)} ${daysTo(e.date) === 0 ? 'اليوم' : `بعد ${num(daysTo(e.date))} ${daysTo(e.date) === 1 ? 'يوم' : 'أيام'}`}`, s: fdate(e.date), pid: p.id }); });
    return out;
  }

  /* ================= 4) المقارنة ================= */
  function compare(p, days) {
    const now = Date.now(), from = now - days * DAY, pf = from - days * DAY;
    const rows = N().SUBJECTS.filter(s => s.grade === p.grade).map(s => {
      const rs = p.records.filter(r => r.subjectId === s.id);
      const a = avgOf(rs.filter(r => r.date >= from)), b = avgOf(rs.filter(r => r.date >= pf && r.date < from));
      return { s, a, b, d: a != null && b != null ? a - b : null };
    }).filter(x => x.a != null || x.b != null);
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const to = now - (7 - i) * 7 * DAY + 1, fr = to - 7 * DAY;
      const rs = p.records.filter(r => r.date >= fr && r.date < to);
      return { avg: avgOf(rs), n: rs.length, label: new Date(fr + DAY).toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' }) };
    });
    return { rows, weeks };
  }
  const deltaTxt = d => d == null ? '<span class="pr-flat">—</span>' : d > 0 ? `<span class="pr-up">▲ ${num(d)}</span>` : d < 0 ? `<span class="pr-down">▼ ${num(-d)}</span>` : '<span class="pr-flat">=</span>';

  /* ================= 5) تفاصيل الاختبار ================= */
  let qIndex = null, qIndexN = 0;
  function qById(id) {
    if (!qIndex || qIndexN !== N().SUBJECTS.length) {
      qIndexN = N().SUBJECTS.length; qIndex = {}; N().SUBJECTS.forEach(s => N().allQuestions(s).forEach(q => { qIndex[q.id] = q; })); }
    return qIndex[id];
  }
  function showDetails(rec) {
    const NQ = N();
    const ov = document.createElement('div'); ov.className = 'overlay';
    const items = (rec.ans || []).map(([id, r, sc]) => ({ q: qById(id), r, sc })).filter(x => x.q);
    const right = items.filter(x => x.sc === 1).length;
    ov.innerHTML = `<div class="card px-det" role="dialog" aria-modal="true" aria-labelledby="pxdt">
      <div class="pg-row"><h2 id="pxdt">${esc(rec.title)}</h2><button type="button" class="btn ghost small" data-x>إغلاق</button></div>
      <p class="muted" style="margin:0 0 12px">${esc(subjName(rec))} · ${NQ.fmtDate(rec.date)} · ${rec.mode === 'exam' ? 'اختبار' : 'تدريب'} · ${num(rec.pct)}٪ · الوقت ${NQ.fmtTime(rec.secs || 0)}${items.length ? ` · صحيح ${num(right)} من ${num(items.length)}` : ''}</p>
      ${items.length ? `<ol class="px-qs">${items.map(x => `<li class="${x.sc === 1 ? 'ok' : x.sc > 0 ? 'part' : 'no'}">
          <p>${esc(x.q.q)}</p>${NQ.qImg ? NQ.qImg(x.q, true) : ''}
          <small><b>إجابة الطالب:</b> ${esc(NQ.respText(x.q, x.r))}</small>
          ${x.sc < 1 ? `<small><b>الصحيح:</b> ${esc(NQ.correctText(x.q))}</small>` : ''}
          ${x.sc < 1 && x.q.explain ? `<small>💡 ${esc(x.q.explain)}</small>` : ''}</li>`).join('')}</ol>`
        : '<p class="empty">تفاصيل الأسئلة متاحة للاختبارات التي حُلّت بعد تفعيل هذه الميزة فقط.</p>'}
    </div>`;
    ov.onclick = e => { if (e.target === ov || e.target.closest('[data-x]')) ov.remove(); };
    document.body.appendChild(ov);
    ov.querySelector('[data-x]').focus();
  }

  /* ================= لوحة ولي الأمر: أقسام تقرير الابن ================= */
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  // رموز تعبيرية يضيفها ولي الأمر لرسالته (مجموعات: تشجيع، محبة، احتفال، دراسة)
  const EMOJIS = [
    ['تشجيع', ['🌟', '⭐', '👏', '💪', '👍', '💯', '🔥', '✨']],
    ['محبة', ['❤️', '💚', '🤗', '😊', '😍', '🥰', '🙏', '😘']],
    ['احتفال', ['🎉', '🏆', '🥇', '🎁', '🎈', '🍦', '🍕', '⚽']],
    ['دراسة', ['📚', '✏️', '🧠', '⏰', '🎯', '🚀', '📖', '✅']]
  ];
  const MSGS = ['أحسنت! أنا فخور بك 🌟', 'استمر، أنت تتحسن كل يوم 💪', 'لا تستسلم، المحاولة القادمة أفضل ❤️', 'أنهِ واجبك اليوم وتنتظرك مفاجأة 🎁'];
  function kidHtml(p, period) {
    const NQ = N(), subs = NQ.SUBJECTS.filter(s => s.grade === p.grade);
    const tasks = (p.tasks || []).map(t => ({ t, s: NQ.subjectById(t.sid), st: taskStatus(p, t) })).filter(x => x.s).sort((a, b) => b.t.created - a.t.created);
    const cmp = compare(p, period);
    const maxW = 100;
    const tod = timeOfDay(p), todMax = Math.max(1, ...tod.map(b => b.n));
    const L = p.limits || {};
    const recent = p.records.slice().sort((a, b) => b.date - a.date).slice(0, 12);
    const exams = (p.exams || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
    const sOpts = subs.map(s => `<option value="${s.id}">${s.icon} ${esc(s.name)}</option>`).join('');
    return `
      <section class="pg-grid2">
        <div class="card px-card">
          <h2>📌 الواجبات</h2>
          <form class="px-form" id="px-tadd">
            <label><span>المادة</span><select id="px-ts">${sOpts}</select></label>
            <label class="wide"><span>الواجب</span><select id="px-tk"></select></label>
            <label><span>آخر موعد</span><input type="date" id="px-td" min="${ymd()}" value="${ymd(new Date(Date.now() + 2 * DAY))}"></label>
            <button class="btn" type="submit">إرسال الواجب</button>
          </form>
          ${tasks.length ? `<ul class="pg-list px-tlist">${tasks.slice(0, 10).map(x => {
            const c = x.st.done ? (x.st.rec ? lvlColor(x.st.rec.pct) : 'var(--ok)') : x.st.late ? 'var(--bad)' : 'var(--accent)';
            return `<li><span class="dot" style="background:${c}"></span><div><b>${esc(x.t.title)}</b><small>${x.s.icon} ${esc(x.s.name)} · ${x.st.done ? (x.st.rec ? `تم ${x.st.late ? 'بعد الموعد' : 'في الموعد'} · ${NQ.fmtDate(x.st.rec.date).split('،')[0]}` : 'تم') : dueTxt(x.t.due)}</small></div>
              ${x.st.rec ? `<button type="button" class="pct linkish" style="color:${c}" data-rec="${x.st.rec.id}">${num(x.st.rec.pct)}٪</button>` : x.st.done ? '<span class="pct" style="color:var(--ok)">✓</span>' : `<button type="button" class="linkish" data-tdel="${esc(x.t.id)}">إلغاء</button>`}</li>`;
          }).join('')}</ul>` : '<p class="hint" style="margin:8px 0 0">لا توجد واجبات بعد. اختر درساً، أو «مراجعة الأخطاء» ليحل الطالب الأسئلة التي أخطأ فيها من قبل.</p>'}
        </div>
        <div class="card px-card">
          <div class="pg-row"><h2>📊 مقارنة بالفترة السابقة</h2><small class="muted">آخر ${num(period)} يوماً مقابل ${num(period)} قبلها</small></div>
          ${cmp.rows.length ? `<table class="px-table"><thead><tr><th>المادة</th><th>قبل</th><th>الآن</th><th>التغيّر</th></tr></thead><tbody>
            ${cmp.rows.map(x => `<tr><td>${x.s.icon} ${esc(x.s.name)}</td><td>${x.b == null ? '—' : num(x.b) + '٪'}</td><td style="color:${lvlColor(x.a)};font-weight:800">${x.a == null ? '—' : num(x.a) + '٪'}</td><td>${deltaTxt(x.d)}</td></tr>`).join('')}
          </tbody></table>` : '<p class="empty">لا توجد اختبارات كافية للمقارنة بعد.</p>'}
          <h3 class="px-h3">متوسط الدرجات أسبوعياً (آخر 8 أسابيع)</h3>
          <div class="pg-chart px-wk" role="img" aria-label="${cmp.weeks.map(w => w.label + ': ' + (w.avg == null ? 'لا اختبارات' : w.avg + '٪')).join('، ')}">
            ${cmp.weeks.map(w => `<div class="col"><small>${w.avg == null ? '' : num(w.avg)}</small><i style="height:${w.avg == null ? 2 : Math.max(4, Math.round(w.avg / maxW * 100))}%;background:${w.avg == null ? 'var(--track)' : lvlColor(w.avg)}"></i></div>`).join('')}
          </div>
          <div class="pg-chart-x">${cmp.weeks.map(w => `<small>${w.label}</small>`).join('')}</div>
        </div>
      </section>
      <section class="card px-card">
        <div class="pg-row"><h2>📝 آخر الاختبارات</h2><small class="muted">اضغط على أي اختبار لرؤية كل سؤال وإجابة الطالب</small></div>
        ${recent.length ? `<ul class="pg-list">${recent.map(r => `<li><span class="dot" style="background:${lvlColor(r.pct)}"></span>
          <div><b>${esc(r.title)}</b><small>${esc(subjName(r))} · ${r.mode === 'exam' ? 'اختبار' : 'تدريب'} · ${NQ.fmtDate(r.date)}</small></div>
          <span class="pct" style="color:${lvlColor(r.pct)}">${num(r.pct)}٪</span><button type="button" class="btn ghost small" data-rec="${r.id}">التفاصيل</button></li>`).join('')}</ul>` : '<p class="empty">لم يحل أي اختبار بعد.</p>'}
      </section>
      <section class="pg-grid2">
        <div class="card px-card">
          <h2>⏰ وقت المذاكرة</h2>
          <small class="muted">متى يذاكر؟ (عدد الأسئلة في آخر 30 يوماً)</small>
          <div class="px-tod">${tod.map(b => `<div><span>${b.t}<small>${b.s}</small></span><div class="db-bar"><i style="width:${Math.round(b.n / todMax * 100)}%;background:var(--brand)"></i></div><b>${num(b.n)}</b></div>`).join('')}</div>
          <form class="px-form" id="px-lim">
            <label><span>يُسمح من</span><select id="px-lf"><option value="">أي وقت</option>${HOURS.map(h => `<option value="${h}" ${L.from === h ? 'selected' : ''}>${hourTxt(h)}</option>`).join('')}</select></label>
            <label><span>إلى</span><select id="px-lt"><option value="">أي وقت</option>${HOURS.map(h => `<option value="${h}" ${L.to === h ? 'selected' : ''}>${hourTxt(h)}</option>`).join('')}</select></label>
            <label><span>حد أقصى يومياً</span><select id="px-lm">${[0, 30, 45, 60, 90, 120, 180].map(m => `<option value="${m}" ${(L.max || 0) === m ? 'selected' : ''}>${m ? num(m) + ' دقيقة' : 'بدون حد'}</option>`).join('')}</select></label>
            <button class="btn" type="submit">حفظ</button>
          </form>
          ${blocked(p) ? `<p class="px-lock sm">الآن: ${esc(blocked(p))}</p>` : ''}
        </div>
        <div class="card px-card">
          <h2>💌 رسالة تشجيع</h2>
          <small class="muted">تظهر للطالب أول ما يفتح صفحته</small>
          ${p.msg && p.msg.text ? `<div class="px-sent"><p>«${esc(p.msg.text)}»</p><small>${p.msg.seen ? `قرأها ✓ · ${NQ.fmtDate(p.msg.seen)}` : `أُرسلت ${NQ.fmtDate(p.msg.t)} · لم تُقرأ بعد`}</small></div>` : ''}
          <div class="px-chips">${MSGS.map((m, i) => `<button type="button" class="chip-b" data-msgq="${i}">${esc(m)}</button>`).join('')}</div>
          <form class="px-form" id="px-msg"><label class="wide"><span class="sr">نص الرسالة</span><textarea id="px-mt" maxlength="140" rows="2" placeholder="اكتب رسالة قصيرة…" required></textarea></label><button class="btn" type="submit">إرسال</button></form>
          <div class="px-emojis" role="group" aria-label="رموز تعبيرية للرسالة">${EMOJIS.map(([g, list]) => `<div class="px-emo-row"><small>${g}</small><div>${list.map(e => `<button type="button" class="px-emo" data-emo="${e}" aria-label="أضف ${e}">${e}</button>`).join('')}</div></div>`).join('')}</div>
        </div>
      </section>
      <section class="card px-card">
        <h2>📅 مواعيد الامتحانات</h2>
        <small class="muted">يظهر للطالب عدّاد تنازلي وخطة مراجعة يومية للدروس التي لم يتقنها (أقل من 80٪)</small>
        ${exams.length ? `<div class="px-exams-p">${exams.map(e => { const pl = examPlan(p, e); if (!pl) return ''; const past = pl.d < 0; return `<div class="px-exam${past ? ' past' : ''}">
          <div class="px-exam-body"><b>${pl.s.icon} ${esc(pl.s.name)}</b><small>${examWhen(e)} · المستوى ${pl.level == null ? '—' : num(pl.level) + '٪'} · ${pl.left.length ? `${num(pl.left.length)} دروس تحتاج مراجعة` : 'كل الدروس متقنة'}</small>${past ? '<span class="px-cd-now">انتهى الامتحان ✓</span>' : cdHtml(examAt(e))}</div>
          <button type="button" class="linkish" data-edel="${esc(e.id)}">حذف</button></div>`; }).join('')}</div>` : ''}
        <form class="px-form" id="px-eadd">
          <label><span>المادة</span><select id="px-es">${sOpts}</select></label>
          <label><span>تاريخ الامتحان</span><input type="date" id="px-ed" min="${ymd()}" required></label>
          <label><span>الساعة</span><input type="time" id="px-et" value="08:00" required></label>
          <button class="btn" type="submit">إضافة امتحان</button>
        </form>
      </section>`;
  }
  function bindKid(p, rerender) {
    const NQ = N(), app = NQ.app;
    startCd();
    const ts = document.getElementById('px-ts'), tk = document.getElementById('px-tk');
    const fillKeys = () => {
      const s = NQ.subjectById(ts.value); if (!s) { tk.innerHTML = ''; return; }
      const wn = (p.wrong[s.id] || []).length;
      tk.innerHTML = `<option value="mistakes" ${wn ? '' : 'disabled'}>↺ مراجعة الأخطاء (${num(wn)} سؤال)</option>` + s.units.map(u => `<optgroup label="${esc(u.name)}">${u.lessons.map(l => `<option value="${u.id}/${l.id}">${esc(l.short)}: ${esc(l.name)}</option>`).join('')}<option value="${u.id}/exam">★ الاختبار الشامل للوحدة</option></optgroup>`).join('');
      if (!wn) tk.selectedIndex = 1;
    };
    if (ts) { ts.onchange = fillKeys; fillKeys(); }
    const tf = document.getElementById('px-tadd');
    if (tf) tf.onsubmit = e => {
      e.preventDefault(); const s = NQ.subjectById(ts.value), key = tk.value; if (!s || !key) return;
      const title = keyTitle(s, key); if (!title) return;
      p.tasks = p.tasks || [];
      if (p.tasks.some(t => t.sid === s.id && t.key === key && !taskStatus(p, t).done)) { NQ.toast('هذا الواجب مُرسل بالفعل'); return; }
      p.tasks.push({ id: NQ.newId(), sid: s.id, key, title, due: document.getElementById('px-td').value || null, created: Date.now() });
      if (p.tasks.length > 60) p.tasks = p.tasks.slice(-60);
      NQ.persist(); NQ.toast('تم إرسال الواجب ✓'); rerender();
    };
    app.querySelectorAll('[data-tdel]').forEach(b => b.onclick = () => { p.tasks = (p.tasks || []).filter(t => t.id !== b.dataset.tdel); NQ.persist(); rerender(); });
    app.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { const r = p.records.find(x => String(x.id) === b.dataset.rec); if (r) showDetails(r); });
    const lf = document.getElementById('px-lim');
    if (lf) lf.onsubmit = e => {
      e.preventDefault();
      const f = document.getElementById('px-lf').value, t = document.getElementById('px-lt').value, m = +document.getElementById('px-lm').value;
      if ((f === '') !== (t === '')) { NQ.toast('اختر بداية ونهاية الوقت، أو اترك الاثنين «أي وقت»'); return; }
      const lim = { from: f === '' ? null : +f, to: t === '' ? null : +t, max: m || 0 };
      p.limits = (lim.from == null && !lim.max) ? null : lim;
      NQ.persist(); NQ.toast('تم حفظ أوقات المذاكرة ✓'); rerender();
    };
    const mt = document.getElementById('px-mt');
    app.querySelectorAll('[data-msgq]').forEach(b => b.onclick = () => { mt.value = MSGS[+b.dataset.msgq]; mt.focus(); });
    // إدراج الرمز مكان المؤشر (مع احترام الحد الأقصى 140 حرفاً)
    app.querySelectorAll('[data-emo]').forEach(b => b.onclick = () => {
      const e = b.dataset.emo, s = mt.selectionStart ?? mt.value.length, en = mt.selectionEnd ?? s;
      const next = mt.value.slice(0, s) + e + mt.value.slice(en);
      if (next.length > 140) { NQ.toast('الرسالة وصلت للحد الأقصى (140 حرفاً)'); return; }
      mt.value = next; mt.focus(); const pos = s + e.length; mt.setSelectionRange(pos, pos);
    });
    const mf = document.getElementById('px-msg');
    if (mf) mf.onsubmit = e => { e.preventDefault(); const t = mt.value.trim().slice(0, 140); if (!t) return; p.msg = { text: t, t: Date.now(), seen: null }; NQ.persist(); NQ.toast('تم إرسال الرسالة ✓'); rerender(); };
    const ef = document.getElementById('px-eadd');
    if (ef) ef.onsubmit = e => {
      e.preventDefault(); const sid = document.getElementById('px-es').value, d = document.getElementById('px-ed').value;
      if (!sid || !d || daysTo(d) < 0) { NQ.toast('اختر تاريخاً من اليوم فصاعداً'); return; }
      p.exams = (p.exams || []).filter(x => !(x.sid === sid && x.date === d));
      const tm = document.getElementById('px-et').value || '08:00';
      if (examAt({ date: d, time: tm }) <= Date.now()) { NQ.toast('هذا الموعد مضى بالفعل'); return; }
      p.exams.push({ id: NQ.newId(), sid, date: d, time: tm, created: Date.now() });
      p.exams = p.exams.filter(x => daysTo(x.date) > -30);
      NQ.persist(); NQ.toast('تمت إضافة الامتحان ✓'); rerender();
    };
    app.querySelectorAll('[data-edel]').forEach(b => b.onclick = () => { p.exams = (p.exams || []).filter(x => x.id !== b.dataset.edel); NQ.persist(); rerender(); });
    app.querySelectorAll('[data-px-report]').forEach(b => b.onclick = () => { api.view = 'report'; rerender(); window.scrollTo(0, 0); });
  }

  /* ================= 3) التقرير الأسبوعي ================= */
  const REPORT_CSS = `.rp{font-family:'Tajawal',system-ui,Tahoma,sans-serif;font-weight:500;color:#1c2430;background:#fff;max-width:820px;margin:0 auto;padding:28px;border-radius:16px;line-height:1.7}
.rp h1{margin:0;font-size:1.5rem;font-family:'Cairo',system-ui,sans-serif;font-weight:900}.rp h2{font-family:'Cairo',system-ui,sans-serif;font-weight:800;font-size:1.05rem;margin:22px 0 8px;padding-bottom:4px;border-bottom:2px solid #0f766e;color:#0f766e}
.rp .rp-sub{color:#5f6b72;margin:2px 0 0}.rp .rp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
.rp .rp-kpis div{border:1px solid #e1e4dc;border-radius:12px;padding:10px;text-align:center}.rp .rp-kpis b{display:block;font-size:1.35rem}.rp .rp-kpis small{color:#5f6b72}
.rp table{width:100%;border-collapse:collapse;font-size:.92rem}.rp th,.rp td{text-align:right;padding:6px 8px;border-bottom:1px solid #e1e4dc}.rp th{background:#f3f4ef}
.rp .up{color:#15803d;font-weight:700}.rp .down{color:#b91c1c;font-weight:700}.rp .note{background:#fff3df;border-radius:10px;padding:10px 14px;margin-top:8px}
.rp .rp-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center}.rp .rp-days div{border-radius:10px;padding:6px;background:#f3f4ef}.rp .rp-days .ok{background:#e6f5ea}
.rp .rp-foot{margin-top:24px;color:#5f6b72;font-size:.8rem;text-align:center}
@media (max-width:600px){.rp{padding:16px}.rp .rp-kpis{grid-template-columns:repeat(2,1fr)}}
@media print{.rp{padding:0;max-width:none}}`;
  function reportInner(p) {
    const NQ = N(), G = Gm(), now = Date.now(), from = now - 7 * DAY, pf = from - 7 * DAY;
    const rs = p.records.filter(r => r.date >= from), prev = p.records.filter(r => r.date >= pf && r.date < from);
    const a = avgOf(rs), b = avgOf(prev), mins = Math.round(rs.reduce((s, r) => s + (r.secs || 0), 0) / 60);
    const goal = G ? G._goalOf(p) : 20;
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return { d, n: G ? G._answeredOn(p, ymd(d)) : 0 }; });
    const cmp = compare(p, 7).rows;
    const weak = NQ.SUBJECTS.filter(s => s.grade === p.grade).flatMap(s => NQ.subjectStats(s, p.records).weak).sort((x, y) => x.pct - y.pct).slice(0, 6);
    const tasks = (p.tasks || []).filter(t => t.created >= from || !taskStatus(p, t).done).map(t => ({ t, st: taskStatus(p, t), s: NQ.subjectById(t.sid) })).filter(x => x.s);
    const dt = d => d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    const tips = [];
    if (a == null) tips.push('لم يحل الطالب أي اختبار هذا الأسبوع، يُنصح بتحديد وقت ثابت للمذاكرة يومياً.');
    else if (b != null && a < b - 4) tips.push(`انخفض المتوسط ${num(b - a)} درجات عن الأسبوع السابق.`);
    else if (b != null && a > b + 4) tips.push(`تحسّن المتوسط ${num(a - b)} درجات عن الأسبوع السابق 👏`);
    if (weak.length) tips.push(`يُنصح بمراجعة: ${weak.slice(0, 3).map(w => w.name).join('، ')}.`);
    const goalDays = days.filter(d => d.n >= goal).length;
    return `<div class="rp">
      <h1>التقرير الأسبوعي: ${esc(p.name)}</h1>
      <p class="rp-sub">${esc(p.grade)} · من ${dt(new Date(from))} إلى ${dt(new Date())}</p>
      <div class="rp-kpis">
        <div><b>${a == null ? '—' : num(a) + '٪'}</b><small>متوسط الدرجات${b != null ? ` (قبلها ${num(b)}٪)` : ''}</small></div>
        <div><b>${num(rs.length)}</b><small>اختبارات</small></div>
        <div><b>${num(rs.reduce((s, r) => s + (r.total || 0), 0))}</b><small>سؤالاً</small></div>
        <div><b>${num(mins)} د</b><small>وقت المذاكرة</small></div>
      </div>
      <h2>المذاكرة يومياً (الهدف ${num(goal)} سؤالاً · تحقق ${num(goalDays)} من ${num(7)} أيام)</h2>
      <div class="rp-days">${days.map(d => `<div class="${d.n >= goal ? 'ok' : ''}"><small>${d.d.toLocaleDateString('ar-EG', { weekday: 'short' })}</small><br><b>${num(d.n)}</b></div>`).join('')}</div>
      <h2>المستوى في المواد</h2>
      ${cmp.length ? `<table><thead><tr><th>المادة</th><th>الأسبوع السابق</th><th>هذا الأسبوع</th><th>التغيّر</th></tr></thead><tbody>${cmp.map(x => `<tr><td>${esc(x.s.name)}</td><td>${x.b == null ? '—' : num(x.b) + '٪'}</td><td><b>${x.a == null ? '—' : num(x.a) + '٪'}</b></td><td>${x.d == null ? '—' : x.d > 0 ? `<span class="up">▲ ${num(x.d)}</span>` : x.d < 0 ? `<span class="down">▼ ${num(-x.d)}</span>` : '='}</td></tr>`).join('')}</tbody></table>` : '<p>لا توجد اختبارات في آخر أسبوعين.</p>'}
      <h2>دروس تحتاج مراجعة</h2>
      ${weak.length ? `<table><thead><tr><th>الدرس</th><th>المادة</th><th>أفضل درجة</th></tr></thead><tbody>${weak.map(w => `<tr><td>${esc(w.name)}</td><td>${esc(w.s.name)}</td><td class="down">${num(w.pct)}٪</td></tr>`).join('')}</tbody></table>` : '<p>كل الدروس المحلولة درجتها 65٪ أو أكثر.</p>'}
      ${tasks.length ? `<h2>الواجبات</h2><table><thead><tr><th>الواجب</th><th>المادة</th><th>الحالة</th></tr></thead><tbody>${tasks.map(x => `<tr><td>${esc(x.t.title)}</td><td>${esc(x.s.name)}</td><td>${x.st.done ? (x.st.rec ? `<span class="up">تم · ${num(x.st.rec.pct)}٪</span>` : '<span class="up">تم</span>') : `<span class="${x.st.late ? 'down' : ''}">${dueTxt(x.t.due)}</span>`}</td></tr>`).join('')}</tbody></table>` : ''}
      ${tips.length ? `<div class="rp-notes" style="break-inside:avoid;page-break-inside:avoid"><h2>ملاحظات</h2>${tips.map(t => `<p class="note">${esc(t)}</p>`).join('')}</div>` : ''}
      <p class="rp-foot">قِمّة · ${dt(new Date())}</p>
    </div>`;
  }
  // مكتبة تحويل الصفحة إلى PDF (تُحمّل عند أول استخدام فقط)
  let pdfLib = null;
  const loadPdfLib = () => pdfLib || (pdfLib = new Promise((res, rej) => {
    if (window.html2pdf) return res();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = () => window.html2pdf ? res() : rej(new Error('pdf'));
    s.onerror = () => { pdfLib = null; rej(new Error('pdf')); };
    document.head.appendChild(s);
  }));
  function renderReport(p, back) {
    const NQ = N(), app = NQ.app;
    app.innerHTML = `<section class="pr-page px-report">
      <div class="px-rbar no-print">
        <button type="button" class="btn ghost" id="px-back">→ رجوع للتقرير الكامل</button>
        <span style="flex:1"></span>
        <button type="button" class="btn ghost" id="px-print">🖨️ طباعة / PDF</button>
        <button type="button" class="btn" id="px-dl">⬇ تنزيل PDF</button>
      </div>
      <p class="hint no-print" style="margin:0 0 12px">لإرساله للمدرس: نزّل التقرير كملف PDF ثم أرسله بالواتساب أو البريد.</p>
      <style>${REPORT_CSS}</style>${reportInner(p)}
    </section>`;
    document.getElementById('px-back').onclick = () => { api.view = null; back(); window.scrollTo(0, 0); };
    document.getElementById('px-print').onclick = () => {
      document.body.classList.add('px-printing');
      try { window.print(); } catch (e) { NQ.toast('الطباعة غير متاحة هنا، نزّل التقرير واطبعه'); }
      setTimeout(() => document.body.classList.remove('px-printing'), 500);
    };
    // تنزيل التقرير كملف PDF (صفحات A4) يُرسم من التقرير الظاهر نفسه
    document.getElementById('px-dl').onclick = async () => {
      const btn = document.getElementById('px-dl'), label = btn.textContent;
      const filename = 'تقرير-' + String(p.name).trim().replace(/\s+/g, '-') + '-' + ymd() + '.pdf';
      btn.disabled = true; btn.textContent = '⏳ جارٍ تجهيز PDF…';
      let box = null;
      try {
        await loadPdfLib();
        try { await document.fonts.ready; } catch (e) { }
        // نسخة بعرض صفحة A4 خارج الشاشة حتى يكون الشكل واحداً على الكمبيوتر والموبايل
        box = document.createElement('div');
        box.setAttribute('aria-hidden', 'true');
        box.style.cssText = 'position:absolute;left:0;top:0;z-index:-1;width:760px;background:#fff;direction:rtl';
        box.innerHTML = `<style>${REPORT_CSS}.rp{max-width:none;border-radius:0;padding:8px 22px 8px 10px}</style>${reportInner(p)}`;
        document.body.appendChild(box);
        // الرسم عبر محرك المتصفح نفسه (foreignObject) يحافظ على تشكيل العربية والمسافات؛ وإن لم يدعمه المتصفح نرجع للرسم العادي
        const make = fo => window.html2pdf().set({
          margin: [10, 10, 12, 10], filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, foreignObjectRendering: fo, scrollX: 0, scrollY: 0, x: 0, y: 0, windowWidth: 760 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h2', '.rp-kpis', '.rp-days', '.rp-notes'] }
        }).from(box.querySelector('.rp')).outputPdf('blob');
        let blob;
        try { blob = await make(true); } catch (e) { blob = await make(false); }
        let dl = null;
        if (window.claude && typeof window.claude.use === 'function') { try { dl = await window.claude.use('downloads'); } catch (e) { } }
        if (dl) { try { await dl.save({ filename, data: blob }); NQ.toast('تم حفظ التقرير ✓'); } catch (e) { if (e && e.code !== 'declined') NQ.toast('تعذّر التنزيل هنا'); } return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        NQ.toast('تم تنزيل التقرير PDF ✓');
      } catch (e) {
        NQ.toast('تعذّر تجهيز ملف PDF. استخدم «طباعة / PDF» واختر «حفظ كـ PDF».');
      } finally {
        if (box) box.remove();
        btn.disabled = false; btn.textContent = label;
      }
    };
  }

  /* ================= حفظ تفاصيل الإجابات + الدمج ================= */
  const KEEP_DETAILS = 40;
  function trimDetails(p) {
    let n = 0;
    for (let i = p.records.length - 1; i >= 0; i--) { if (p.records[i].ans) { n++; if (n > KEEP_DETAILS) delete p.records[i].ans; } }
  }
  function merge(t, src) {
    ['msg', 'limits'].forEach(k => { if (t[k] == null && src[k] != null) t[k] = src[k]; });
    if (src.srs) { t.srs = t.srs || {}; Object.entries(src.srs).forEach(([id, e]) => { const m = t.srs[id]; if (!m || (e && e.d > m.d)) t.srs[id] = e; }); }
    if (t.msg && src.msg && src.msg.t === t.msg.t && src.msg.seen && !t.msg.seen) t.msg.seen = src.msg.seen;
    ['tasks', 'exams'].forEach(k => {
      if (!src[k]) return; const have = new Map((t[k] || []).map(x => [x.id, x]));
      src[k].forEach(x => { const m = have.get(x.id); if (!m) have.set(x.id, x); else if (x.doneAt && !m.doneAt) m.doneAt = x.doneAt; });
      t[k] = [...have.values()];
    });
  }

  /* ================= ربط أجهزة الأسرة ================= */
  function familyHtml() {
    const F = window.NQFamily; if (!F || !F.enabled()) return '';
    const NQ = N(), st = F.status();
    const state = !NQ.synced ? '⏳ جارٍ الاتصال بحساب الأسرة…' : st.err ? '⚠️ تعذّر الحفظ الآن، سيُعاد المحاولة تلقائياً' : st.pending ? '⏳ جارٍ الحفظ…' : `☁️ كل البيانات محفوظة${st.lastSync ? ' · آخر مزامنة ' + new Date(st.lastSync).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }) : ''}`;
    return `<section class="card px-family-row">
      <div class="px-fam-info"><b>📱 أجهزة الأسرة</b><small>${state}</small></div>
      <div class="px-fam-acts">
        <button type="button" class="linkish" id="fam-other">عندي كود من جهاز آخر</button>
        <button type="button" class="btn" id="fam-open">+ ربط جهاز جديد</button>
      </div>
    </section>`;
  }
  const ICO = {
    near: '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    far: '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1"/></svg>',
    wa: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z"/></svg>',
    share: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>',
    copy: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/></svg>'
  };
  const joinUrl = () => location.origin + location.pathname + '#join-' + window.NQFamily.code();
  let qrLib = null;
  const loadQr = () => qrLib || (qrLib = new Promise((res, rej) => {
    if (window.qrcode) return res();
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = res; s.onerror = () => { qrLib = null; rej(new Error('qr')); }; document.head.appendChild(s);
  }));
  const SHARE_TEXT = 'رابط ربط جهازك بحساب أسرتنا في منصة قِمّة (لا ترسله لأحد خارج الأسرة):';
  async function copyText(t, ok) { try { await navigator.clipboard.writeText(t); N().toast(ok); } catch (e) { N().toast(t); } }
  // نافذة «ربط جهاز جديد»: سؤال واحد ثم الطريقة المناسبة (على الموبايل تظهر من أسفل الشاشة)
  function openLinkWindow() {
    const F = window.NQFamily;
    document.querySelectorAll('.overlay.px-link').forEach(x => x.remove());
    const ov = document.createElement('div'); ov.className = 'overlay px-link';
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); if (opener) opener.focus(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    const opener = document.activeElement;
    const shell = (title, body, back) => `<div class="card px-sheet" role="dialog" aria-modal="true" aria-labelledby="pxl-t">
      <span class="px-grab" aria-hidden="true"></span>
      <div class="px-sheet-head">${back ? '<button type="button" class="px-icon-btn" data-back aria-label="رجوع">→</button>' : ''}<h2 id="pxl-t">${title}</h2><button type="button" class="px-icon-btn" data-x aria-label="إغلاق">×</button></div>
      ${body}
      <p class="hint px-sheet-note">🔒 الرابط والكود مفتاح بيانات الأسرة، أرسلهما لأفراد الأسرة فقط.</p></div>`;
    const bind = () => {
      ov.querySelector('[data-x]').onclick = close;
      const b = ov.querySelector('[data-back]'); if (b) b.onclick = () => step('choose');
      const f = ov.querySelector('button:not([data-x]):not([data-back])') || ov.querySelector('[data-x]'); if (f) f.focus();
    };
    function step(s) {
      if (s === 'choose') {
        ov.innerHTML = shell('أين الجهاز الآخر؟', `<div class="px-choose">
          <button type="button" class="px-choice on" data-go="near">${ICO.near}<b>بجانبي الآن</b><small>أعرض كود QR لتصويره بالكاميرا</small></button>
          <button type="button" class="px-choice" data-go="far">${ICO.far}<b>في مكان آخر</b><small>أرسل رابطاً بالواتساب أو أي تطبيق</small></button>
        </div>
        <details class="px-fam-manual"><summary>أو اكتب الكود يدوياً</summary>
          <p class="muted" style="margin:6px 0">في الجهاز الآخر اختر «عندي كود أسرة من جهاز آخر» واكتب:</p>
          <div class="px-fam-code"><b dir="ltr">${F.pretty(F.code())}</b><button type="button" class="btn ghost small" data-copycode>نسخ</button></div>
        </details>`);
        bind();
        ov.querySelectorAll('[data-go]').forEach(b => b.onclick = () => step(b.dataset.go));
        ov.querySelector('[data-copycode]').onclick = () => copyText(F.pretty(F.code()), 'تم نسخ الكود ✓');
      } else if (s === 'near') {
        ov.innerHTML = shell('صوّر هذا الكود', `<div class="px-qr-step"><div class="px-qr-img" id="pxl-qr"><p class="muted">⏳ جارٍ التجهيز…</p></div>
          <ol class="px-steps"><li>افتح الكاميرا في الجهاز الآخر.</li><li>وجّهها على الكود حتى يظهر رابط.</li><li>اضغط الرابط ثم «نعم، اربط الجهاز».</li></ol></div>`, true);
        bind();
        loadQr().then(() => {
          const q = window.qrcode(0, 'M'); q.addData(joinUrl()); q.make();
          const el = ov.querySelector('#pxl-qr'); if (!el) return;
          el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'كود QR لربط جهاز آخر بحساب الأسرة');
          el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        }).catch(() => { const el = ov.querySelector('#pxl-qr'); if (el) el.innerHTML = '<p class="muted">تعذّر تجهيز الكود (يحتاج إنترنت). ارجع واختر «في مكان آخر».</p>'; });
      } else {
        const url = joinUrl();
        ov.innerHTML = shell('أرسل رابط الربط', `<div class="px-send">
          <a class="px-send-btn wa" href="https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + '\n' + url)}" target="_blank" rel="noopener">${ICO.wa}<span><b>إرسال بالواتساب</b><small>لنفسك أو لأحد أفراد الأسرة</small></span></a>
          ${navigator.share ? `<button type="button" class="px-send-btn" data-share>${ICO.share}<span><b>مشاركة بتطبيق آخر</b><small>رسائل، بريد، تيليجرام…</small></span></button>` : ''}
          <button type="button" class="px-send-btn" data-copy>${ICO.copy}<span><b>نسخ الرابط</b><small>للصقه في أي مكان</small></span></button>
        </div><p class="muted" style="margin:0">افتح الرابط على الجهاز الآخر، ثم اضغط «نعم، اربط الجهاز».</p>`, true);
        bind();
        const sh = ov.querySelector('[data-share]');
        if (sh) sh.onclick = async () => { try { await navigator.share({ title: 'قِمّة', text: SHARE_TEXT, url }); } catch (e) { } };
        ov.querySelector('[data-copy]').onclick = () => copyText(url, 'تم نسخ رابط الربط ✓');
      }
    }
    ov.onclick = e => { if (e.target === ov) close(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    step('choose');
  }
  function bindFamily() {
    const F = window.NQFamily; if (!F || !F.enabled()) return;
    const op = document.getElementById('fam-open'); if (op) op.onclick = openLinkWindow;
    const ot = document.getElementById('fam-other'); if (ot) ot.onclick = () => N().familyJoinDialog();
  }

  const api = { view: null, showDetails, familyHtml, bindFamily, homeHtml, bindHome, blocked, alerts, kidHtml, bindKid, renderReport, trimDetails, merge };
  window.NQP = api;
})();
