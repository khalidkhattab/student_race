/* ظٹط¬ط¹ظ„ ط§ظ„ظ…ظˆظ‚ط¹ ظٹط¹ظ…ظ„ ط¨ط¯ظˆظ† ط¥ظ†طھط±ظ†طھ ظˆظٹظپطھط­ ط¨ط³ط±ط¹ط©. ط؛ظٹظ‘ط± VERSION ط¹ظ†ط¯ ظƒظ„ ظ†ط´ط± ظ„ظٹط­طµظ„ ط§ظ„ط¬ظ…ظٹط¹ ط¹ظ„ظ‰ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط¬ط¯ظٹط¯ط©. */
const VERSION = 'nq-20261110d';
const SHELL = ['./', './index.html', './style.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¯ط§ط¦ظ…ط§ظ‹ ظ…ظ† ط§ظ„ط´ط¨ظƒط©
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  // طµظپط­ط© ط§ظ„ظ…ظˆظ‚ط¹: ط§ظ„ط´ط¨ظƒط© ط£ظˆظ„ط§ظ‹ ط«ظ… ط§ظ„ظ†ط³ط®ط© ط§ظ„ظ…ط­ظپظˆط¸ط©
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;
  // ط¨ط§ظ‚ظٹ ط§ظ„ظ…ظ„ظپط§طھ: ظ…ظ† ط§ظ„ظ…ط­ظپظˆط¸ ظپظˆط±ط§ظ‹طŒ ظ…ط¹ طھط­ط¯ظٹط«ظ‡ ظپظٹ ط§ظ„ط®ظ„ظپظٹط©
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
