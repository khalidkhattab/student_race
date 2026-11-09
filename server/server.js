/*
  سيرفر منصة اختباراتي – بدون مكتبات خارجية (Node.js 18 أو أحدث)

  التشغيل:
    cd quiz-site/server
    node server.js            ← يعمل على المنفذ 8080
    PORT=3000 node server.js  ← منفذ آخر

  ماذا يفعل:
    - يعرض ملفات الموقع (المجلد quiz-site) ويُفعّل وضع السيرفر تلقائياً في index.html
    - GET  /api/lb          ← بيانات لوحة الشرف لكل الأجهزة (للترتيب، تحدي اليوم، تحدي صديق، الفرق)
    - PUT  /api/lb/:device  ← كل جهاز يحفظ بيانات طلابه العامة فقط (الاسم الأول، الصورة، النقاط...)
    البيانات تُحفظ في الملف data.json بجانب هذا الملف.

  ملاحظة: درجات الطلاب التفصيلية تبقى على أجهزتهم. السيرفر يحفظ فقط ما يلزم للمنافسة.
  للإنتاج: ضعه خلف HTTPS (مثل Nginx أو Caddy)، وخذ نسخة احتياطية من data.json.
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 8080;
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(__dirname, 'data.json');
const MAX_BODY = 200 * 1024;          // حد حجم بيانات الجهاز الواحد
const STALE_MS = 60 * 864e5;          // تُحذف الأجهزة غير النشطة منذ 60 يوماً

let db = { devices: {} };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) { /* ملف جديد */ }
let saveT = null;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => fs.writeFile(DATA, JSON.stringify(db), () => {}), 500); };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

// تنظيف بيانات الطالب: نقبل الحقول المعروفة فقط وبأحجام محدودة
const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : null;
const numv = v => Number.isFinite(+v) ? +v : 0;
function cleanEntry(e) {
  if (!e || typeof e !== 'object' || !str(e.pid, 40)) return null;
  const duels = {};
  Object.entries(e.duels || {}).slice(0, 20).forEach(([c, d]) => {
    if (/^[A-Z0-9]{4,6}$/.test(c) && d) duels[c] = { subject: str(d.subject, 30), score: d.score == null ? null : numv(d.score), total: numv(d.total), secs: numv(d.secs), at: numv(d.at) };
  });
  const subj = {}; Object.entries(e.subj || {}).slice(0, 20).forEach(([k, v]) => { subj[str(k, 30)] = numv(v); });
  return {
    pid: str(e.pid, 40), name: str(e.name, 30) || 'طالب', avatar: Number.isInteger(e.avatar) ? e.avatar : null,
    grade: str(e.grade, 30), hidden: !!e.hidden,
    team: e.team && str(e.team.code, 6) ? { code: str(e.team.code, 6), name: str(e.team.name, 24) } : null,
    xp: numv(e.xp), level: numv(e.level), week: str(e.week, 10), weekXp: numv(e.weekXp),
    weekAvg: e.weekAvg == null ? null : numv(e.weekAvg), weekN: numv(e.weekN), prevAvg: e.prevAvg == null ? null : numv(e.prevAvg), prevN: numv(e.prevN),
    subj, daily: e.daily ? { date: str(e.daily.date, 10), score: numv(e.daily.score), total: numv(e.daily.total), secs: numv(e.daily.secs) } : null,
    duels, updated: Date.now()
  };
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return send(res, 204, '');

  if (url.pathname === '/api/lb' && req.method === 'GET') {
    const now = Date.now();
    Object.keys(db.devices).forEach(k => { if (now - (db.devices[k].updated || 0) > STALE_MS) delete db.devices[k]; });
    return send(res, 200, { devices: Object.values(db.devices) });
  }
  const m = url.pathname.match(/^\/api\/lb\/([A-Za-z0-9_-]{4,64})$/);
  if (m && req.method === 'PUT') {
    let body = '', size = 0;
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { req.destroy(); } else body += c; });
    req.on('end', () => {
      try {
        const j = JSON.parse(body), students = {};
        Object.values(j.students || {}).slice(0, 30).forEach(e => { const c = cleanEntry(e); if (c) students[c.pid] = c; });
        db.devices[m[1]] = { students, updated: Date.now() }; save();
        send(res, 200, { ok: true });
      } catch (e) { send(res, 400, { error: 'bad json' }); }
    });
    return;
  }

  // الملفات الثابتة
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || file.startsWith(__dirname)) return send(res, 403, 'forbidden', 'text/plain');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'not found', 'text/plain');
    const ext = path.extname(file);
    if (ext === '.html') buf = Buffer.from(buf.toString('utf8').replace('<!--NQ_SERVER-->', '<script>window.NQ_SERVER = location.origin;</script>'));
    send(res, 200, buf, TYPES[ext] || 'application/octet-stream');
  });
}).listen(PORT, () => console.log(`منصة اختباراتي تعمل على http://localhost:${PORT}`));
