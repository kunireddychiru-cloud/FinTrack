import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addSavingsEntry, deleteSavingsEntry, updateSavingsEntry } from '../services/savings';
import { currencySymbols, fmt as formatMoney } from '../services/insights';
import { confirm } from '../notify';
import AmountInput from '../components/AmountInput';

export default function SavingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { savings, savingsBalance, profile } = useData();
  const { s, colors, typography, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingOriginalAmount, setEditingOriginalAmount] = useState(0);
  const [editingDate, setEditingDate] = useState(null);

  const cur = profile.currency || 'INR';
  const sym = currencySymbols[cur] || '₹';

  const handleOpen = (tType, entry = null) => {
    setType(tType);
    if (entry) {
      setEditingId(entry.id);
      setEditingOriginalAmount(entry.amount);
      setEditingDate(entry.date);
      setAmount(entry.amount.toString());
      setNote(entry.note || '');
    } else {
      setEditingId(null);
      setEditingOriginalAmount(0);
      setEditingDate(null);
      setAmount('');
      setNote('');
    }
    setError(null);
    setModalVisible(true);
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!(amt > 0)) {
      setError(t('errAmount') || 'Amount must be greater than 0');
      return;
    }
    if (type === 'withdrawal') {
      const available = editingId ? (savingsBalance + editingOriginalAmount) : savingsBalance;
      if (amt > available) {
        setError(t('errSavingsBalance') || 'Not enough savings balance');
        return;
      }
    }

    setError(null);
    if (busy) return;
    setBusy(true);

    const promise = editingId 
      ? updateSavingsEntry(user.uid, editingId, { type, amount: amt, note: note.trim(), date: editingDate || new Date() })
      : addSavingsEntry(user.uid, { type, amount: amt, note: note.trim(), date: new Date() });

    let isSettled = false;
    setTimeout(() => {
      if (!isSettled) showToast('Slow Network', 'Saving is taking longer than usual.', 'error');
    }, 8000);

    promise
      .then(() => { isSettled = true; })
      .catch((err) => {
        isSettled = true;
        console.error("Firestore error:", err);
        showToast('Error', err.message, 'error');
      });

    setModalVisible(false);
    showToast(editingId ? (t('savingsUpdated') || 'Updated successfully') : (type === 'deposit' ? t('addedToSavings') : t('withdrawnFromSavings')), '', 'success');
    setTimeout(() => setBusy(false), 500);
  };

  const handleDelete = async (id, fromModal = false) => {
    const res = await confirm(t('confirmDeleteTitle') || 'Delete?', t('confirmDeleteMsg') || "This can't be undone.");
    if (res) {
      if (fromModal) setModalVisible(false);
      deleteSavingsEntry(user.uid, id);
      showToast(t('txnDeleted') || 'Deleted', '', 'success');
    }
  };

  const renderHistory = () => {
    if (savings.length === 0) {
      return (
        <View style={{ alignItems: 'center', padding: spacing.xl, marginTop: spacing.xl }}>
          <Ionicons name="leaf-outline" size={48} color={colors.border} style={{ marginBottom: spacing.m }} />
          <Text style={s.muted}>{t('noSavingsActivity') || 'No savings activity yet. Add your first deposit.'}</Text>
        </View>
      );
    }

    return (
      <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' }}>
        {savings.map((item, index) => {
          const isDeposit = item.type === 'deposit';
          return (
            <TouchableOpacity key={item.id} style={[s.row, { padding: spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]} onPress={() => handleOpen(item.type, item)}>
              <View style={[s.row, { flex: 1 }]}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDeposit ? `${colors.income}15` : `${colors.expense}15`, alignItems: 'center', justifyContent: 'center', marginRight: spacing.m }}>
                  <Ionicons name={isDeposit ? 'arrow-down' : 'arrow-up'} size={20} color={isDeposit ? colors.income : colors.expense} />
                </View>
                <View style={{ flex: 1, paddingRight: spacing.m }}>
                  <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 15, marginBottom: 2 }}>
                    {isDeposit ? t('deposit') || 'Deposit' : t('withdrawal') || 'Withdrawal'}
                  </Text>
                  {item.note ? <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>{item.note}</Text> : null}
                  <Text style={[s.muted, { fontSize: 10, marginTop: 2 }]}>{item.date.toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: typography.semiBold, color: isDeposit ? colors.income : colors.expense, fontVariant: ['tabular-nums'], fontSize: 15 }}>
                {isDeposit ? '+' : '-'}{formatMoney(item.amount, cur)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: spacing.m, paddingBottom: 80 }}>
        {/* Hero Card */}
        <View style={{ backgroundColor: colors.primary, padding: spacing.xl, borderRadius: radius.l, alignItems: 'center', marginBottom: spacing.xl, ...Platform.select({ web: { boxShadow: `0px 8px 16px ${colors.primary}4D` }, default: { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 } }) }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: typography.medium, marginBottom: spacing.xs }}>
            {t('totalSavedSoFar') || 'Total saved so far'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 36, fontFamily: typography.bold, fontVariant: ['tabular-nums'] }}>
            {formatMoney(savingsBalance, cur)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={[s.row, { marginBottom: spacing.xl }]}>
          <TouchableOpacity style={[s.btn, { flex: 1, marginRight: spacing.s, backgroundColor: colors.income }]} onPress={() => handleOpen('deposit')}>
            <Text style={s.btnText}>{t('addToSavings') || 'Add to Savings'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { flex: 1, marginLeft: spacing.s, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.expense }]} onPress={() => handleOpen('withdrawal')}>
            <Text style={[s.btnText, { color: colors.expense }]}>{t('withdraw') || 'Withdraw'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.h3, { marginBottom: spacing.m }]}>{t('history') || 'History'}</Text>
        {renderHistory()}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.m }} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: colors.card, width: '100%', maxWidth: 400, borderRadius: radius.l, padding: spacing.xl, ...Platform.select({ web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.15)' }, default: { elevation: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16 } }) }}>
              <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 }} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[s.h2, { marginBottom: spacing.l, textAlign: 'center' }]}>
                {editingId ? (t('editSavingsEntry') || 'Edit Savings Entry') : (type === 'deposit' ? (t('addToSavings') || 'Add to Savings') : (t('withdraw') || 'Withdraw'))}
              </Text>
              
              <AmountInput 
                label={t('amount')}
                amount={amount}
                setAmount={(val) => { setAmount(val); setError(null); }}
                sym={sym}
                type={type}
                error={error}
              />

              <TextInput 
                style={[s.input, { marginBottom: spacing.l }]} 
                placeholder={t('note')} 
                value={note} 
                onChangeText={setNote} 
                placeholderTextColor={colors.muted} 
              />

              <View style={s.row}>
                {editingId && (
                  <TouchableOpacity style={[s.btn, { backgroundColor: colors.expense, marginRight: spacing.m }]} onPress={() => handleDelete(editingId, true)} disabled={busy}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[s.btn, { flex: 1 }, busy && { opacity: 0.7 }]} onPress={submit} disabled={busy}>
                  <Text style={s.btnText}>{busy ? "Please wait..." : (editingId ? (t('saveChanges') || 'Save changes') : t('save'))}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
