/*
  أدوات مختصرة لكتابة الأسئلة (تُحمّل قبل ملفات المواد).
    Q(kind, نص السؤال, الإجابة الصحيحة, خطأ1, خطأ2, ...)          → سؤال اختيار من متعدد
    M(kind, نص السؤال, [الصحيحة...], [الخاطئة...])                 → اختر كل الإجابات الصحيحة
    C(kind, نص السؤال, [التصنيفات...], [[العنصر, رقم التصنيف], ...]) → صنّف
    L(id, اسم الدرس, اسم قصير, [أسئلة...])                          → درس (تُرقّم الأسئلة تلقائياً)
  الخيارات تُخلط عند العرض، لذلك تُكتب الإجابة الصحيحة أولاً.
*/
window.QB = {
  Q: (kind, q, right, ...wrong) => ({ kind, type: 'mcq', q, options: [right, ...wrong], answer: 0 }),
  M: (kind, q, rights, wrongs) => ({ kind, type: 'multi', q, options: [...rights, ...wrongs], answers: rights.map((_, i) => i) }),
  C: (kind, q, categories, items) => ({ kind, type: 'match', q, categories, items }),
  L: (prefix) => (id, name, short, questions) => ({
    id, name, short,
    questions: questions.map((x, i) => Object.assign({ id: `${prefix}${id}q${i + 1}` }, x))
  })
};
