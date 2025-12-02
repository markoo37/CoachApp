// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();

  // Ha nincs bejelentkezve, irányítsd át unified auth-ra
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Főoldal',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Wellness"
        options={{
          title: "Wellness",
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Csapatok',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏆</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          title: 'Edzések',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
        }}
      />
    </Tabs>
  );
}