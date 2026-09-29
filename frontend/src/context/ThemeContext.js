import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Typography config
export const typography = {
  fontFamily: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

// Spacing
export const spacing = {
  xs: 4, s: 8, sm: 8, m: 12, md: 12, l: 16, lg: 16, xl: 24, xxl: 32,
};

// Radius
export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, pill: 999
};

const palettes = {
  light: {
    primary: '#0D9488', // Deep Teal
    bg: '#FAFAFA',
    card: '#FFFFFF',
    text: '#171717',
    muted: '#737373',
    income: '#16A34A',
    expense: '#EF4444',
    border: '#E5E5E5',
    warn: '#F59E0B',
    surface: '#F5F5F5',
  },
  dark: {
    primary: '#14B8A6',
    bg: '#0A0A0A',
    card: '#171717',
    text: '#F5F5F5',
    muted: '#A3A3A3',
    income: '#22C55E',
    expense: '#F87171',
    border: '#262626',
    warn: '#FCD34D',
    surface: '#262626',
  }
};

const defaultTheme = {
  mode: 'light',
  changeMode: () => {},
  activeTheme: 'light',
  colors: palettes.light,
  spacing,
  radius,
  typography,
  s: {}
};

const ThemeContext = createContext(defaultTheme);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn("useTheme must be used within a ThemeProvider. Falling back to default theme.");
    return defaultTheme;
  }
  return context;
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system'); // 'system', 'light', 'dark'
  
  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((val) => {
      if (val) setMode(val);
    });
  }, []);

  const changeMode = (newMode) => {
    setMode(newMode);
    AsyncStorage.setItem('theme_mode', newMode);
  };

  const activeTheme = mode === 'system' ? (systemScheme || 'light') : mode;
  const colors = palettes[activeTheme] || palettes.light;

  const s = React.useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    pad: { padding: spacing.l },
    card: { 
      backgroundColor: colors.card, 
      borderRadius: radius.md, 
      borderWidth: StyleSheet.hairlineWidth, 
      borderColor: colors.border, 
      padding: spacing.l, 
      marginBottom: spacing.m 
    },
    h1: { fontSize: 32, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.l },
    h2: { fontSize: 20, fontFamily: typography.semiBold, color: colors.text, marginBottom: spacing.s },
    h3: { fontSize: 16, fontFamily: typography.semiBold, color: colors.text },
    body: { fontSize: 15, fontFamily: typography.fontFamily, color: colors.text },
    muted: { color: colors.muted, fontSize: 13, fontFamily: typography.fontFamily },
    input: { 
      backgroundColor: colors.card, 
      borderWidth: StyleSheet.hairlineWidth, 
      borderColor: colors.border, 
      borderRadius: radius.md, 
      padding: spacing.l, 
      marginBottom: spacing.m, 
      fontSize: 16, 
      fontFamily: typography.fontFamily, 
      color: colors.text 
    },
    btn: { 
      backgroundColor: colors.primary, 
      padding: spacing.l, 
      borderRadius: radius.md, 
      alignItems: 'center', 
      marginTop: spacing.s, 
      minHeight: 48, 
      justifyContent: 'center' 
    },
    btnText: { color: '#fff', fontFamily: typography.semiBold, fontSize: 16 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chip: { 
      paddingVertical: spacing.s, 
      paddingHorizontal: spacing.m, 
      borderRadius: radius.pill, 
      borderWidth: StyleSheet.hairlineWidth, 
      borderColor: colors.border, 
      marginRight: spacing.s, 
      marginBottom: spacing.s, 
      backgroundColor: colors.card, 
      flexDirection: 'row', 
      alignItems: 'center', 
      minHeight: 44, 
      justifyContent: 'center' 
    },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    wrap: { flexDirection: 'row', flexWrap: 'wrap' },
    money: { fontVariant: ['tabular-nums'], fontFamily: typography.semiBold },
  }), [colors]);

  return (
    <ThemeContext.Provider value={{ mode, changeMode, activeTheme, colors, s, typography, spacing, radius }}>
      {children}
    </ThemeContext.Provider>
  );
}
