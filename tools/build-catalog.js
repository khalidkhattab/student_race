/* يبني data/catalog.js: عدد الأسئلة والدروس لكل مادة (تعرضه الصفحة الرئيسية دون تحميل بنك الأسئلة).
   شغّله بعد إضافة أو تعديل أسئلة:  node tools/build-catalog.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const loader = fs.readFileSync(path.join(root, 'loader.js'), 'utf8');
const GRADE_FILES = vm.runInNewContext('(' + loader.match(/const GRADE_FILES = (\{[\s\S]*?\n  \});/)[1] + ')');
const out = { total: 0, grades: {} };
for (const [grade, files] of Object.entries(GRADE_FILES)) {
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
  for (const f of ['_helpers.js', ...files]) vm.runInContext(fs.readFileSync(path.join(root, 'data', f), 'utf8'), ctx, { filename: f });
  out.grades[grade] = (ctx.window.SUBJECTS || []).filter(s => s.grade === grade).map(s => {
    const lessons = s.units.flatMap(u => u.lessons);
    const questions = lessons.reduce((n, l) => n + l.questions.length, 0);
    out.total += questions;
    return { id: s.id, name: s.name, icon: s.icon || '📘', color: s.color || '#0f766e', lessons: lessons.length, questions };
  });
}
fs.writeFileSync(path.join(root, 'data', 'catalog.js'),
  '/* ملف مُولَّد تلقائياً: node tools/build-catalog.js — لا تعدّله يدوياً */\nwindow.NQ_CATALOG = ' + JSON.stringify(out) + ';\n', 'utf8');
console.log('total questions:', out.total, Object.entries(out.grades).map(([g, s]) => g + ': ' + s.length + ' مواد').join(' | '));
