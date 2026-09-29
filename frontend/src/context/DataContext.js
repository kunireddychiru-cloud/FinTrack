import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeTransactions, subscribeBudgets, subscribeProfile } from '../services/transactions';
import { subscribeSavings, computeSavingsBalance } from '../services/savings';
import { buildModel } from '../services/categorizer';
import { setLanguage } from '../i18n';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [profile, setProfile] = useState({ currency: 'INR' });
  const [savings, setSavings] = useState([]);

  useEffect(() => {
    if (!user) { setTransactions([]); setBudgets({}); setSavings([]); return; }
    const u1 = subscribeTransactions(user.uid, (txns) => {
      console.log(`DataContext: subscribeTransactions for uid ${user.uid} returned ${txns.length} docs. IDs:`, txns.map(t => t.id));
      setTransactions(txns);
    });
    const u2 = subscribeBudgets(user.uid, setBudgets);
    const u3 = subscribeProfile(user.uid, (p) => {
      setProfile({ currency: 'INR', ...p });
      if (p.language) setLanguage(p.language);
    });
    const u4 = subscribeSavings(user.uid, setSavings);
    return () => { u1(); u2(); u3(); u4(); };
  }, [user]);

  const model = useMemo(() => buildModel(transactions), [transactions]);
  const savingsBalance = useMemo(() => computeSavingsBalance(savings), [savings]);
  return <Ctx.Provider value={{ transactions, budgets, profile, model, savings, savingsBalance }}>{children}</Ctx.Provider>;
}
