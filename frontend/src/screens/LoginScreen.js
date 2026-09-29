import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notify } from '../notify';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

const COUNTRY_CODES = ['+91', '+1', '+44', '+971'];

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { login, signup, setJustRegistered } = useAuth();
  const { s, colors, typography, spacing, radius } = useTheme();
  
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCodePicker, setShowCodePicker] = useState(false);
  
  const [errors, setErrors] = useState({});

  const animateLayout = () => {
    import('react-native').then(({ AccessibilityInfo, LayoutAnimation }) => {
      AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
        if (!reduced) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
    });
  };

  const switchMode = (m) => {
    animateLayout();
    setMode(m);
    setErrors({});
    if (m === 'reset') setResetSent(false);
  };

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateMobile = (code, num) => {
    const digits = num.replace(/\D/g, '');
    if (code === '+91') {
      return /^[6-9]\d{9}$/.test(digits);
    }
    return digits.length >= 7 && digits.length <= 14;
  };

  const validate = () => {
    let err = {};
    const eTrim = email.trim();
    if (!eTrim || !validateEmail(eTrim)) err.email = t('errEmail');
    if (!pw || pw.length < 6) err.pw = t('errPassword');

    if (mode === 'signup') {
      const nTrim = fullName.trim();
      if (!nTrim || nTrim.length < 2 || nTrim.length > 40) err.fullName = t('errName');
      if (!mobile || !validateMobile(countryCode, mobile)) err.mobile = t('errMobile');
      if (pw !== confirmPw) err.confirmPw = t('errConfirmPw');
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const blurField = (field) => {
    let err = { ...errors };
    if (field === 'email') {
      if (email && !validateEmail(email.trim())) err.email = t('errEmail'); else delete err.email;
    }
    if (field === 'pw') {
      if (pw && pw.length < 6) err.pw = t('errPassword'); else delete err.pw;
    }
    if (field === 'fullName') {
      const nTrim = fullName.trim();
      if (fullName && (nTrim.length < 2 || nTrim.length > 40)) err.fullName = t('errName'); else delete err.fullName;
    }
    if (field === 'mobile') {
      if (mobile && !validateMobile(countryCode, mobile)) err.mobile = t('errMobile'); else delete err.mobile;
    }
    if (field === 'confirmPw') {
      if (confirmPw && confirmPw !== pw) err.confirmPw = t('errConfirmPw'); else delete err.confirmPw;
    }
    setErrors(err);
  };

  const submit = async () => {
    if (!validate()) return;
    if (busy) return;

    setBusy(true);
    try { 
      if (mode === 'login') {
        await login(email.trim(), pw);
      } else {
        setJustRegistered(true);
        const cred = await signup(email.trim(), pw);
        const nameTrimmed = fullName.trim();
        const digits = mobile.replace(/\D/g, '');
        const fullPhone = `${countryCode}${digits}`;
        
        try {
          await updateProfile(cred.user, { displayName: nameTrimmed });
        } catch(e) { console.warn(e); }
        
        try {
          await setDoc(doc(db, 'users', cred.user.uid), {
            displayName: nameTrimmed,
            phone: fullPhone,
            countryCode: countryCode,
            currency: 'INR',
            language: i18n.language,
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn("Firestore error", e);
          notify(t('error'), t('savingProfileError'));
        }
      }
    }
    catch (e) { 
      setJustRegistered(false);
      console.log(e.code, e.message);
      let msg = e.message;
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        msg = "Wrong email or password, or this account doesn't exist. Try Sign up.";
      } else if (e.code === 'auth/email-already-in-use') {
        msg = "This email already has an account. Please log in.";
      } else if (e.code === 'auth/weak-password') {
        msg = "Password must be at least 6 characters.";
      } else if (e.code === 'auth/operation-not-allowed') {
        msg = "Email/Password sign-in is not enabled in Firebase Console.";
      } else if (e.code === 'auth/network-request-failed') {
        msg = "Network error. Check your connection.";
      }
      notify(t('error'), msg);
    }
    setBusy(false);
  };

  const submitReset = async () => {
    const eTrim = email.trim();
    if (!eTrim || !validateEmail(eTrim)) {
      setErrors({ email: t('errEmail') });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, eTrim);
      setResetSent(true);
    } catch (e) {
      if (e.code === 'auth/invalid-email') {
        setErrors({ email: t('errEmail') });
      } else if (e.code === 'auth/too-many-requests') {
        notify(t('error'), t('tooManyReq'));
      } else if (e.code === 'auth/network-request-failed') {
        notify(t('error'), t('networkErr'));
      } else {
        notify(t('error'), e.message);
      }
    }
    setBusy(false);
  };

  const ErrText = ({ err }) => err ? <Text style={{ color: colors.expense, fontSize: 12, marginTop: -spacing.m + 4, marginBottom: spacing.m, marginLeft: 4 }}>{err}</Text> : null;

  return (
    <KeyboardAvoidingView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <View style={{ width: '100%', maxWidth: 420, padding: 24, marginVertical: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Ionicons name="leaf" size={48} color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 32, fontFamily: typography.bold, color: colors.text, textAlign: 'center' }}>FinTrack</Text>
            <Text style={[s.muted, { marginTop: 8, textAlign: 'center' }]}>Manage your money smoothly.</Text>
          </View>

          {mode !== 'reset' && (
            <View style={[s.row, { backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, marginBottom: 24 }]}>
              <TouchableOpacity 
                style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm }, mode === 'login' && { backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }, default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } }) }]}
                onPress={() => switchMode('login')}>
                <Text style={{ fontFamily: mode === 'login' ? typography.semiBold : typography.fontFamily, color: mode === 'login' ? colors.text : colors.muted }}>{t('login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm }, mode === 'signup' && { backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }, default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } }) }]}
                onPress={() => switchMode('signup')}>
                <Text style={{ fontFamily: mode === 'signup' ? typography.semiBold : typography.fontFamily, color: mode === 'signup' ? colors.text : colors.muted }}>{t('signup')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'signup' && (
            <>
              <TextInput style={[s.input, errors.fullName && { borderColor: colors.expense }]} placeholder={t('fullName')} autoCapitalize="words" value={fullName} onChangeText={setFullName} onBlur={() => blurField('fullName')} placeholderTextColor={colors.muted} />
              <ErrText err={errors.fullName} />
              
              <View style={[s.row, { marginBottom: spacing.m, alignItems: 'flex-start' }]}>
                <TouchableOpacity onPress={() => setShowCodePicker(true)} style={[s.input, { flex: 0, minWidth: 70, marginRight: spacing.s, marginBottom: 0, paddingHorizontal: spacing.s, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: colors.text, fontFamily: typography.medium }}>{countryCode}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <TextInput style={[s.input, { marginBottom: 0 }, errors.mobile && { borderColor: colors.expense }]} placeholder={t('mobile')} keyboardType="number-pad" value={mobile} onChangeText={setMobile} onBlur={() => blurField('mobile')} placeholderTextColor={colors.muted} />
                </View>
              </View>
              <ErrText err={errors.mobile} />
            </>
          )}

          <TextInput style={[s.input, errors.email && { borderColor: colors.expense }]} placeholder={t('email')} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} onBlur={() => blurField('email')} placeholderTextColor={colors.muted} />
          <ErrText err={errors.email} />
          
          {mode !== 'reset' && (
            <>
              <View style={{ position: 'relative', marginBottom: spacing.xs }}>
                <TextInput style={[s.input, { marginBottom: 0, paddingRight: 50 }, errors.pw && { borderColor: colors.expense }]} placeholder={t('password')} secureTextEntry={!showPw} value={pw} onChangeText={setPw} onBlur={() => blurField('pw')} placeholderTextColor={colors.muted} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 14 }}>
                  <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <ErrText err={errors.pw} />

              {mode === 'login' && (
                <TouchableOpacity onPress={() => switchMode('reset')} style={{ alignSelf: 'flex-end', marginBottom: spacing.m }}>
                  <Text style={{ color: colors.primary, fontFamily: typography.medium, fontSize: 13 }}>{t('forgotPw')}</Text>
                </TouchableOpacity>
              )}

              {mode === 'signup' && (
                <>
                  <TextInput style={[s.input, errors.confirmPw && { borderColor: colors.expense }]} placeholder={t('confirmPassword')} secureTextEntry={!showPw} value={confirmPw} onChangeText={setConfirmPw} onBlur={() => blurField('confirmPw')} placeholderTextColor={colors.muted} />
                  <ErrText err={errors.confirmPw} />
                </>
              )}
            </>
          )}

          {mode === 'reset' && resetSent && (
            <View style={{ backgroundColor: `${colors.primary}15`, padding: spacing.m, borderRadius: radius.md, marginBottom: spacing.m }}>
              <Text style={{ color: colors.primary, fontFamily: typography.medium, fontSize: 14, lineHeight: 20 }}>
                {t('resetSent', { email })}
              </Text>
            </View>
          )}

          <TouchableOpacity style={[s.btn, busy && { opacity: 0.7 }, mode === 'reset' && { marginTop: spacing.m }]} onPress={mode === 'reset' ? submitReset : submit} disabled={busy}>
            <Text style={s.btnText}>{busy ? "Please wait..." : (mode === 'reset' ? t('sendReset') : (mode === 'login' ? t('login') : t('signup')))}</Text>
          </TouchableOpacity>

          {mode === 'reset' && (
            <TouchableOpacity onPress={() => switchMode('login')} style={{ alignItems: 'center', marginTop: spacing.l }}>
              <Text style={{ color: colors.muted, fontFamily: typography.medium, fontSize: 14 }}>{t('backToLogin')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Country Code Picker Modal */}
      <Modal visible={showCodePicker} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowCodePicker(false)}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.md, width: 250, padding: spacing.m }}>
            {COUNTRY_CODES.map(code => (
              <TouchableOpacity key={code} style={{ padding: spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }} onPress={() => { setCountryCode(code); setShowCodePicker(false); }}>
                <Text style={{ fontSize: 18, fontFamily: typography.medium, color: colors.text, textAlign: 'center' }}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
