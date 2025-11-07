// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 400,
        gestureEnabled: true,
        ...(Platform.OS === 'ios' && {
          presentation: 'card',
        }),
      }}
    >
      <Stack.Screen 
        name="auth"
        options={{
          animation: 'fade',
          animationDuration: 300,
        }}
      />
    </Stack>
  );
}