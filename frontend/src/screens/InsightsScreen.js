import React from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { computeInsights, fmt } from '../services/insights';

import FinanceChat from '../components/FinanceChat';

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { transactions, budgets, profile } = useData();
  const { s, colors, typography, spacing } = useTheme();
  
  const cur = profile.currency;

  const EmptyState = () => (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl, minHeight: 200 }}>
      <Ionicons name="stats-chart-outline" size={64} color={colors.border} style={{ marginBottom: spacing.m }} />
      <Text style={[s.h2, { textAlign: 'center', color: colors.muted }]}>No insights yet</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>Add some transactions to see your spending trends.</Text>
    </View>
  );

  const i = computeInsights(transactions, budgets);

  // Compute 6 month expense data
  const sixMonths = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleDateString(undefined, { month: 'short' }), expense: 0 };
  });

  transactions.forEach(x => {
    if (x.type === 'expense') {
      const m = x.date.getMonth();
      const y = x.date.getFullYear();
      const match = sixMonths.find(sm => sm.month === m && sm.year === y);
      if (match) match.expense += x.amount;
    }
  });

  const maxExpense = Math.max(1, ...sixMonths.map(sm => sm.expense));

  const Stat = ({ label, value, color, icon }) => (
    <View style={[s.card, { flex: 1, marginHorizontal: spacing.xs, padding: spacing.m }]}>
      <View style={[s.row, { marginBottom: spacing.s }]}>
        <Text style={[s.muted, { fontSize: 12 }]}>{label}</Text>
        {icon && <Ionicons name={icon} size={14} color={colors.muted} />}
      </View>
      <Text style={{ fontSize: 18, fontFamily: typography.bold, color: color || colors.text, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xl }}>
        
        {!transactions.length ? <EmptyState /> : (
          <>
            {/* 6-Month Chart */}
            <View style={[s.card, { marginHorizontal: spacing.xs, padding: spacing.l }]}>
              <Text style={[s.h3, { marginBottom: spacing.xl }]}>6-Month Trend</Text>
              <View style={[s.row, { height: 120, alignItems: 'flex-end', paddingHorizontal: spacing.xs }]}>
                {sixMonths.map((sm, idx) => {
                  const h = (sm.expense / maxExpense) * 100;
                  return (
                    <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 24, height: `${Math.max(h, 2)}%`, backgroundColor: idx === 5 ? colors.primary : colors.border, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                      <Text style={[s.muted, { fontSize: 10, marginTop: 8 }]}>{sm.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
              {i.top && <Stat label={t('topCategory')} value={t(i.top[0])} icon="star-outline" />}
              <Stat label={t('forecast')} value={fmt(i.forecast, cur)} icon="trending-up-outline" />
            </View>
            <View style={{ flexDirection: 'row', marginBottom: spacing.m }}>
              {i.savingsRate !== null && <Stat label={t('savingsRate')} value={`${i.savingsRate.toFixed(0)}%`}
                color={i.savingsRate >= 20 ? colors.income : colors.expense} />}
              {i.change !== null && <Stat label={`Vs Last Month`} value={`${i.change > 0 ? '+' : ''}${i.change.toFixed(0)}%`}
                color={i.change > 0 ? colors.expense : colors.income} />}
            </View>

            {/* Tips */}
            {i.tips.length > 0 && (
              <>
                <Text style={[s.h3, { marginHorizontal: spacing.xs, marginTop: spacing.m, marginBottom: spacing.s }]}>{t('tips')}</Text>
                {i.tips.map((tip, k) => (
                  <View key={k} style={[s.card, s.row, { marginHorizontal: spacing.xs, alignItems: 'flex-start' }]}>
                    <View style={{ backgroundColor: `${colors.primary}15`, padding: 8, borderRadius: 8, marginRight: spacing.m }}>
                      <Ionicons name="bulb" size={20} color={colors.primary} />
                    </View>
                    <Text style={[s.body, { flex: 1, lineHeight: 22 }]}>
                      {t(tip.key, { ...(tip.opts || {}), cat: tip.catKey ? t(tip.catKey) : undefined, ...(tip.opts?.pct ? { pct: tip.opts.pct } : {}) })}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ marginHorizontal: spacing.xs }}>
          <FinanceChat />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
