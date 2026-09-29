import { computeInsights, monthStats, fmt } from './insights';
import i18n from '../i18n';

// Simple intent detection using lowercase normalized text
const INTENTS = [
  {
    id: 'saving',
    keywords: ['save', 'saving', 'reduce', 'बचा', 'कम', 'పొదుపు', 'తగ్గించ']
  },
  {
    id: 'biggest',
    keywords: ['biggest', 'most', 'top', 'highest', 'सबसे बड़ा', 'ज्यादा', 'అతిపెద్ద', 'ఎక్కువ']
  },
  {
    id: 'budget',
    keywords: ['budget', 'over', 'limit', 'बजट', 'सीमा', 'బడ్జెట్', 'పరిమితి']
  },
  {
    id: 'balance',
    keywords: ['balance', 'income vs', 'how am i doing', 'शेष', 'आय', 'बैलेंस', 'బ్యాలెన్స్', 'ఆదాయం', 'ఎలా']
  },
  {
    id: 'compare',
    keywords: ['compare', 'last month', 'trend', 'तुलना', 'पिछले', 'పోల్చ', 'గత నెల']
  },
  {
    id: 'forecast',
    keywords: ['forecast', 'projected', 'end', 'अनुमानित', 'अंत', 'అంచనా', 'చివరికి']
  },
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'नमस्ते', 'హలో', 'నమస్కారం']
  }
];

export function answerQuestion(question, { transactions, budgets, profile }) {
  const q = question.toLowerCase().replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/g, ' ');
  const t = i18n.t.bind(i18n);
  const cur = profile?.currency || 'INR';
  
  if (transactions.length === 0) {
    return { text: t('ansNoData') };
  }

  // Detect intent
  let matchedIntent = 'fallback';
  for (const intent of INTENTS) {
    if (intent.keywords.some(k => q.includes(k))) {
      matchedIntent = intent.id;
      break;
    }
  }

  const { cur: curStats, prev: prevStats, top, forecast, savingsRate, change, tips } = computeInsights(transactions, budgets);
  const income = curStats.income;
  const expense = curStats.expense;

  switch (matchedIntent) {
    case 'saving':
      if (top && expense > 0) {
        return { text: t('ansSaving', { cat: t(top[0]), amount: fmt(top[1], cur) }) };
      }
      return { text: t('ansGood') || t('tipGood') };
      
    case 'biggest':
      let highest = null;
      transactions.filter(tx => tx.type === 'expense' && tx.date.getMonth() === new Date().getMonth()).forEach(tx => {
        if (!highest || tx.amount > highest.amount) highest = tx;
      });
      if (highest) {
        return { text: t('ansBiggest', { title: highest.title, amount: fmt(highest.amount, cur), date: highest.date.toLocaleDateString() }) };
      }
      return { text: t('ansNoData') };

    case 'budget':
      const overNear = [];
      Object.keys(budgets).forEach(cat => {
        const limit = budgets[cat].limit;
        if (limit > 0) {
          const spent = curStats.byCat[cat] || 0;
          if (spent >= limit * 0.8) overNear.push(t(cat));
        }
      });
      if (overNear.length === 0) {
        return { text: t('ansBudgetOk') };
      }
      return { text: t('ansBudgetBad', { list: overNear.join(', ') }) };

    case 'balance':
      if (savingsRate === null) return { text: t('ansNoData') };
      if (savingsRate >= 20) {
        return { text: t('ansBalanceHealthy', { income: fmt(income, cur), expense: fmt(expense, cur), rate: savingsRate.toFixed(1) }) };
      }
      return { text: t('ansBalanceAttention', { income: fmt(income, cur), expense: fmt(expense, cur), rate: savingsRate.toFixed(1) }) };

    case 'compare':
      if (change === null) return { text: t('ansCompareNoData') };
      if (change > 5) return { text: t('ansCompareUp', { pct: Math.abs(change).toFixed(0) }) };
      if (change < -5) return { text: t('ansCompareDown', { pct: Math.abs(change).toFixed(0) }) };
      return { text: t('ansCompareSame') };

    case 'forecast':
      return { text: t('ansForecast', { amount: fmt(forecast, cur) }) };

    case 'greeting':
      return { text: t('ansGreeting') };

    default:
      return { text: t('ansFallback') };
  }
}
