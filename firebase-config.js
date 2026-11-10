/* إعدادات Firebase لنسخة GitHub Pages: تجعل لوحة الشرف وتحدي صديق وتحدي اليوم والفرق مشتركة بين كل الأجهزة.
   اتركها فارغة ليعمل الموقع على الجهاز فقط. (مفتاح Firebase للويب عام بطبيعته، والحماية في قواعد Firestore) */
window.NQ_FIREBASE = {
  projectId: 'student-race',
  apiKey: 'AIzaSyBwnPdI4Q-4cUXK0QsuAiLecI2OtzdUAG8',
  database: 'default',
  authDomain: 'student-race.firebaseapp.com'
};
// أثناء التجربة على الجهاز (localhost) لا نكتب في قاعدة البيانات الحقيقية إلا مع ?fb=1
if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]fb=1\b/.test(location.search)) window.NQ_FIREBASE = null;
