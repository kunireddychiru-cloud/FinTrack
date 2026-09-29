import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform, Modal, LayoutAnimation } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { monthStats, fmt, filterByPeriod, computeDashboardStats, computeWeeklyPattern } from '../services/insights';
import { CATEGORY_ICONS } from '../services/categorizer';
import { deleteTransaction } from '../services/transactions';
import { confirm } from '../notify';
import { useWindowDimensions } from 'react-native';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { transactions, profile, budgets, savingsBalance } = useData();
  const { width } = useWindowDimensions();
  const { s, colors, typography, spacing, radius } = useTheme();
  
  const [period, setPeriod] = useState(null); // null is 'thisMonth'
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('dashboardPeriod').then(p => {
      if (p) {
        try { 
          const parsed = JSON.parse(p);
          if (parsed && parsed.date) parsed.date = new Date(parsed.date);
          setPeriod(parsed);
        } catch(e){}
      }
    });
  }, []);

  const animateLayout = () => {
    import('react-native').then(({ AccessibilityInfo, LayoutAnimation }) => {
      AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
        if (!reduced) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
    });
  };

  const applyPeriod = (p) => {
    animateLayout();
    setPeriod(p);
    setShowFilter(false);
    AsyncStorage.setItem('dashboardPeriod', JSON.stringify(p));
  };

  const filteredTxns = filterByPeriod(transactions, period);
  const cur = profile.currency || 'INR';
  const { income, expense, byCat } = monthStats(filteredTxns);
  const total = filteredTxns.reduce((a, x) => a + (x.type === 'income' ? x.amount : -x.amount), 0);
  const maxCat = Math.max(1, ...Object.values(byCat));
  
  const stats = computeDashboardStats(filteredTxns, budgets);
  const weekly = computeWeeklyPattern(filteredTxns);
  const maxWeekly = Math.max(1, ...weekly);
  const isWide = width >= 768;

  const confirmDelete = async (id) => {
    const res = await confirm(t('confirmDeleteTitle'), t('confirmDeleteMsg'));
    if (res) {
      deleteTransaction(user.uid, id);
      showToast(t('txnDeleted'), '', 'success');
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
  };

  const groupTransactions = () => {
    const groups = [];
    let lastDateStr = null;
    filteredTxns.slice(0, 30).forEach(x => {
      let dStr = x.date.toLocaleDateString();
      if (isToday(x.date)) dStr = 'Today';
      else if (isYesterday(x.date)) dStr = 'Yesterday';

      if (dStr !== lastDateStr) {
        groups.push({ type: 'header', title: dStr, id: `header-${x.id}` });
        lastDateStr = dStr;
      }
      groups.push({ type: 'item', data: x });
    });
    return groups;
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header Section */}
        <View style={{ backgroundColor: colors.card, padding: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
          <View style={[s.row, { marginBottom: spacing.l }]}>
            <View>
              <Text style={[s.h3, { marginBottom: 4 }]}>Hi, {(profile?.displayName || user?.displayName || 'User').split(' ')[0]}</Text>
              <TouchableOpacity onPress={() => setShowFilter(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
                <Text style={[s.muted, { fontFamily: typography.medium, marginRight: 6 }]}>
                  {period === null ? (t('thisMonth') || 'This Month') : 
                   period.mode === 'month' ? new Date(period.year, period.month).toLocaleString('default', { month: 'long', year: 'numeric' }) : 
                   period.date.toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowFilter(true)}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 40, fontFamily: typography.bold, color: colors.text, fontVariant: ['tabular-nums'], marginBottom: spacing.l }}>
            {fmt(total, cur)}
          </Text>
          <View style={s.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: `${colors.income}20`, padding: 6, borderRadius: 999, marginRight: spacing.s }}>
                <Ionicons name="arrow-down" size={16} color={colors.income} />
              </View>
              <View>
                <Text style={[s.muted, { fontSize: 12 }]}>{t('income')}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontVariant: ['tabular-nums'] }}>{fmt(income, cur)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: `${colors.expense}20`, padding: 6, borderRadius: 999, marginRight: spacing.s }}>
                <Ionicons name="arrow-up" size={16} color={colors.expense} />
              </View>
              <View>
                <Text style={[s.muted, { fontSize: 12 }]}>{t('expense')}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontVariant: ['tabular-nums'] }}>{fmt(expense, cur)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        {Object.keys(byCat).length > 0 && (
          <View style={{ padding: spacing.xl }}>
            <Text style={[s.h3, { marginBottom: spacing.l }]}>Top Spending</Text>
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, v]) => (
              <View key={c} style={{ marginBottom: spacing.m }}>
                <View style={[s.row, { marginBottom: spacing.xs }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={CATEGORY_ICONS[c] || 'ellipse'} size={14} color={colors.muted} style={{ marginRight: spacing.s }} />
                    <Text style={{ fontFamily: typography.medium, color: colors.text, fontSize: 14 }}>{t(c)}</Text>
                  </View>
                  <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontVariant: ['tabular-nums'], fontSize: 14 }}>{fmt(v, cur)}</Text>
                </View>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                  <View style={{ height: 4, width: `${(v / maxCat) * 100}%`, backgroundColor: colors.expense, borderRadius: 2 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Statistics Section */}
        <View style={{ padding: spacing.xl, paddingTop: 0 }}>
          <Text style={[s.h3, { marginBottom: spacing.l }]}>{t('statistics') || 'Statistics'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -(spacing.xs) }}>
            
            {/* Total Txns */}
            <View style={{ width: isWide ? '20%' : '50%', padding: spacing.xs }}>
              <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} style={{ marginBottom: spacing.s }} />
                <Text style={[s.muted, { fontSize: 12, marginBottom: 4 }]}>{t('totalTxns') || 'Total transactions'}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 16 }}>{stats.count}</Text>
              </View>
            </View>

            {/* Avg Expense */}
            <View style={{ width: isWide ? '20%' : '50%', padding: spacing.xs }}>
              <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Ionicons name="calculator-outline" size={20} color={colors.expense} style={{ marginBottom: spacing.s }} />
                <Text style={[s.muted, { fontSize: 12, marginBottom: 4 }]}>{t('avgExpense') || 'Average expense'}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 16 }}>{fmt(stats.avgExpense, cur)}</Text>
              </View>
            </View>

            {/* Highest Expense */}
            <View style={{ width: isWide ? '20%' : '50%', padding: spacing.xs }}>
              <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Ionicons name="arrow-up-circle-outline" size={20} color={colors.expense} style={{ marginBottom: spacing.s }} />
                <Text style={[s.muted, { fontSize: 12, marginBottom: 4 }]}>{t('highestExpense') || 'Highest expense'}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 16 }}>{stats.highest ? fmt(stats.highest.amount, cur) : '-'}</Text>
                <Text style={[s.muted, { fontSize: 10 }]} numberOfLines={1}>{stats.highest ? stats.highest.title : ''}</Text>
              </View>
            </View>

            {/* Active Budgets */}
            <View style={{ width: isWide ? '20%' : '50%', padding: spacing.xs }}>
              <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Ionicons name="pie-chart-outline" size={20} color={colors.primary} style={{ marginBottom: spacing.s }} />
                <Text style={[s.muted, { fontSize: 12, marginBottom: 4 }]}>{t('activeBudgets') || 'Active budgets'}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 16 }}>{stats.activeBudgets}</Text>
                <Text style={[s.muted, { fontSize: 10 }]} numberOfLines={1}>{stats.overNearLimit} {t('overNearLimit') || 'over/near limit'}</Text>
              </View>
            </View>

            {/* Savings Balance */}
            <View style={{ width: isWide ? '20%' : '50%', padding: spacing.xs }}>
              <TouchableOpacity style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }} onPress={() => navigation.navigate('Savings')}>
                <Ionicons name="leaf-outline" size={20} color={colors.income} style={{ marginBottom: spacing.s }} />
                <Text style={[s.muted, { fontSize: 12, marginBottom: 4 }]}>{t('savingsBalance') || 'Savings balance'}</Text>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 16 }}>{fmt(savingsBalance, cur)}</Text>
                <Text style={[s.muted, { fontSize: 10 }]} numberOfLines={1}>{t('savings') || 'Savings'}</Text>
              </TouchableOpacity>
            </View>

          </View>
          
          {/* Income vs Expense Bar */}
          <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginTop: spacing.s }}>
            <Text style={[s.muted, { fontSize: 12, marginBottom: spacing.m }]}>Income vs Expense</Text>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: spacing.m }}>
              <View style={{ height: 8, width: `${(income / (income + expense || 1)) * 100}%`, backgroundColor: colors.income, borderRadius: 4 }} />
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
              <View style={{ height: 8, width: `${(expense / (income + expense || 1)) * 100}%`, backgroundColor: colors.expense, borderRadius: 4 }} />
            </View>
          </View>

          {/* Weekly Pattern Chart */}
          <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginTop: spacing.s }}>
            <Text style={[s.muted, { fontSize: 12, marginBottom: spacing.l }]}>Day-of-Week Spending Pattern</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, paddingHorizontal: spacing.s }}>
              {weekly.map((val, i) => (
                <View key={i} style={{ alignItems: 'center', width: '12%' }}>
                  <View style={{ width: '100%', height: `${(val / maxWeekly) * 100}%`, backgroundColor: colors.expense, borderRadius: 4, minHeight: val > 0 ? 4 : 0 }} />
                  <Text style={[s.muted, { fontSize: 10, marginTop: 8 }]}>{['M','T','W','T','F','S','S'][i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Transactions List */}
        <View style={{ paddingHorizontal: spacing.l, marginTop: spacing.m }}>
          <Text style={[s.h3, { marginBottom: spacing.m }]}>{t('recent')}</Text>
          {filteredTxns.length === 0 ? (
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <Ionicons name="receipt-outline" size={48} color={colors.border} style={{ marginBottom: spacing.m }} />
              <Text style={s.muted}>{period === null ? t('empty') : 'No transactions in ' + (period.mode === 'month' ? new Date(period.year, period.month).toLocaleString('default', { month: 'long', year: 'numeric' }) : period.date.toLocaleDateString())}</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' }}>
              {groupTransactions().map((item, index) => {
                if (item.type === 'header') {
                  return (
                    <View key={item.id} style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.m, paddingVertical: spacing.s, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                      <Text style={{ fontSize: 12, fontFamily: typography.semiBold, color: colors.muted, textTransform: 'uppercase' }}>{item.title}</Text>
                    </View>
                  );
                }
                const x = item.data;
                const isIncome = x.type === 'income';
                return (
                  <TouchableOpacity key={x.id} style={[s.row, { padding: spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]} 
                    onPress={() => navigation.navigate('Add', { transaction: x })}
                    onLongPress={() => confirmDelete(x.id)}>
                    <View style={[s.row, { flex: 1 }]}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isIncome ? `${colors.income}15` : `${colors.expense}15`, alignItems: 'center', justifyContent: 'center', marginRight: spacing.m }}>
                        <Ionicons name={CATEGORY_ICONS[x.category] || 'ellipse'} size={20} color={isIncome ? colors.income : colors.expense} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 15, marginBottom: 2 }}>{x.title}</Text>
                        <Text style={[s.muted, { fontSize: 12 }]}>{t(x.category)}</Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: typography.semiBold, color: isIncome ? colors.income : colors.text, fontVariant: ['tabular-nums'], fontSize: 15 }}>
                      {isIncome ? '+' : '-'}{fmt(x.amount, cur)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity onPress={() => navigation.navigate('Add')}
        style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: `0px 4px 8px ${colors.primary}4D` }, default: { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 } }) }}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.l, padding: spacing.xl, ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }, default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 24, elevation: 10 } }) }}>
            <View style={[s.row, { marginBottom: spacing.l }]}>
              <Text style={s.h3}>Select Period</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>

            <TouchableOpacity style={{ paddingVertical: spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }} onPress={() => applyPeriod(null)}>
              <Text style={{ fontFamily: period === null ? typography.bold : typography.medium, color: period === null ? colors.primary : colors.text }}>This Month</Text>
            </TouchableOpacity>
            
            <View style={{ paddingVertical: spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
              <Text style={{ fontFamily: period?.mode === 'month' ? typography.bold : typography.medium, color: period?.mode === 'month' ? colors.primary : colors.text, marginBottom: spacing.s }}>Custom Month</Text>
              <View style={[s.row, { backgroundColor: colors.surface, borderRadius: radius.m, padding: spacing.s }]}>
                <TouchableOpacity onPress={() => applyPeriod({ mode: 'month', month: (period?.month ?? new Date().getMonth()) - 1 < 0 ? 11 : (period?.month ?? new Date().getMonth()) - 1, year: (period?.month ?? new Date().getMonth()) - 1 < 0 ? (period?.year ?? new Date().getFullYear()) - 1 : (period?.year ?? new Date().getFullYear()) })}>
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text }}>{new Date(period?.year ?? new Date().getFullYear(), period?.month ?? new Date().getMonth()).toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={() => applyPeriod({ mode: 'month', month: (period?.month ?? new Date().getMonth()) + 1 > 11 ? 0 : (period?.month ?? new Date().getMonth()) + 1, year: (period?.month ?? new Date().getMonth()) + 1 > 11 ? (period?.year ?? new Date().getFullYear()) + 1 : (period?.year ?? new Date().getFullYear()) })}>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ paddingVertical: spacing.m }}>
              <Text style={{ fontFamily: period?.mode === 'date' ? typography.bold : typography.medium, color: period?.mode === 'date' ? colors.primary : colors.text, marginBottom: spacing.s }}>Custom Date</Text>
              <View style={[s.row, { backgroundColor: colors.surface, borderRadius: radius.m, padding: spacing.s }]}>
                <TouchableOpacity onPress={() => { const d = new Date(period?.date || new Date()); d.setDate(d.getDate() - 1); applyPeriod({ mode: 'date', date: d }); }}>
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontFamily: typography.semiBold, color: colors.text }}>{(period?.date || new Date()).toLocaleDateString()}</Text>
                <TouchableOpacity onPress={() => { const d = new Date(period?.date || new Date()); d.setDate(d.getDate() + 1); applyPeriod({ mode: 'date', date: d }); }}>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}
