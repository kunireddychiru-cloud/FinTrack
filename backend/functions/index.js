const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const KEYWORDS = {
  food: ['swiggy', 'zomato', 'restaurant', 'cafe', 'grocery', 'lunch', 'dinner', 'biryani', 'pizza'],
  transport: ['uber', 'ola', 'rapido', 'bus', 'metro', 'fuel', 'petrol', 'train', 'cab', 'flight'],
  shopping: ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'mall'],
  bills: ['electricity', 'rent', 'recharge', 'broadband', 'bill', 'emi', 'insurance'],
  health: ['pharmacy', 'medicine', 'doctor', 'hospital', 'clinic'],
  entertainment: ['netflix', 'spotify', 'movie', 'cinema', 'game'],
  education: ['tuition', 'course', 'udemy', 'books', 'fees', 'exam'],
  salary: ['salary', 'stipend', 'bonus', 'payroll'],
};

function categorize(title = '') {
  const text = title.toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS)) if (words.some((w) => text.includes(w))) return cat;
  return 'other';
}

// Server-side fallback: fill in a category if a client (e.g. an older app version) omitted it.
exports.autoCategorize = onDocumentCreated('users/{uid}/transactions/{id}', async (event) => {
  const data = event.data?.data();
  if (!data || data.category) return;
  await event.data.ref.update({ category: categorize(data.title) });
});

// Callable: monthly summary. Call from the app with httpsCallable(functions, 'monthlySummary')({year, month})
exports.monthlySummary = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Login required');
  const now = new Date();
  const year = Number(req.data?.year ?? now.getFullYear());
  const month = Number(req.data?.month ?? now.getMonth()); // 0-11
  const start = admin.firestore.Timestamp.fromDate(new Date(year, month, 1));
  const end = admin.firestore.Timestamp.fromDate(new Date(year, month + 1, 1));
  const snap = await db.collection(`users/${req.auth.uid}/transactions`)
    .where('date', '>=', start).where('date', '<', end).get();
  let income = 0, expense = 0; const byCategory = {};
  snap.forEach((d) => {
    const t = d.data();
    if (t.type === 'income') income += t.amount;
    else { expense += t.amount; byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; }
  });
  return { year, month, income, expense, savings: income - expense, byCategory };
});
