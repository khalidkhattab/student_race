/* صفحة البداية «قِمّة»: تظهر عند فتح الموقع بدون عنوان صفحة (أو ‎#welcome).
   فيها اختبار تجريبي من 5 أسئلة يعمل بدون تسجيل. */
(function () {
  const ar = n => Number(n).toLocaleString('ar-EG');
  const ICON = {
    trophy: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/></svg>',
    play: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M7 4l13 8-13 8z"/></svg>',
    login: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/></svg>',
    layers: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    crown: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>',
    bolt: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    medal: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5"/></svg>',
    flask: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/></svg>',
    phone: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>'
  };
  const LOGO = '<svg aria-hidden="true" width="56" height="40" viewBox="0 0 56 40"><path d="M2 38L20 10l8 11 6-8 20 25z" fill="#0f766e"/><path d="M20 10l5 7-5-1-4 5z" fill="#fff" opacity=".85"/><path d="M34 13l4 5-4-1-3 3z" fill="#fff" opacity=".75"/><path d="M34 13V1" stroke="#10233f" stroke-width="1.6"/><path d="M34 1h9l-2.5 3 2.5 3h-9z" fill="#f2b705"/></svg>';
  window.NQ_LOGO = LOGO;

  // أسئلة التجربة (من بنك أسئلة المنصة)
  const QS = [
    { s: 'فيزياء', q: 'أقصر بُعد مستقيم بين نقطة البداية ونقطة النهاية هو:', o: ['المسافة', 'الإزاحة', 'السرعة'], a: 1, e: 'الإزاحة خط مستقيم من البداية للنهاية مع الاتجاه، أما المسافة فطول المسار كله.' },
    { s: 'رياضيات', q: 'قيمة ‎|−7|‎ تساوي:', o: ['7', '−7', '0'], a: 0, e: 'القيمة المطلقة هي بُعد العدد عن الصفر، والبُعد لا يكون سالباً.' },
    { s: 'كيمياء', q: 'الإلكترون جسيم شحنته:', o: ['موجبة', 'متعادلة', 'سالبة'], a: 2, e: 'البروتون موجب، والنيوترون متعادل، والإلكترون سالب.' },
    { s: 'رياضيات', q: 'قيمة sin 30° تساوي:', o: ['1', '½', '0'], a: 1, e: 'في المثلث 30°-60°-90° الضلع المقابل لزاوية 30° نصف الوتر.' },
    { s: 'أحياء', q: 'الوحدة الأساسية في بناء الكائن الحي هي:', o: ['النسيج', 'العضو', 'الخلية'], a: 2, e: 'كل الكائنات الحية تتكون من خلية واحدة أو أكثر.' }
  ];
  const ROLES = {
    student: [['تدرّب على جميع المواد', 'اختبارات لكل درس ووحدة'], ['تابع تقدّمك', 'واعرف نقاط قوتك'], ['صحّح أخطاءك', 'بشرح مبسّط ومراجعة ذكية'], ['شارك في التحديات', 'واكسب أوسمة وإنجازات']],
    parent: [['تابع أبناءك', 'من أي جهاز برابط الأسرة'], ['أرسل واجبات', 'ورسائل تشجيع ومكافآت'], ['تقرير أسبوعي', 'جاهز للطباعة والمشاركة'], ['نظّم المذاكرة', 'بأوقات ومواعيد امتحانات']],
    teacher: [['أنشئ فصولك', 'وادعُ أولياء الأمور برابط'], ['تقارير مادتك', 'لكل طالب بإذن ولي الأمر'], ['أكثر الأسئلة خطأً', 'في الفصل خلال الشهر'], ['ترتيب المدرسة', 'لكل صف ومرحلة']]
  };
  const ROLE_NAMES = [['student', 'الطالب'], ['parent', 'ولي الأمر'], ['teacher', 'المعلم']];

  window.WELCOME_HTML = function () {
    return `<div class="lp" dir="rtl">
  <header class="lp-head">
    <a href="#welcome" class="lp-brand">${LOGO}<span><b>قِمّة</b><small>تعلَّم. أتقِن. تصدَّر.</small></span></a>
    <nav class="lp-nav" aria-label="القائمة الرئيسية">
      <a href="#subjects">${ICON.layers}المواد الدراسية</a>
      <a href="#daily" class="gold">${ICON.trophy}التحديات</a>
      <a href="#arena" class="gold">${ICON.crown}لوحة الشرف</a>
    </nav>
    <a href="#login" class="lp-login">${ICON.login}تسجيل الدخول</a>
  </header>

  <section class="lp-hero">
    <div class="lp-copy">
      <span class="lp-badge"><svg aria-hidden="true" width="22" height="14" viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#fff"/><rect width="30" height="6.7" fill="#007a3d"/><rect y="13.3" width="30" height="6.7" fill="#ce1126"/><path d="M0 0l9 6.7v6.6L0 20z" fill="#10233f"/></svg>المنهج الكويتي <span class="dot">•</span> مجاني</span>
      <h1>رحلتك إلى <span class="hl">القمّة</span><br>تبدأ هنا</h1>
      <p class="lp-lead">راجع دروسك، أتقن أخطاءك، ونافس زملاءك</p>
      <p class="lp-count"><span></span>أكثر من ٢٬٠٠٠ سؤال للصف السادس والثامن والعاشر<span></span></p>
      <div class="lp-ctas">
        <a href="#login" class="lp-btn primary">${ICON.trophy}ابدأ رحلتك مجاناً</a>
        <button type="button" class="lp-btn ghost" data-try>${ICON.play}جرّب ٥ أسئلة</button>
      </div>
      <ul class="lp-perks"><li class="gold">${ICON.bolt}نتيجة فورية</li><li>${ICON.layers}مراجعة ذكية لأخطائك</li><li class="orange">${ICON.medal}منافسة ممتعة</li></ul>
    </div>
    <div class="lp-art">
      <svg class="lp-scene" aria-hidden="true" viewBox="0 0 620 440" preserveAspectRatio="xMidYMid slice">
        <path d="M0 360L120 210 190 280 300 120 400 250 470 190 620 330V440H0z" fill="#d9efe6"/>
        <path d="M0 400L140 280 230 340 330 230 450 330 540 280 620 360V440H0z" fill="#c3e5d7"/>
        <path d="M300 120l-20 26 14-4 6 10 8-14 10 6z" fill="#fff" opacity=".9"/>
        <path d="M300 120V70" stroke="#10233f" stroke-width="2.5"/><path class="lp-flag" d="M300 70h30l-8 10 8 10h-30z" fill="#f2b705"/>
        <path class="lp-trail" d="M150 300C210 250 250 190 300 120" stroke="#f2b705" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" fill="none"/>
        <g fill="#7cc4ae"><rect x="38" y="140" width="6" height="200"/><circle cx="41" cy="210" r="17"/><circle cx="41" cy="160" r="10"/><rect x="74" y="190" width="5" height="150"/><circle cx="76.5" cy="240" r="12"/></g>
        <path d="M0 340h620v100H0z" fill="#e9f6f0"/>
      </svg>
      <div class="lp-quiz" id="lp-quiz" aria-live="polite">
        <button type="button" class="lp-quiz-tag" id="lp-grade-tag">جرّبه الآن</button>
        <div class="lp-quiz-head">${ICON.flask}<b>تحدّي القمّة</b></div>
        <div class="lp-quiz-body" id="lp-quiz-body"></div>
      </div>
      <div class="lp-sticker" aria-hidden="true"><svg width="44" height="44" viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 01-10 0z" fill="#f2b705"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3M8 21h8M12 14v7" stroke="#d99a00" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M12 6l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#fff"/></svg><b>خطوة نحو القمّة!</b></div>
    </div>
  </section>

  <section class="lp-cards">
    <article><svg aria-hidden="true" width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="32" fill="none" stroke="#e3ece8" stroke-width="8"/><circle cx="38" cy="38" r="32" fill="none" stroke="#14a38b" stroke-width="8" stroke-dasharray="150 201" transform="rotate(-90 38 38)" stroke-linecap="round"/><circle cx="38" cy="38" r="15" fill="none" stroke="#e85d4a" stroke-width="4"/><circle cx="38" cy="38" r="5" fill="#e85d4a"/></svg><div><h2>تحدَّ نفسك</h2><p>حسّن نتيجتك وأتقن أخطاءك</p></div></article>
    <article><svg aria-hidden="true" width="76" height="66" viewBox="0 0 76 66"><rect x="27" y="18" width="22" height="46" rx="4" fill="#f2b705"/><rect x="3" y="32" width="22" height="32" rx="4" fill="#0f766e"/><rect x="51" y="40" width="22" height="24" rx="4" fill="#e8742a"/><text x="38" y="46" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">1</text><text x="14" y="54" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">2</text><text x="62" y="58" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">3</text><path d="M38 2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L38 15.3l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#f2b705"/></svg><div><h2>نافس زملاءك</h2><p>في الفصل والمدرسة والمنطقة</p></div></article>
    <article><svg aria-hidden="true" width="70" height="70" viewBox="0 0 70 70"><rect x="6" y="12" width="58" height="52" rx="10" fill="#fff" stroke="#e85d4a" stroke-width="3"/><rect x="6" y="12" width="58" height="16" rx="8" fill="#e85d4a"/><path d="M20 6v12M50 6v12" stroke="#10233f" stroke-width="3" stroke-linecap="round"/><path d="M16 38h14M36 38h18M16 50h14M36 50h18" stroke="#f4a99e" stroke-width="4" stroke-linecap="round"/></svg><div><h2>هدف الأسبوع</h2><p>خطوات صغيرة لإنجاز أكبر</p><div class="lp-days" role="img" aria-label="٣ من ٥ أيام"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></div></div></article>
  </section>

  <section class="lp-roles">
    <h2>خلف كل قمّة… مَن يدعمك</h2>
    <div class="lp-tabs" role="tablist" aria-label="لمن المنصة">${ROLE_NAMES.map(([id, t], i) => `<button type="button" role="tab" aria-selected="${i === 0}" class="${i === 0 ? 'on' : ''}" data-role="${id}">${t}</button>`).join('')}</div>
    <div class="lp-role-items" id="lp-role-items" role="tabpanel"></div>
    <p class="lp-any">${ICON.phone}تعلّم من أي جهاز، ويمكن تثبيته كتطبيق على الموبايل</p>
  </section>
  <footer class="lp-foot">قِمّة · اختبارات المنهج الكويتي · <a href="#parent">ولي الأمر</a> · <a href="#staff">المعلمون والمدارس</a></footer>
</div>`;
  };

  // تشغيل الاختبار التجريبي والتبويبات بعد عرض الصفحة
  // أسئلة عشوائية من صف الزائر: سؤال من كل مادة قدر الإمكان، والخيارات مخلوطة
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const KEY_G = 'nq_try_grade';
  const lget = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lset = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  function randomFive(grade) {
    const subs = (window.SUBJECTS || []).filter(s => s.grade === grade).map(s => ({
      s, qs: s.units.flatMap(u => u.lessons.flatMap(l => l.questions)).filter(q => q.type === 'mcq' && q.options && q.options.length >= 2 && !q.img)
    })).filter(x => x.qs.length);
    if (!subs.length) return [];
    const order = mix(subs), out = [], used = new Set();
    for (let i = 0; out.length < 5 && i < 40; i++) {
      const x = order[i % order.length], q = x.qs[Math.floor(Math.random() * x.qs.length)];
      if (used.has(q.id)) continue; used.add(q.id);
      const idx = q.options.map((_, k) => k), ord = q.tf ? idx : mix(idx);
      out.push({ s: x.s.name, q: q.q, o: ord.map(k => q.options[k]), a: ord.indexOf(q.answer), e: q.explain || ('الإجابة الصحيحة: ' + q.options[q.answer]) });
    }
    return out;
  }

  window.WELCOME_INIT = function (root) {
    const grades = (window.NQ_GRADES && window.NQ_GRADES.length) ? window.NQ_GRADES : ['الصف السادس', 'الصف الثامن', 'الصف العاشر'];
    const remembered = [lget(KEY_G), lget('nq_grade')].find(g => g && grades.includes(g)) || null;
    const st = { grade: null, qs: [], qi: 0, picked: null, score: 0, loading: false };
    const body = root.querySelector('#lp-quiz-body'), tag = root.querySelector('#lp-grade-tag');
    const focusFirst = () => { const f = body.querySelector('button'); if (f) f.focus({ preventScroll: true }); };
    async function start(grade) {
      st.grade = grade; lset(KEY_G, grade); st.loading = true; draw();
      try { if (window.NQLoadGrade) await window.NQLoadGrade(grade); } catch (e) { }
      st.qs = randomFive(grade);
      if (!st.qs.length) st.qs = QS.map(q => Object.assign({}, q));
      st.qi = 0; st.picked = null; st.score = 0; st.loading = false; draw();
    }
    function draw() {
      tag.textContent = st.grade ? st.grade + ' · تغيير' : 'جرّبه الآن';
      tag.setAttribute('aria-label', st.grade ? 'تغيير الصف، الصف الحالي ' + st.grade : 'جرّب الاختبار');
      if (!st.grade) {
        body.innerHTML = `<p class="lp-q">اختر صفك لتبدأ ٥ أسئلة من موادك:</p>
          <div class="lp-grades">${grades.map(g => `<button type="button" class="lp-grade" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
          <p class="lp-ex">الأسئلة عشوائية من بنك أسئلة المنصة، وتتغيّر في كل مرة.</p>`;
        body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => start(b.dataset.g).then(focusFirst));
        return;
      }
      if (st.loading) { body.innerHTML = '<div class="lp-result"><p>⏳ جارٍ تجهيز أسئلة ' + esc(st.grade) + '…</p></div>'; return; }
      const total = st.qs.length;
      if (st.qi >= total) {
        const deg = Math.round(st.score / total * 360);
        const title = st.score === total ? 'ممتاز! أنت على القمّة' : st.score >= Math.ceil(total * 0.6) ? 'أحسنت! بداية قوية' : 'بداية جيدة، والقمّة تنتظرك';
        body.innerHTML = `<div class="lp-result"><div class="lp-ring" role="img" aria-label="نتيجتك ${ar(st.score)} من ${ar(total)}" style="background:conic-gradient(#14a38b ${deg}deg,#e6efeb 0)"><span><b>${ar(st.score)}</b><small>من ${ar(total)}</small></span></div>
          <b class="lp-res-title">${title}</b><p>${st.score === total ? 'أجبت عن كل الأسئلة بشكل صحيح.' : 'سجّل مجاناً لتراجع أخطاءك وتتابع تقدّمك.'}</p>
          <div class="lp-res-btns"><a href="#login" class="lp-btn primary sm">ابدأ رحلتك مجاناً</a><button type="button" class="lp-btn ghost sm" data-again>٥ أسئلة جديدة</button></div>
          <button type="button" class="lp-link" data-grade>تغيير الصف</button></div>`;
        body.querySelector('[data-again]').onclick = () => start(st.grade).then(focusFirst);
        body.querySelector('[data-grade]').onclick = () => { st.grade = null; draw(); focusFirst(); };
        return;
      }
      const Q = st.qs[st.qi], ans = st.picked != null, right = ans && st.picked === Q.a;
      const pct = Math.round((st.qi + (ans ? 1 : 0)) / total * 100);
      body.innerHTML = `<div class="lp-prog"><span>السؤال ${ar(st.qi + 1)} من ${ar(total)}</span><span class="bar"><i style="width:${pct}%"></i></span><span>${esc(Q.s)}</span></div>
        <p class="lp-q" dir="auto">${esc(Q.q)}</p>
        <div class="lp-opts">${Q.o.map((o, i) => { const cls = !ans ? '' : i === Q.a ? 'right' : i === st.picked ? 'wrong' : 'dim'; return `<button type="button" class="lp-opt ${cls}" data-o="${i}" ${ans ? 'disabled' : ''}><span class="mk">${ans && i === Q.a ? '✓' : ans && i === st.picked ? '✗' : ''}</span><span dir="auto">${esc(o)}</span></button>`; }).join('')}</div>
        ${ans ? `<div class="lp-fb"><b class="${right ? 'ok' : 'no'}">${right ? 'إجابة صحيحة!' : 'إجابة خاطئة'}</b><button type="button" class="lp-btn primary sm" data-next>${st.qi === total - 1 ? 'اعرض نتيجتي' : 'السؤال التالي ←'}</button></div><p class="lp-ex">${esc(Q.e)}</p>` : ''}`;
      body.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { if (st.picked != null) return; st.picked = +b.dataset.o; if (st.picked === Q.a) st.score++; draw(); const n = body.querySelector('[data-next]'); if (n) n.focus(); });
      const nx = body.querySelector('[data-next]'); if (nx) nx.onclick = () => { st.qi++; st.picked = null; draw(); focusFirst(); };
    }
    tag.onclick = () => { st.grade = null; st.loading = false; draw(); focusFirst(); };
    if (remembered) start(remembered); else draw();
    const tryBtn = root.querySelector('[data-try]');
    if (tryBtn) tryBtn.onclick = () => { const q = root.querySelector('#lp-quiz'); q.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(focusFirst, 400); };
    const items = root.querySelector('#lp-role-items');
    const showRole = id => { items.innerHTML = ROLES[id].map(([t, s], i) => `<div class="lp-role-item"><span>${ar(i + 1)}</span><div><b>${t}</b><small>${s}</small></div></div>`).join(''); };
    root.querySelectorAll('[data-role]').forEach(b => b.onclick = () => {
      root.querySelectorAll('[data-role]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
      showRole(b.dataset.role);
    });
    showRole('student');
  };
})();
