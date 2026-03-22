import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { MD3DarkTheme } from 'react-native-paper';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ExpenseScreen from '../screens/ExpenseScreen';
import InvestmentScreen from '../screens/InvestmentScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReceiptScanScreen from '../screens/ReceiptScanScreen';
import ExportScreen from '../screens/ExportScreen';
import IncomeScreen from '../screens/IncomeScreen';

// Types
import { RootStackParamList, MainTabParamList } from '../types';

// ============================================================
// Theme
// ============================================================

export const COLORS = {
  background: '#0A0E1A',
  card: '#141929',
  cardElevated: '#1A2035',
  accent: '#00D4FF',
  accentDim: '#0099BB',
  success: '#00E676',
  warning: '#FFB300',
  danger: '#FF5252',
  textPrimary: '#FFFFFF',
  textSecondary: '#8899AA',
  textMuted: '#445566',
  border: '#1E2D3D',
  gradient1: '#0A0E1A',
  gradient2: '#0D1520',
  tabBar: '#0D1422',
  tabBarBorder: '#1E2D3D',
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.card,
    onSurface: COLORS.textPrimary,
    outline: COLORS.border,
  },
};

// ============================================================
// Navigators
// ============================================================

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// ============================================================
// Tab Bar Icon
// ============================================================

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
  color,
}: {
  name: TabIconName;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

// ============================================================
// Main Tab Navigator
// ============================================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color }) => {
          let iconName: TabIconName = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Expenses':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Investments':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'Analysis':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseScreen}
        options={{ tabBarLabel: 'Expenses' }}
      />
      <Tab.Screen
        name="Investments"
        component={InvestmentScreen}
        options={{ tabBarLabel: 'Invest' }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{ tabBarLabel: 'Analysis' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
// Root Stack Navigator
// ============================================================

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ReceiptScan"
        component={ReceiptScanScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddIncome"
        component={IncomeScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

// ============================================================
// App Navigator with NavigationContainer
// ============================================================

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.accent,
          background: COLORS.background,
          card: COLORS.card,
          text: COLORS.textPrimary,
          border: COLORS.border,
          notification: COLORS.danger,
        },
      }}
    >
      <RootStack />
    </NavigationContainer>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopColor: COLORS.tabBarBorder,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  tabIconContainer: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabIconFocused: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
  },
});
