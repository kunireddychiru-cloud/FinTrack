// Lightweight on-device ML: multinomial Naive Bayes text classifier.
// Trained on seed keywords + the user's own transaction history (learns personal habits).
export const EXPENSE_CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'health', 'entertainment', 'education', 'other'];
export const INCOME_CATEGORIES = ['salary', 'other'];
export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export const CATEGORY_ICONS = {
  food: 'restaurant', transport: 'car', shopping: 'cart', bills: 'receipt',
  health: 'medkit', entertainment: 'film', education: 'school', salary: 'cash', other: 'ellipsis-horizontal',
};

const SEED = {
  food: 'swiggy zomato restaurant cafe coffee tea lunch dinner breakfast biryani pizza burger grocery groceries vegetables milk bigbasket blinkit zepto dominos mcdonalds kfc food snacks bakery',
  transport: 'uber ola rapido bus metro train fuel petrol diesel taxi auto cab flight irctc redbus parking toll bike ticket travel',
  shopping: 'amazon flipkart myntra clothes shirt shoes mall shopping meesho ajio electronics mobile laptop gift watch',
  bills: 'electricity water gas rent recharge broadband wifi jio airtel bill insurance emi loan tax dth postpaid',
  health: 'pharmacy medicine doctor hospital clinic apollo medplus lab test dental gym fitness checkup',
  entertainment: 'netflix hotstar prime spotify movie cinema pvr game gaming youtube concert party subscription',
  education: 'tuition course udemy coursera books college fees exam school coaching stationery certification',
  salary: 'salary stipend bonus payroll wages income interest dividend freelance refund cashback',
  other: 'misc other',
};

const tok = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F\u0C00-\u0C7F\s]/g, ' ').split(/\s+/).filter(Boolean);

export function buildModel(history = []) {
  const counts = {}, totals = {}, vocab = new Set(), docs = {};
  ALL_CATEGORIES.forEach((c) => { counts[c] = {}; totals[c] = 0; docs[c] = 1; });
  const add = (cat, words, w) => words.forEach((x) => {
    if (!counts[cat]) return;
    counts[cat][x] = (counts[cat][x] || 0) + w; totals[cat] += w; vocab.add(x);
  });
  Object.entries(SEED).forEach(([c, txt]) => add(c, tok(txt), 2));
  history.forEach((t) => { if (t.category && t.title) { add(t.category, tok(t.title), 4); docs[t.category] += 1; } });
  return { counts, totals, vocab, docs, n: Object.values(docs).reduce((a, b) => a + b, 0) };
}

export function predictCategory(model, title, type = 'expense') {
  const words = tok(title).filter((w) => model.vocab.has(w));
  const pool = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!words.length) return type === 'income' ? 'salary' : 'other';
  let best = 'other', bestScore = -Infinity;
  for (const c of pool) {
    let score = Math.log(model.docs[c] / model.n);
    for (const w of words) score += Math.log(((model.counts[c][w] || 0) + 1) / (model.totals[c] + model.vocab.size));
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best;
}
