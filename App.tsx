import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from './src/context/AppContext';
import { AccountScreen } from './src/screens/AccountScreen';
import { PassportScreen } from './src/screens/PassportScreen';
import { RouletteScreen } from './src/screens/RouletteScreen';
import { CompanionScreen } from './src/screens/CompanionScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PassportSetupScreen } from './src/screens/PassportSetupScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { storage } from './src/storage';
import { colors, spacing } from './src/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'PassportPlanner',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function LoadingSplash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashIcon}>📘</Text>
      <ActivityIndicator color={colors.primary} size="large" style={styles.splashSpinner} />
    </View>
  );
}

function Root() {
  const { authLoading, session, passportLoading, passport, loading } = useApp();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    storage.readJson(storage.keys.onboardingSeen, false).then((seen) => {
      setShowOnboarding(!seen);
      setOnboardingChecked(true);
    });
  }, []);

  function handleFinishOnboarding() {
    storage.writeJson(storage.keys.onboardingSeen, true);
    setShowOnboarding(false);
  }

  if (!onboardingChecked) {
    return <LoadingSplash />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  if (authLoading) {
    return <LoadingSplash />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (passportLoading) {
    return <LoadingSplash />;
  }

  if (!passport) {
    return <PassportSetupScreen />;
  }

  if (loading) {
    return <LoadingSplash />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.inkMuted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
          },
        }}
      >
        <Tab.Screen
          name="Cuenta"
          component={AccountScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Pasaporte"
          component={PassportScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="📘" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Ruleta"
          component={RouletteScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="🎡" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Compañero"
          component={CompanionScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  splashIcon: {
    fontSize: 56,
  },
  splashSpinner: {
    marginTop: spacing.lg,
  },
});
