/* يجعل الموقع يعمل بدون إنترنت ويفتح بسرعة. غيّر VERSION عند كل نشر ليحصل الجميع على النسخة الجديدة. */
const VERSION = 'nq-20261111b';
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
  // قاعدة البيانات دائماً من الشبكة
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  // صفحة الموقع: الشبكة أولاً ثم النسخة المحفوظة
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;
  // باقي الملفات: من المحفوظ فوراً، مع تحديثه في الخلفية
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
