import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { AccountScreen } from './src/screens/AccountScreen';
import { PassportScreen } from './src/screens/PassportScreen';
import { RouletteScreen } from './src/screens/RouletteScreen';
import { colors, spacing } from './src/theme';

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
  const { loading } = useApp();

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
