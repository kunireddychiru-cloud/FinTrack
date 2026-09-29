import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { updateProfile } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LANGUAGES, setLanguage } from '../i18n';
import { saveProfile } from '../services/transactions';
import { currencySymbols } from '../services/insights';
import { notify } from '../notify';

const COUNTRY_CODES = ['+91', '+1', '+44', '+971'];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { profile } = useData();
  const { s, colors, typography, spacing, radius, mode, changeMode } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  
  const [saving, setSaving] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || '');
  }, [profile?.displayName, user?.displayName]);

  useEffect(() => {
    if (profile?.phone) {
      const cCode = profile.countryCode || '+91';
      setCountryCode(cCode);
      if (profile.phone.startsWith(cCode)) {
        setMobile(profile.phone.slice(cCode.length));
      } else {
        setMobile(profile.phone);
      }
    }
  }, [profile]);

  const validateMobile = (code, num) => {
    const digits = num.replace(/\D/g, '');
    if (!digits) return true; // allow empty in settings if not mandatory? The prompt says "same validation", I'll enforce it if they provided one, or just enforce it always.
    if (code === '+91') return /^[6-9]\d{9}$/.test(digits);
    return digits.length >= 7 && digits.length <= 14;
  };

  const handleSaveProfile = async () => {
    const nTrim = displayName.trim();
    let err = {};
    if (!nTrim || nTrim.length < 2 || nTrim.length > 40) err.fullName = t('errName');
    
    if (mobile && !validateMobile(countryCode, mobile)) {
      err.mobile = t('errMobile');
    }
    
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    setErrors({});
    
    setSaving(true);
    console.log("handleSaveProfile: start");

    const updateData = { displayName: nTrim };
    if (mobile) {
      const digits = mobile.replace(/\D/g, '');
      updateData.phone = `${countryCode}${digits}`;
      updateData.countryCode = countryCode;
    }

    try {
      const promises = [];
      if (nTrim !== user.displayName) {
        promises.push(
          updateProfile(user, { displayName: nTrim }).then(() => console.log("updateProfile done"))
        );
      }
      promises.push(
        saveProfile(user.uid, updateData).then(() => console.log("setDoc done"))
      );

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
      const results = await Promise.race([Promise.allSettled(promises), timeoutPromise]);

      const rejections = results.filter(r => r.status === 'rejected');
      if (rejections.length > 0) {
        console.error("handleSaveProfile error", rejections[0].reason);
        notify(t('error'), rejections[0].reason?.message || "Failed to save profile.");
      } else {
        notify(t('appName') || "Success", t('profileUpdated'));
      }
    } catch (error) {
      if (error.message === 'timeout') {
        notify(t('error'), "Saving is taking longer than usual. Check your connection and try again.");
      } else {
        console.error("handleSaveProfile error", error);
        notify(t('error'), error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const ErrText = ({ err }) => err ? <Text style={{ color: colors.expense, fontSize: 12, marginTop: -spacing.xs, marginBottom: spacing.s }}>{err}</Text> : null;

  const changed = displayName !== (profile?.displayName || user?.displayName || '') || 
    (mobile ? `${countryCode}${mobile.replace(/\D/g, '')}` !== profile?.phone : false) ||
    (!mobile && profile?.phone);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: spacing.m }}>
      
      {/* Profile Edit */}
      <View style={[s.card, { marginHorizontal: spacing.xs, padding: spacing.l }]}>
        <Text style={[s.h3, { marginBottom: spacing.m }]}>Profile</Text>
        <Text style={[s.muted, { marginBottom: spacing.xs, fontSize: 12 }]}>{t('email')}</Text>
        <Text style={{ fontFamily: typography.medium, color: colors.text, marginBottom: spacing.l }}>{user?.email}</Text>
        
        <Text style={[s.muted, { marginBottom: spacing.xs, fontSize: 12 }]}>{t('fullName')}</Text>
        <TextInput 
          style={[s.input, { marginBottom: spacing.s }, errors.fullName && { borderColor: colors.expense }]} 
          placeholder={t('fullName')} 
          value={displayName} 
          onChangeText={setDisplayName} 
          placeholderTextColor={colors.muted}
        />
        <ErrText err={errors.fullName} />
        
        <Text style={[s.muted, { marginBottom: spacing.xs, fontSize: 12 }]}>{t('mobile')}</Text>
        <View style={[s.row, { marginBottom: spacing.s, alignItems: 'flex-start' }]}>
          <TouchableOpacity onPress={() => setShowCodePicker(true)} style={[s.input, { flex: 0, minWidth: 70, marginRight: spacing.s, marginBottom: 0, paddingHorizontal: spacing.s, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: colors.text, fontFamily: typography.medium }}>{countryCode}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <TextInput style={[s.input, { marginBottom: 0 }, errors.mobile && { borderColor: colors.expense }]} placeholder={t('mobile')} keyboardType="number-pad" value={mobile} onChangeText={setMobile} placeholderTextColor={colors.muted} />
          </View>
        </View>
        <ErrText err={errors.mobile} />

        <TouchableOpacity style={[s.btn, { minHeight: 40, padding: spacing.s }, (!changed || saving) && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving || !changed}>
          <Text style={s.btnText}>{saving ? "Saving..." : t('save')}</Text>
        </TouchableOpacity>
      </View>

      {/* Theme Settings */}
      <View style={[s.card, { marginHorizontal: spacing.xs, padding: spacing.l }]}>
        <Text style={[s.h3, { marginBottom: spacing.m }]}>{t('settings')}</Text>
        <View style={s.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} style={{ marginRight: spacing.m }} />
            <Text style={{ fontFamily: typography.medium, color: colors.text }}>Dark Mode</Text>
          </View>
          <Switch 
            value={mode === 'dark'} 
            onValueChange={(val) => changeMode(val ? 'dark' : 'light')} 
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <View style={[s.row, { marginTop: spacing.m }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="phone-portrait" size={20} color={colors.text} style={{ marginRight: spacing.m }} />
            <Text style={{ fontFamily: typography.medium, color: colors.text }}>Use System Theme</Text>
          </View>
          <Switch 
            value={mode === 'system'} 
            onValueChange={(val) => changeMode(val ? 'system' : 'light')} 
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Language */}
      <View style={[s.card, { marginHorizontal: spacing.xs, padding: spacing.l }]}>
        <Text style={[s.h3, { marginBottom: spacing.m }]}>{t('language')}</Text>
        <View style={s.wrap}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity key={l.code} style={[s.chip, i18n.language === l.code && s.chipOn]}
              onPress={() => { setLanguage(l.code); saveProfile(user.uid, { language: l.code }); }}>
              <Text style={{ fontFamily: i18n.language === l.code ? typography.semiBold : typography.medium, color: i18n.language === l.code ? '#fff' : colors.text }}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Currency */}
      <View style={[s.card, { marginHorizontal: spacing.xs, padding: spacing.l }]}>
        <Text style={[s.h3, { marginBottom: spacing.m }]}>{t('currency')}</Text>
        <View style={s.wrap}>
          {Object.keys(currencySymbols).map((c) => {
            const isActive = (profile?.currency || 'INR') === c;
            return (
              <TouchableOpacity key={c} style={[s.chip, isActive && s.chipOn]}
                onPress={() => saveProfile(user.uid, { currency: c })}>
                <Text style={{ fontFamily: isActive ? typography.semiBold : typography.medium, color: isActive ? '#fff' : colors.text }}>{currencySymbols[c]} {c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={[s.btn, { backgroundColor: `${colors.expense}15`, marginHorizontal: spacing.xs, marginBottom: spacing.xxl }]} onPress={logout}>
        <Text style={[s.btnText, { color: colors.expense }]}>{t('logout')}</Text>
      </TouchableOpacity>

      <Modal visible={showCodePicker} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowCodePicker(false)}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius?.md || 12, width: 250, padding: spacing.m }}>
            {COUNTRY_CODES.map(code => (
              <TouchableOpacity key={code} style={{ padding: spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }} onPress={() => { setCountryCode(code); setShowCodePicker(false); }}>
                <Text style={{ fontSize: 18, fontFamily: typography.medium, color: colors.text, textAlign: 'center' }}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
