// src/components/Header.tsx
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { darkColors, lightColors } from '../styles/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNotification?: boolean;
}

export function Header({ title, subtitle, showNotification }: HeaderProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Üdv,</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        </View>
        {showNotification && (
          <View style={styles.notificationIcon}>
            <MaterialIcons name="notifications-none" size={24} color={colors.foreground} />
          </View>
        )}
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 4,
  },
  notificationIcon: {
    padding: 4,
  },
});

