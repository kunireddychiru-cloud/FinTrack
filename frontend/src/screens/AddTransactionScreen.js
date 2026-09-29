import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addTransaction, updateTransaction, deleteTransaction } from '../services/transactions';
import { predictCategory, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../services/categorizer';
import { currencySymbols, fmt as formatMoney } from '../services/insights';
import { confirm } from '../notify';
import AmountInput from '../components/AmountInput';

const CAT_ICONS = {
  food: 'restaurant',
  transport: 'bus',
  housing: 'home',
  utilities: 'flash',
  entertainment: 'game-controller',
  shopping: 'cart',
  health: 'medkit',
  education: 'school',
  other: 'apps',
  salary: 'cash',
  freelance: 'laptop',
  investments: 'trending-up',
  gifts: 'gift',
};

export default function AddTransactionScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { model, profile } = useData();
  const { s, colors, typography, spacing } = useTheme();
  const { showToast } = useToast();
  
  const editTxn = route.params?.transaction;
  const isEdit = !!editTxn;

  const [type, setType] = useState(editTxn?.type || 'expense');
  const [title, setTitle] = useState(editTxn?.title || '');
  const [amount, setAmount] = useState(editTxn?.amount ? editTxn.amount.toString() : '');
  const [note, setNote] = useState(editTxn?.note || '');
  const [category, setCategory] = useState(editTxn?.category || 'other');
  const [suggested, setSuggested] = useState(null);
  const [manual, setManual] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  
  const [errors, setErrors] = useState({});

  const currencyCode = profile?.currency || 'INR';
  const sym = currencySymbols[currencyCode] || '₹';

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? t('editTransaction') : t('addTransaction') });
  }, [isEdit, navigation, t]);

  useEffect(() => {
    if (!title.trim()) {
      setSuggested(null);
      return;
    }
    const p = predictCategory(model, title, type);
    setSuggested(p);
    if (!manual) setCategory(p);
  }, [title, type, model]);

  const save = () => {
    const amt = parseFloat(amount);
    let err = {};
    if (!title.trim()) err.title = t('errTitle');
    if (!(amt > 0)) err.amount = t('errAmount');
    
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    setErrors({});
    if (busy) return;
    
    setBusy(true);
    
    const formattedAmount = formatMoney(amt, currencyCode);
    const msg = isEdit 
      ? t('txnUpdated') 
      : t('txnAdded', { amount: formattedAmount, category: t(category) });

    const payload = { title: title.trim(), amount: amt, type, category, note: note.trim(), date: isEdit ? editTxn.date : new Date() };

    // Fire and forget Firestore save
    const savePromise = isEdit 
      ? updateTransaction(user.uid, editTxn.id, payload)
      : addTransaction(user.uid, payload);

    let isSettled = false;
    setTimeout(() => {
      if (!isSettled) {
        showToast('Slow Network', 'Saving is taking longer than usual. Check your connection.', 'error');
      }
    }, 8000);

    savePromise
      .then(() => {
        isSettled = true;
      })
      .catch((error) => {
        isSettled = true;
        console.error("Firestore error:", error.code, error.message);
        showToast('Error', `Could not save transaction: ${error.message}`, 'error');
      });

    // Navigate immediately
    navigation.navigate('Main', { screen: 'Dashboard' });
    showToast(isEdit ? t('txnUpdated') : t('txnSubmitted'), msg, 'success');
    
    // Reset busy soon after so button is ready if they open the screen again
    setTimeout(() => setBusy(false), 1000);
  };

  const handleDelete = async () => {
    const res = await confirm(t('confirmDeleteTitle'), t('confirmDeleteMsg'));
    if (res) {
      deleteTransaction(user.uid, editTxn.id);
      navigation.navigate('Main', { screen: 'Dashboard' });
      showToast(t('txnDeleted'), '', 'success');
    }
  };

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const ErrText = ({ err }) => err ? <Text style={{ color: colors.expense, fontSize: 12, marginTop: -spacing.xs, marginBottom: spacing.m }}>{err}</Text> : null;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <AmountInput 
        label={t('amount')}
        amount={amount}
        setAmount={(val) => { setAmount(val); setErrors(prev => ({...prev, amount: null})); }}
        sym={sym}
        type={type}
        error={errors.amount}
      />

      <View style={[s.row, { backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 24 }]}>
        <TouchableOpacity 
          style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 }, type === 'expense' && { backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }, default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } }) }]}
          onPress={() => { setType('expense'); setManual(false); }}>
          <Text style={{ fontFamily: type === 'expense' ? typography.semiBold : typography.fontFamily, color: type === 'expense' ? colors.expense : colors.muted }}>{t('expenseType')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 }, type === 'income' && { backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }, default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } }) }]}
          onPress={() => { setType('income'); setManual(false); }}>
          <Text style={{ fontFamily: type === 'income' ? typography.semiBold : typography.fontFamily, color: type === 'income' ? colors.income : colors.muted }}>{t('incomeType')}</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={[s.input, errors.title && { borderColor: colors.expense }]} placeholder={t('title')} value={title} onChangeText={(val) => { setTitle(val); setErrors(prev => ({...prev, title: null})); }} placeholderTextColor={colors.muted} />
      <ErrText err={errors.title} />
      
      <TextInput style={s.input} placeholder={t('note')} value={note} onChangeText={setNote} placeholderTextColor={colors.muted} />
      
      <Text style={[s.h3, { marginTop: 8, marginBottom: 16 }]}>{t('category')}</Text>
      <View style={s.wrap}>
        {cats.map((c) => {
          const isSelected = category === c;
          const isSuggested = suggested === c && !manual;
          return (
            <TouchableOpacity key={c} style={[s.chip, isSelected && s.chipOn]}
              onPress={() => { setCategory(c); setManual(true); }}>
              <Ionicons name={CAT_ICONS[c] || 'apps'} size={18} color={isSelected ? '#fff' : colors.text} style={{ marginRight: 6 }} />
              <Text style={{ color: isSelected ? '#fff' : colors.text, fontFamily: typography.medium }}>{t(c)}</Text>
              {isSuggested && (
                <View style={{ backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, marginLeft: 6, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={10} color={colors.primary} style={{ marginRight: 2 }} />
                  <Text style={{ color: colors.primary, fontSize: 10, fontFamily: typography.bold }}>Suggested</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[s.btn, { marginTop: 24 }, busy && { opacity: 0.7 }]} onPress={save} disabled={busy}>
        <Text style={s.btnText}>{busy ? "Please wait..." : (isEdit ? t('saveChanges') : t('save'))}</Text>
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={[s.btn, { marginTop: spacing.m, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.expense }]} onPress={handleDelete}>
          <Text style={[s.btnText, { color: colors.expense }]}>{t('delete')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
