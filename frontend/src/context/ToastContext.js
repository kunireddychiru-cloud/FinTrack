import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const { colors, typography, radius, spacing } = useTheme();
  
  const [toast, setToast] = useState(null); // { title, message, type }
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) {
        opacityAnim.setValue(1);
        translateYAnim.setValue(0);
        setTimeout(() => {
          setToast(null);
        }, 2500);
      } else {
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true })
        ]).start();

        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(translateYAnim, { toValue: -20, duration: 250, useNativeDriver: true })
          ]).start(() => setToast(null));
        }, 2500);
      }
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: Platform.OS === 'web' ? 24 : 50,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }]
          }}
          accessibilityLiveRegion="polite"
          accessibilityRole={Platform.OS === 'web' ? 'status' : undefined}
        >
          <View style={{
            backgroundColor: toast.type === 'error' ? colors.expense : colors.income,
            paddingHorizontal: spacing.l,
            paddingVertical: spacing.m,
            borderRadius: radius.pill || 99,
            maxWidth: 400,
            width: '90%',
            ...Platform.select({
              web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.15)' },
              default: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }
            })
          }}>
            <Text style={{ fontFamily: typography.semiBold, color: '#fff', fontSize: 14, textAlign: 'center' }}>
              {toast.title}
            </Text>
            {toast.message && (
              <Text style={{ fontFamily: typography.medium, color: 'rgba(255,255,255,0.9)', fontSize: 12, textAlign: 'center', marginTop: 2 }}>
                {toast.message}
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
