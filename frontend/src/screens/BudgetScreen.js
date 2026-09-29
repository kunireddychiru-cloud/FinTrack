import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { monthStats, fmt, currencySymbols } from '../services/insights';
import { setBudget } from '../services/transactions';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../services/categorizer';

function Row({ cat }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { transactions, budgets, profile } = useData();
  const { s, colors, typography, spacing } = useTheme();
  
  const [val, setVal] = useState('');
  const spent = monthStats(transactions).byCat[cat] || 0;
  const limit = budgets[cat]?.limit;
  const pct = limit ? spent / limit : 0;
  const color = pct >= 1 ? colors.expense : pct >= 0.8 ? colors.warn : colors.primary;

  return (
    <View style={[s.card, { marginHorizontal: spacing.xs, padding: spacing.l }]}>
      <View style={[s.row, { marginBottom: spacing.xs }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={CATEGORY_ICONS[cat] || 'ellipse'} size={18} color={colors.text} style={{ marginRight: spacing.s }} />
          <Text style={[s.h3, { marginBottom: 0 }]}>{t(cat)}</Text>
        </View>
        {limit ? <Text style={{ color, fontFamily: typography.semiBold, fontSize: 12 }}>{pct >= 1 ? t('overBudget') : pct >= 0.8 ? t('nearLimit') : ''}</Text> : null}
      </View>
      
      <View style={[s.row, { marginBottom: spacing.m }]}>
        <Text style={[s.muted, { fontSize: 13 }]}>{t('spent')}:</Text>
        <Text style={{ fontFamily: typography.medium, color: colors.text, fontVariant: ['tabular-nums'] }}>
          {fmt(spent, profile.currency)}
          {limit ? <Text style={s.muted}> / {fmt(limit, profile.currency)}</Text> : ''}
        </Text>
      </View>

      {limit ? (
        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: spacing.l }}>
          <View style={{ height: 6, width: `${Math.min(100, pct * 100)}%`, backgroundColor: color, borderRadius: 3 }} />
        </View>
      ) : null}
      
      <View style={s.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: spacing.m, flex: 1, marginRight: spacing.s, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
          <Text style={{ color: colors.muted, fontFamily: typography.medium }}>{currencySymbols[profile?.currency || 'INR'] || '₹'}</Text>
          <TextInput 
            style={{ flex: 1, padding: spacing.m, fontFamily: typography.medium, color: colors.text }} 
            placeholder={t('limit')}
            keyboardType="decimal-pad" 
            value={val} 
            onChangeText={setVal} 
            placeholderTextColor={colors.muted}
          />
        </View>
        <TouchableOpacity style={[s.btn, { marginTop: 0, paddingHorizontal: spacing.l, minHeight: 46 }]}
          onPress={() => { if (parseFloat(val) > 0) { setBudget(user.uid, cat, val); setVal(''); } }}>
          <Text style={s.btnText}>{t('set')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BudgetScreen() {
  const { s, spacing } = useTheme();
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: spacing.m }}>
      {EXPENSE_CATEGORIES.map((c) => <Row key={c} cat={c} />)}
    </ScrollView>
  );
}
