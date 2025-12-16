// src/components/LogoutButton.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { lightColors } from '../styles/colors';

interface LogoutButtonProps {
  onLogout: () => Promise<void>;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretnél jelentkezni?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Kijelentkezés',
          style: 'destructive',
          onPress: async () => {
            try {
              await onLogout();
              router.replace('/(auth)/auth');
            } catch (error) {
              console.error('Logout error:', error);
              router.replace('/(auth)/auth');
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.logoutButton} 
      onPress={handleLogout}
      activeOpacity={0.8}
    >
      <Text style={styles.logoutButtonText}>Kijelentkezés</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    height: 50,
    backgroundColor: lightColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: lightColors.primaryForeground,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

