export const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
export const fmt = (amount, cur = 'INR') => {
  const code = cur || 'INR';
  const symbol = currencySymbols[code] || '₹';
  try {
    if (code === 'INR') {
      return symbol + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return symbol + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch (e) {
    return symbol + Number(amount || 0).toFixed(2);
  }
};
const sameMonth = (d, ref) => d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();

export function filterByPeriod(txns, period) {
  if (!period) return txns;
  return txns.filter(t => {
    const d = t.date;
    if (period.mode === 'month') {
      return d.getMonth() === period.month && d.getFullYear() === period.year;
    } else if (period.mode === 'date') {
      return d.getDate() === period.date.getDate() && 
             d.getMonth() === period.date.getMonth() && 
             d.getFullYear() === period.date.getFullYear();
    }
    return true;
  });
}

export function monthStats(list, ref = null) {
  // If ref is provided, backward compatible behavior for computeInsights
  const l = ref ? list.filter(t => sameMonth(t.date, ref)) : list;
  const income = l.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = l.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const byCat = {};
  l.filter((t) => t.type === 'expense').forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  return { income, expense, byCat };
}

export function computeInsights(txns, budgets = {}) {
  const now = new Date();
  const cur = monthStats(txns, now);
  const prev = monthStats(txns, new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const top = Object.entries(cur.byCat).sort((a, b) => b[1] - a[1])[0];
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecast = day ? (cur.expense / day) * daysInMonth : 0;
  const savingsRate = cur.income > 0 ? ((cur.income - cur.expense) / cur.income) * 100 : null;
  const change = prev.expense > 0 ? ((cur.expense - prev.expense) / prev.expense) * 100 : null;
  const tips = [];
  if (top && cur.expense > 0 && top[1] / cur.expense > 0.4) tips.push({ key: 'tipHighSpend', opts: { cat: top[0] }, catKey: top[0] });
  Object.entries(budgets).forEach(([c, b]) => { if ((cur.byCat[c] || 0) > b.limit) tips.push({ key: 'tipOver', catKey: c }); });
  if (change !== null && change > 10) tips.push({ key: 'tipUp', opts: { pct: change.toFixed(0) } });
  if (savingsRate !== null) tips.push({ key: savingsRate < 20 ? 'tipLowSavings' : 'tipGood' });
  return { cur, prev, top, forecast, savingsRate, change, tips };
}

export function computeDashboardStats(txns, budgets = {}) {
  const count = txns.length;
  const expenses = txns.filter(t => t.type === 'expense');
  const avgExpense = expenses.length ? expenses.reduce((a, t) => a + t.amount, 0) / expenses.length : 0;
  
  let highest = null;
  expenses.forEach(t => {
    if (!highest || t.amount > highest.amount) highest = t;
  });

  let activeBudgets = 0;
  let overNearLimit = 0;
  const { byCat } = monthStats(txns); // aggregate for the list
  Object.keys(budgets).forEach(cat => {
    const limit = budgets[cat].limit;
    if (limit > 0) {
      activeBudgets++;
      const spent = byCat[cat] || 0;
      if (spent >= limit * 0.8) overNearLimit++;
    }
  });

  return { count, avgExpense, highest, activeBudgets, overNearLimit };
}

export function computeWeeklyPattern(txns) {
  const days = [0, 0, 0, 0, 0, 0, 0];
  txns.filter(t => t.type === 'expense').forEach(t => {
    let day = t.date.getDay() - 1;
    if (day === -1) day = 6;
    days[day] += t.amount;
  });
  return days;
}
