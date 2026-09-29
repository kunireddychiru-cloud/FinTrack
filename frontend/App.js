import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import './src/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import SavingsScreen from './src/screens/SavingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icons = { Dashboard: 'home', Budgets: 'wallet', Savings: 'leaf-outline', Insights: 'stats-chart', Settings: 'settings' };

function Tabs() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      headerStyle: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
      headerShadowVisible: false,
      headerTitleStyle: { fontFamily: typography.semiBold, color: colors.text },
      headerTintColor: colors.text,
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('dashboard') }} />
      <Tab.Screen name="Budgets" component={BudgetScreen} options={{ title: t('budgets') }} />
      <Tab.Screen name="Savings" component={SavingsScreen} options={{ title: t('savings') || 'Savings' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: t('insights') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings') }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading, justRegistered } = useAuth();
  const { t } = useTranslation();
  const { activeTheme, colors, typography } = useTheme();

  React.useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);
  
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  
  const navTheme = activeTheme === 'dark' ? DarkTheme : DefaultTheme;
  const myTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    }
  };

  return (
    <NavigationContainer theme={myTheme}>
      <Stack.Navigator screenOptions={{ 
        headerStyle: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: typography.semiBold, color: colors.text },
        headerTintColor: colors.text
      }}>
        {user ? (
          justRegistered ? (
            <Stack.Screen name="Success" component={SuccessScreen} options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
              <Stack.Screen name="Add" component={AddTransactionScreen} options={{ title: t('addTransaction'), presentation: 'modal' }} />
            </>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Root />
            <StatusBar style="auto" />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
