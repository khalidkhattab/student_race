/* ظٹط­ظ…ظ‘ظ„ ظ…ظ„ظپط§طھ ط§ظ„ظ…ظˆط§ط¯ ط­ط³ط¨ ط§ظ„طµظپ ط¨ط¯ظ„ طھط­ظ…ظٹظ„ ظƒظ„ ط§ظ„طµظپظˆظپ ظ…ط±ط© ظˆط§ط­ط¯ط©.
   ظ„ط¥ط¶ط§ظپط© ظ…ط§ط¯ط© ط¬ط¯ظٹط¯ط©: ط£ط¶ظپ ط§ط³ظ… ظ…ظ„ظپظ‡ط§ طھط­طھ طµظپظ‘ظ‡ط§ ظ‡ظ†ط§ (ط¨ط§ظ„طھط±طھظٹط¨ط› ظ…ظ„ظپط§طھ ط§ظ„ظˆط­ط¯ط§طھ ط§ظ„ط¥ط¶ط§ظپظٹط© ط¨ط¹ط¯ ظ…ظ„ظپ ط§ظ„ظ…ط§ط¯ط©). */
(function () {
  const GRADE_FILES = {
    'ط§ظ„طµظپ ط§ظ„ط³ط§ط¯ط³': ['social-6-u1.js', 'social-6-u2.js', 'social-6-u3.js', 'social-6-u4.js', 'arabic-6.js', 'math-6.js', 'science-6.js', 'english-6.js', 'islamic-6.js'],
    'ط§ظ„طµظپ ط§ظ„ط«ط§ظ…ظ†': ['social-studies.js', 'social-8-u1-u2.js', 'social-8-u4-u5.js', 'arabic-8.js', 'math-8.js', 'science-8.js', 'english-8.js', 'islamic-8.js'],
    'ط§ظ„طµظپ ط§ظ„ط¹ط§ط´ط±': ['physics-10.js', 'chemistry-10.js', 'biology-10.js', 'math-10.js', 'arabic-10.js', 'english-10.js', 'islamic-10.js', 'quran-10.js', 'kuwait-10.js', 'explain-10.js', 'extra-10.js']
  };
  const V = '20261110d';
  window.NQ_GRADES = Object.keys(GRADE_FILES);
  const add = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src + '?v=' + V; s.async = false;
    s.onload = res; s.onerror = () => rej(new Error('طھط¹ط°ظ‘ط± طھط­ظ…ظٹظ„ ' + src));
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

  // ط§ظ„طµظپظˆظپ ط§ظ„ظ…ط·ظ„ظˆط¨ط© ط§ظ„ط¢ظ†: طµظپظˆظپ ط§ظ„ط·ظ„ط§ط¨ ط§ظ„ظ…ط­ظپظˆط¸ظٹظ† ط¹ظ„ظ‰ ط§ظ„ط¬ظ‡ط§ط² + ط¢ط®ط± طµظپ ظ…ط®طھط§ط±
  const need = new Set();
  try {
    const st = JSON.parse(localStorage.getItem('nq_students_v2') || 'null');
    if (st && st.profiles) Object.values(st.profiles).forEach(p => p && p.grade && need.add(p.grade));
    const g = localStorage.getItem('nq_grade'); if (g) need.add(g);
  } catch (e) { }
  const fail = e => { const a = document.getElementById('app'); if (a) a.innerHTML = '<p class="empty">âڑ ï¸ڈ ' + (e && e.message || 'طھط¹ط°ظ‘ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ظˆظ‚ط¹') + '. طھط£ظƒط¯ ظ…ظ† ط§ظ„ط§طھطµط§ظ„ ط«ظ… ط£ط¹ط¯ طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©.</p>'; };
  Promise.all([helpers, ...[...need].map(window.NQLoadGrade)])
    .then(() => Promise.all(['welcome.js', 'family.js', 'reports.js', 'game.js', 'parent.js', 'app.js'].map(add)))
    .catch(fail);

  // طھط·ط¨ظٹظ‚ ط¹ظ„ظ‰ ط§ظ„ظ…ظˆط¨ط§ظٹظ„: ط§ظ„ط¹ظ…ظ„ ط¨ط¯ظˆظ† ط¥ظ†طھط±ظ†طھ + ط²ط± ط§ظ„طھط«ط¨ظٹطھ
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
    b.innerHTML = '<button type="button" class="btn small" data-i>ًں“² ط«ط¨ظ‘طھ ط§ظ„طھط·ط¨ظٹظ‚ ط¹ظ„ظ‰ ط¬ظ‡ط§ط²ظƒ</button><button type="button" class="nq-install-x" aria-label="ط¥ط®ظپط§ط،" data-h>أ—</button>';
    document.body.appendChild(b);
    b.querySelector('[data-i]').onclick = async () => { b.remove(); deferred.prompt(); try { await deferred.userChoice; } catch (x) { } deferred = null; };
    b.querySelector('[data-h]').onclick = () => { b.remove(); try { localStorage.setItem('nq_install_hide', '1'); } catch (x) { } };
  });
  addEventListener('appinstalled', () => { const b = document.getElementById('nq-install'); if (b) b.remove(); });
})();
