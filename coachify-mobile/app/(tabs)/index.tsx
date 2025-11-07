// app/(tabs)/index.tsx - Home/Overview page
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../src/stores/authStore';
import { lightColors } from '../../src/styles/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { player, logout } = useAuthStore();
  
  // Inline API loading (until shared hooks are created)
  const [apiAvailable, setApiAvailable] = React.useState(false);
  
  React.useEffect(() => {
    try {
      const apiModule = require('../../src/services/api');
      setApiAvailable(true);
    } catch (error) {
      console.warn('API module not available:', error);
      setApiAvailable(false);
    }
  }, []);

  const {
    FirstName: firstName,
    LastName: lastName,
    Email: email,
    TeamName: teamName,
    CoachName: coachName,
    Id: athleteId
  } = player || {};

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
              await logout();
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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconSquare} />
            <View style={[styles.iconSquare, styles.iconSquareSmall]} />
          </View>
          <Text style={styles.title}>Főoldal</Text>
          <Text style={styles.subtitle}>
            Üdv, {firstName || 'User'}! 👋
          </Text>
        </View>

        {/* Profile Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profil</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName?.[0] || 'U'}{lastName?.[0] || 'S'}
                </Text>
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Név</Text>
                <Text style={styles.infoValue}>{firstName} {lastName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
              
              {teamName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Csapat</Text>
                  <Text style={styles.infoValue}>{teamName}</Text>
                </View>
              )}
              
              {coachName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Edző</Text>
                  <Text style={styles.infoValue}>{coachName}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Szerepkör</Text>
                <Text style={styles.infoValue}>Sportoló</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Gyors műveletek</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, !apiAvailable && styles.quickActionButtonDisabled]}
              onPress={() => apiAvailable && router.push('/teams' as any)}
              disabled={!apiAvailable}
            >
              <Text style={styles.quickActionIcon}>🏆</Text>
              <Text style={styles.quickActionText}>Csapatok</Text>
              {!apiAvailable && <Text style={styles.quickActionStatus}>Hamarosan</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, !apiAvailable && styles.quickActionButtonDisabled]}
              onPress={() => apiAvailable && router.push('/trainings' as any)}
              disabled={!apiAvailable}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>Edzések</Text>
              {!apiAvailable && <Text style={styles.quickActionStatus}>Hamarosan</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Rendszer állapot</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>Auth rendszer</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>Token kezelés</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusDot, !apiAvailable && { color: lightColors.destructive }]}>●</Text>
              <Text style={styles.statusText}>API kapcsolat</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>Navigáció</Text>
            </View>
          </View>
        </View>

        {/* Debug Info (Development only) */}
        {__DEV__ && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Debug információ</Text>
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>User ID: {athleteId || 'N/A'}</Text>
              <Text style={styles.debugText}>Email: {email || 'N/A'}</Text>
              <Text style={styles.debugText}>Team: {teamName || 'N/A'}</Text>
              <Text style={styles.debugText}>Coach: {coachName || 'N/A'}</Text>
              <Text style={styles.debugText}>API Available: {apiAvailable ? 'Yes' : 'No'}</Text>
              <Text style={styles.debugText}>Env: {__DEV__ ? 'Development' : 'Production'}</Text>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Kijelentkezés</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    marginBottom: 24,
  },
  iconSquare: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: lightColors.primary, // #e40145
  },
  iconSquareSmall: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: lightColors.primaryForeground,
    top: 24,
    left: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: lightColors.foreground,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    fontWeight: '400',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: lightColors.foreground,
    letterSpacing: 0.1,
    marginBottom: 16,
  },
  profileCard: {
    padding: 24,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    backgroundColor: lightColors.card,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightColors.primary, // #e40145
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: lightColors.primaryForeground,
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.muted,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: lightColors.mutedForeground,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
    color: lightColors.foreground,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    backgroundColor: lightColors.card,
  },
  quickActionButtonDisabled: {
    backgroundColor: lightColors.muted,
    borderColor: lightColors.muted,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: lightColors.foreground,
  },
  quickActionStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: lightColors.mutedForeground,
    backgroundColor: lightColors.muted,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    backgroundColor: lightColors.card,
    minWidth: '45%',
  },
  statusDot: {
    fontSize: 12,
    color: '#10B981', // success green
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '400',
    color: lightColors.foreground,
  },
  debugContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    backgroundColor: lightColors.muted,
  },
  debugText: {
    fontSize: 12,
    color: lightColors.mutedForeground,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
    fontWeight: '400',
  },
  logoutButton: {
    height: 56,
    backgroundColor: lightColors.primary, // #e40145
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: lightColors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});