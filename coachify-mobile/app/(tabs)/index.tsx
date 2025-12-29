// app/(tabs)/index.tsx - Home/Overview page
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, LogoutButton } from '../../src/components';
import { useAuthStore } from '../../src/stores/authStore';
import { darkColors, lightColors } from '../../src/styles/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { player, logout } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header 
          title={firstName || 'User'} 
          subtitle="Üdvözlünk a Coachify-ban"
          showNotification
        />

        {/* Summary Cards Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Áttekintés</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Összes</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.summaryCardLabel}>Aktív csapatok</Text>
              <Text style={styles.summaryCardValue}>{teamName ? '1' : '0'}</Text>
              <MaterialIcons name="groups" size={24} color="#ffffff" style={styles.summaryCardIcon} />
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#8b5cf6' }]}>
              <Text style={styles.summaryCardLabel}>Edzések</Text>
              <Text style={styles.summaryCardValue}>-</Text>
              <MaterialIcons name="fitness-center" size={24} color="#ffffff" style={styles.summaryCardIcon} />
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#10b981' }]}>
              <Text style={styles.summaryCardLabel}>Wellness</Text>
              <Text style={styles.summaryCardValue}>-</Text>
              <MaterialIcons name="self-improvement" size={24} color="#ffffff" style={styles.summaryCardIcon} />
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gyors műveletek</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/wellness' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: '#f3e8ff' }]}>
                <MaterialIcons name="self-improvement" size={24} color="#8b5cf6" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.foreground }]}>Wellness</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.card }]}
              onPress={() => apiAvailable && router.push('/teams' as any)}
              disabled={!apiAvailable}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: '#dbeafe' }]}>
                <MaterialIcons name="groups" size={24} color="#3b82f6" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.foreground }]}>Csapatok</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.card }]}
              onPress={() => apiAvailable && router.push('/trainings' as any)}
              disabled={!apiAvailable}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: '#fef3c7' }]}>
                <MaterialIcons name="fitness-center" size={24} color="#f59e0b" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.foreground }]}>Edzések</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: '#fce7f3' }]}>
                <MaterialIcons name="bar-chart" size={24} color="#ec4899" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.foreground }]}>Statisztika</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Legutóbbi tevékenységek</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Összes</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: '#f3e8ff' }]}>
                <MaterialIcons name="self-improvement" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: colors.foreground }]}>Wellness check</Text>
                <Text style={[styles.activitySubtitle, { color: colors.mutedForeground }]}>Ma, 14:30</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.mutedForeground} />
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: '#dbeafe' }]}>
                <MaterialIcons name="groups" size={20} color="#3b82f6" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: colors.foreground }]}>Csapat frissítés</Text>
                <Text style={[styles.activitySubtitle, { color: colors.mutedForeground }]}>Tegnap, 10:15</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.mutedForeground} />
            </View>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Profil információk</Text>
          
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {firstName?.[0] || 'U'}{lastName?.[0] || 'S'}
                </Text>
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={[styles.profileName, { color: colors.foreground }]}>{firstName} {lastName}</Text>
                <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>Sportoló</Text>
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.profileDetailRow}>
                <MaterialIcons name="email" size={18} color={colors.mutedForeground} />
                <Text style={[styles.profileDetailText, { color: colors.foreground }]}>{email}</Text>
              </View>
              
              {teamName && (
                <View style={styles.profileDetailRow}>
                  <MaterialIcons name="groups" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.profileDetailText, { color: colors.foreground }]}>{teamName}</Text>
                </View>
              )}
              
              {coachName && (
                <View style={styles.profileDetailRow}>
                  <MaterialIcons name="person" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.profileDetailText, { color: colors.foreground }]}>Edző: {coachName}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <LogoutButton onLogout={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardsScroll: {
    paddingRight: 16,
    gap: 12,
  },
  summaryCard: {
    width: 200,
    height: 140,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  summaryCardIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    opacity: 0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: '47%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '400',
  },
  profileDetails: {
    gap: 12,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileDetailText: {
    fontSize: 15,
    fontWeight: '400',
  },
  debugContainer: {
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
    fontWeight: '400',
  },
  logoutContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
});