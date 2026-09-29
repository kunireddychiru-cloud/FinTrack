import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function SuccessScreen() {
  const { t } = useTranslation();
  const { user, setJustRegistered } = useAuth();
  const { profile } = useData();
  const { s, colors, typography, spacing, radius } = useTheme();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) {
        scaleAnim.setValue(1);
        fadeAnim.setValue(1);
      } else {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start();
      }
    });
  }, [scaleAnim, fadeAnim]);

  const maskPhone = (phone) => {
    if (!phone || phone.length < 5) return phone;
    const first3 = phone.substring(0, 3);
    const last4 = phone.substring(phone.length - 4);
    const masked = '•'.repeat(phone.length - 7);
    return `${first3} ${masked}${last4}`;
  };

  const firstName = (user?.displayName || '').split(' ')[0] || 'User';

  return (
    <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <Animated.View style={{ width: '100%', maxWidth: 420, padding: 24, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.income}20`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.l }}>
            <Ionicons name="checkmark" size={48} color={colors.income} />
          </View>
          <Text style={{ fontSize: 28, fontFamily: typography.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.s }}>
            {t('accountCreated', { name: firstName })}
          </Text>
          <Text style={[s.muted, { textAlign: 'center', fontSize: 15 }]}>{t('accountSubtext')}</Text>
        </View>

        <View style={[s.card, { padding: spacing.xl, marginBottom: 32 }]}>
          <View style={[s.row, { marginBottom: spacing.m }]}>
            <Text style={[s.muted, { flex: 1 }]}>{t('fullName')}</Text>
            <Text style={{ fontFamily: typography.medium, color: colors.text }}>{user?.displayName || '-'}</Text>
          </View>
          <View style={[s.row, { marginBottom: spacing.m }]}>
            <Text style={[s.muted, { flex: 1 }]}>{t('email')}</Text>
            <Text style={{ fontFamily: typography.medium, color: colors.text }}>{user?.email || '-'}</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.muted, { flex: 1 }]}>{t('mobile')}</Text>
            <Text style={{ fontFamily: typography.medium, color: colors.text, fontVariant: ['tabular-nums'] }}>
              {maskPhone(profile?.phone || '')}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={() => setJustRegistered(false)}>
          <Text style={s.btnText}>{t('continueToDash')}</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}
