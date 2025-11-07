// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../src/stores/authStore';

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    // Check auth state when app starts
    checkAuth();
    // Mark component as mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return; // Wait for mount and auth check to complete
        
    const inAuthGroup = segments[0] === '(auth)';
        
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to unified auth if not authenticated
      router.replace('/(auth)/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if already authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, isMounted]);
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

export default function RootLayout() {
  const { isLoading } = useAuthStore();
  useProtectedRoute(); // ez hívja checkAuth

  // Amíg isLoading true, mutatjuk a spinner-t:
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Ha már beállt, rendereljük a Stack-et
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});