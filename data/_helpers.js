/*
  أدوات مختصرة لكتابة الأسئلة (تُحمّل قبل ملفات المواد).
    Q(kind, نص السؤال, الإجابة الصحيحة, خطأ1, خطأ2, ...)          → سؤال اختيار من متعدد
    M(kind, نص السؤال, [الصحيحة...], [الخاطئة...])                 → اختر كل الإجابات الصحيحة
    C(kind, نص السؤال, [التصنيفات...], [[العنصر, رقم التصنيف], ...]) → صنّف
    L(id, اسم الدرس, اسم قصير, [أسئلة...])                          → درس (تُرقّم الأسئلة تلقائياً)
    T(kind, العبارة, true/false)                                      → صح أو خطأ
    F(kind, نص فيه …… مكان الفراغ, [الإجابات المقبولة...])            → أكمل الفراغ (تُقارن بعد توحيد الهمزات والأرقام والمسافات)
    IMG(سؤال, 'data/img/ملف.svg', 'وصف الصورة')                       → يضيف صورة لأي سؤال
  الخيارات تُخلط عند العرض، لذلك تُكتب الإجابة الصحيحة أولاً.
*/
window.QB = {
  Q: (kind, q, right, ...wrong) => ({ kind, type: 'mcq', q, options: [right, ...wrong], answer: 0 }),
  M: (kind, q, rights, wrongs) => ({ kind, type: 'multi', q, options: [...rights, ...wrongs], answers: rights.map((_, i) => i) }),
  C: (kind, q, categories, items) => ({ kind, type: 'match', q, categories, items }),
  T: (kind, q, isTrue) => ({ kind, type: 'mcq', tf: true, q, options: ['صح', 'خطأ'], answer: isTrue ? 0 : 1 }),
  F: (kind, q, answers) => ({ kind, type: 'fill', q, answers: [].concat(answers) }),
  IMG: (question, img, alt) => Object.assign(question, { img, alt: alt || '' }),
  L: (prefix) => (id, name, short, questions) => ({
    id, name, short,
    questions: questions.map((x, i) => Object.assign({ id: `${prefix}${id}q${i + 1}` }, x))
  })
};

window.SUBJECTS = window.SUBJECTS || [];
