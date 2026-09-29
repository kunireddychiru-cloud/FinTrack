import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { answerQuestion } from '../services/financeAssistant';

export default function FinanceChat() {
  const { t } = useTranslation();
  const { s, colors, typography, spacing, radius } = useTheme();
  const { transactions, profile, budgets } = useData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const chips = [
    { label: t('chipSave') || 'How can I save more?', q: 'How can I save more?' },
    { label: t('chipBiggest') || "What's my biggest expense?", q: "What's my biggest expense?" },
    { label: t('chipBudget') || 'Am I over budget?', q: 'Am I over budget?' },
    { label: t('chipCompare') || 'How does this month compare?', q: 'How does this month compare?' }
  ];

  const handleSend = (text) => {
    const q = text.trim();
    if (!q) return;
    
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: q, isUser: true }]);
    setIsTyping(true);

    setTimeout(() => {
      const response = answerQuestion(q, { transactions, profile, budgets });
      setMessages(prev => [...prev, { id: Date.now().toString() + 'a', text: response.text, isUser: false }]);
      setIsTyping(false);
    }, 500);
  };

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: radius.l, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginTop: spacing.l }}>
      <View style={[s.row, { padding: spacing.m, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} style={{ marginRight: spacing.s }} />
          <View>
            <Text style={{ fontFamily: typography.semiBold, color: colors.text, fontSize: 16 }}>{t('financeAssistant') || 'Finance Assistant'}</Text>
            <Text style={[s.muted, { fontSize: 11 }]}>{t('financeAssistantSub') || 'Answers are generated from your own transaction data.'}</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={() => setMessages([])}>
            <Text style={{ fontFamily: typography.medium, color: colors.expense, fontSize: 14 }}>{t('clearChat') || 'Clear'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView ref={scrollRef} style={{ padding: spacing.m, minHeight: 200, maxHeight: 400 }}>
        {messages.length === 0 && (
          <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'center', marginTop: spacing.l }}>
            {chips.map((c, i) => (
              <TouchableOpacity key={i} onPress={() => handleSend(c.q)} style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.m, paddingVertical: spacing.s, borderRadius: 16, margin: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Text style={{ fontFamily: typography.medium, color: colors.primary, fontSize: 13 }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map(m => (
          <View key={m.id} style={{ flexDirection: 'row', justifyContent: m.isUser ? 'flex-end' : 'flex-start', marginBottom: spacing.m }}>
            {!m.isUser && (
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', marginRight: spacing.s }}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
            )}
            <View style={{ maxWidth: '75%', backgroundColor: m.isUser ? colors.primary : colors.card, padding: spacing.m, borderRadius: radius.m, borderTopRightRadius: m.isUser ? 0 : radius.m, borderTopLeftRadius: !m.isUser ? 0 : radius.m, borderWidth: m.isUser ? 0 : StyleSheet.hairlineWidth, borderColor: colors.border }}>
              <Text style={{ fontFamily: typography.regular, color: m.isUser ? '#fff' : colors.text, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: spacing.m }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', marginRight: spacing.s }}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
            </View>
            <View style={{ backgroundColor: colors.card, padding: spacing.m, borderRadius: radius.m, borderTopLeftRadius: 0, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', padding: spacing.s, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
        <TextInput
          style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.m, paddingHorizontal: spacing.m, paddingVertical: Platform.OS === 'ios' ? 12 : 8, color: colors.text, fontFamily: typography.regular }}
          placeholder={t('typeMessage') || 'Ask a question...'}
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend(input)}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={() => handleSend(input)} disabled={!input.trim()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: input.trim() ? colors.primary : colors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.s }}>
          <Ionicons name="send" size={20} color={input.trim() ? '#fff' : colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
