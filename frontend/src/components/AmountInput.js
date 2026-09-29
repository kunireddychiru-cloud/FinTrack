import React from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AmountInput({ amount, setAmount, sym, type, error, label }) {
  const { s, colors, typography } = useTheme();
  
  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <Text style={[s.muted, { marginBottom: 8 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 60, overflow: 'hidden' }}>
        <Text style={{ fontSize: 40, fontFamily: typography.bold, color: type === 'expense' || type === 'withdrawal' ? colors.expense : colors.income, marginRight: 8 }}>{sym}</Text>
        <TextInput 
          style={[{ fontSize: 48, fontFamily: typography.bold, color: type === 'expense' || type === 'withdrawal' ? colors.expense : colors.income, minWidth: 100 }, Platform.OS === 'web' && { outlineStyle: 'none' }]} 
          placeholder="0.00" 
          keyboardType="decimal-pad" 
          value={amount} 
          onChangeText={setAmount} 
          placeholderTextColor={colors.muted}
        />
      </View>
      {error ? <Text style={{ color: colors.expense, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
