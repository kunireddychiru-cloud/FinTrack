import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const sCol = (uid) => collection(db, 'users', uid, 'savings');

export const subscribeSavings = (uid, cb) => {
  console.log('subscribeSavings', uid);
  return onSnapshot(query(sCol(uid), orderBy('date', 'desc')), (snap) => {
    console.log(`subscribeSavings: got ${snap.docs.length} docs`);
    cb(snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, ...x, date: x.date?.toDate ? x.date.toDate() : new Date() };
    }));
  }, (error) => console.error('subscribeSavings error:', error));
};

export const addSavingsEntry = (uid, entry) => {
  console.log('addSavingsEntry called', uid, entry);
  return addDoc(sCol(uid), { ...entry, date: Timestamp.fromDate(entry.date || new Date()), createdAt: serverTimestamp() })
    .then(res => { console.log('addSavingsEntry success', res.id); return res; })
    .catch(err => { console.error('addSavingsEntry error', err); throw err; });
};

export const deleteSavingsEntry = (uid, id) => {
  return deleteDoc(doc(db, 'users', uid, 'savings', id));
};

export const computeSavingsBalance = (entries) => {
  return entries.reduce((acc, curr) => acc + (curr.type === 'deposit' ? curr.amount : -curr.amount), 0);
};

export const updateSavingsEntry = async (uid, id, entry) => {
  console.log('updateSavingsEntry called', uid, id, entry);
  if (!(entry.amount > 0)) throw new Error('Amount must be greater than 0');
  try {
    await updateDoc(doc(db, 'users', uid, 'savings', id), { ...entry, date: Timestamp.fromDate(entry.date || new Date()) });
  } catch (err) {
    console.error('updateSavingsEntry error', err);
    throw err;
  }
};
