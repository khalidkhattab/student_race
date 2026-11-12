/* يحمّل ملفات المواد حسب الصف بدل تحميل كل الصفوف مرة واحدة.
   لإضافة مادة جديدة: أضف اسم ملفها تحت صفّها هنا (بالترتيب؛ ملفات الوحدات الإضافية بعد ملف المادة). */
(function () {
  const GRADE_FILES = {
    'الصف السادس': ['social-6-u1.js', 'social-6-u2.js', 'social-6-u3.js', 'social-6-u4.js', 'arabic-6.js', 'math-6.js', 'science-6.js', 'english-6.js', 'islamic-6.js'],
    'الصف الثامن': ['social-studies.js', 'social-8-u1-u2.js', 'social-8-u4-u5.js', 'arabic-8.js', 'math-8.js', 'science-8.js', 'english-8.js', 'islamic-8.js'],
    'الصف العاشر': ['physics-10.js', 'chemistry-10.js', 'biology-10.js', 'math-10.js', 'arabic-10.js', 'english-10.js', 'islamic-10.js', 'quran-10.js', 'kuwait-10.js', 'explain-10.js', 'extra-10.js']
  };
  const V = '20261113a';
  window.NQ_GRADES = Object.keys(GRADE_FILES);
  const add = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src + '?v=' + V; s.async = false;
    s.onload = res; s.onerror = () => rej(new Error('تعذّر تحميل ' + src));
    document.body.appendChild(s);
  });
  const pending = {}, ready = {};
  const helpers = add('data/_helpers.js');
  window.NQLoadGrade = g => {
    if (!GRADE_FILES[g]) return Promise.resolve();
    if (!pending[g]) pending[g] = helpers.then(() => Promise.all(GRADE_FILES[g].map(f => add('data/' + f)))).then(() => { ready[g] = true; });
    return pending[g];
  };
  window.NQGradeReady = g => !GRADE_FILES[g] || !!ready[g];

  // الصفوف المطلوبة الآن: صفوف الطلاب المحفوظين على الجهاز + آخر صف مختار
  const need = new Set();
  try {
    const st = JSON.parse(localStorage.getItem('nq_students_v2') || 'null');
    if (st && st.profiles) Object.values(st.profiles).forEach(p => p && p.grade && need.add(p.grade));
    const g = localStorage.getItem('nq_grade'); if (g) need.add(g);
  } catch (e) { }
  const fail = e => { const a = document.getElementById('app'); if (a) a.innerHTML = '<p class="empty">⚠️ ' + (e && e.message || 'تعذّر تحميل الموقع') + '. تأكد من الاتصال ثم أعد تحميل الصفحة.</p>'; };
  Promise.all([helpers, ...[...need].map(window.NQLoadGrade)])
    .then(() => Promise.all(['welcome.js', 'family.js', 'reports.js', 'schools.js', 'game.js', 'parent.js', 'app.js'].map(add)))
    .catch(fail);

  // تطبيق على الموبايل: العمل بدون إنترنت + زر التثبيت
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || (isLocal && /[?&]sw=1\b/.test(location.search)))) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }
  let deferred = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    try { if (localStorage.getItem('nq_install_hide')) return; } catch (x) { }
    if (document.getElementById('nq-install')) return;
    const b = document.createElement('div'); b.id = 'nq-install'; b.className = 'nq-install';
    b.innerHTML = '<button type="button" class="btn small" data-i>📲 ثبّت التطبيق على جهازك</button><button type="button" class="nq-install-x" aria-label="إخفاء" data-h>×</button>';
    document.body.appendChild(b);
    b.querySelector('[data-i]').onclick = async () => { b.remove(); deferred.prompt(); try { await deferred.userChoice; } catch (x) { } deferred = null; };
    b.querySelector('[data-h]').onclick = () => { b.remove(); try { localStorage.setItem('nq_install_hide', '1'); } catch (x) { } };
  });
  addEventListener('appinstalled', () => { const b = document.getElementById('nq-install'); if (b) b.remove(); });
})();
