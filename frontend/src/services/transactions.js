import {
  collection, doc, addDoc, deleteDoc, setDoc, updateDoc, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const tCol = (uid) => collection(db, 'users', uid, 'transactions');

export const subscribeTransactions = (uid, cb) => {
  console.log('subscribeTransactions', uid);
  return onSnapshot(query(tCol(uid), orderBy('date', 'desc')), (snap) => {
    console.log(`subscribeTransactions: got ${snap.docs.length} docs`);
    cb(snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, ...x, date: x.date?.toDate ? x.date.toDate() : new Date() };
    }));
  }, (error) => console.error('subscribeTransactions error:', error));
};

export const addTransaction = (uid, t) => {
  console.log('addTransaction called', uid, t);
  return addDoc(tCol(uid), { ...t, date: Timestamp.fromDate(t.date || new Date()), createdAt: serverTimestamp() })
    .then(res => { console.log('addTransaction success', res.id); return res; })
    .catch(err => { console.error('addTransaction error', err); throw err; });
};

export const updateTransaction = (uid, id, t) => {
  console.log('updateTransaction called', uid, id, t);
  return updateDoc(doc(db, 'users', uid, 'transactions', id), { ...t, date: Timestamp.fromDate(t.date || new Date()) })
    .then(() => console.log('updateTransaction success', id))
    .catch(err => { console.error('updateTransaction error', err); throw err; });
};

export const deleteTransaction = (uid, id) => deleteDoc(doc(db, 'users', uid, 'transactions', id));

export const subscribeBudgets = (uid, cb) =>
  onSnapshot(collection(db, 'users', uid, 'budgets'), (snap) => {
    const o = {}; snap.docs.forEach((d) => { o[d.id] = d.data(); }); cb(o);
  });

export const setBudget = (uid, category, limit) =>
  setDoc(doc(db, 'users', uid, 'budgets', category), { limit: Number(limit) });

export const subscribeProfile = (uid, cb) =>
  onSnapshot(doc(db, 'users', uid), (d) => cb(d.exists() ? d.data() : {}));

export const saveProfile = (uid, data) => setDoc(doc(db, 'users', uid), data, { merge: true });
