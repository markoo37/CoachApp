// app/(tabs)/teams.tsx - Teams page
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../src/stores/authStore';
import { lightColors } from '../../src/styles/colors';

// Inline types
interface TeamData {
  Id: number;
  Name: string;
  Coach: {
    Id: number;
    FirstName: string;
    LastName: string;
    Email: string;
  };
  PlayerCount: number;
}

export default function TeamsScreen() {
  const router = useRouter();
  let player, logout;
  try {
    const store = useAuthStore();
    player = store.player;
    logout = store.logout;
  } catch (error) {
    console.error('Auth store error:', error);
    player = null;
    logout = () => {};
  }

  // Inline API loading
  const [apiAvailable, setApiAvailable] = useState(false);
  const [PlayerAPI, setPlayerAPI] = useState<any>(null);
  
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { FirstName: firstName } = player || {};

  // Load API
  useEffect(() => {
    try {
      const apiModule = require('../../src/services/api');
      setPlayerAPI(apiModule.PlayerAPI);
      setApiAvailable(true);
    } catch (error) {
      console.warn('API module not available:', error);
      setApiAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (apiAvailable) {
      fetchTeams();
    }
  }, [apiAvailable]);

  const fetchTeams = async () => {
    if (!PlayerAPI) {
      Alert.alert('Hiba', 'API nem elérhető');
      return;
    }

    setLoading(true);
    try {
      const teamsData = await PlayerAPI.getTeams();
      const filtered = (teamsData || []).filter((team: TeamData) => team.Name !== '_Unassigned');
      setTeams(filtered);
    } catch (error) {
      console.error('Error fetching teams:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni a csapatokat');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!apiAvailable) return;

    setRefreshing(true);
    try {
      await fetchTeams();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleTeamPress = (team: TeamData) => {
    // Navigate to trainings page with team parameter
    router.push({
      pathname: '/trainings' as any,
      params: { teamId: team.Id.toString(), teamName: team.Name }
    });
  };

  if (!apiAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconSquare} />
              <View style={[styles.iconSquare, styles.iconSquareSmall]} />
            </View>
            <Text style={styles.title}>Csapatok</Text>
            <Text style={styles.subtitle}>
              Üdv, {firstName || 'User'}! 👋
            </Text>
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              A csapatok funkció hamarosan elérhető lesz
            </Text>
          </View>

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={lightColors.primary}
            colors={[lightColors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconSquare} />
            <View style={[styles.iconSquare, styles.iconSquareSmall]} />
          </View>
          <Text style={styles.title}>Csapatok</Text>
          <Text style={styles.subtitle}>
            Üdv, {firstName || 'User'}! 👋
          </Text>
        </View>

        {/* Teams Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Csapataim</Text>
            <TouchableOpacity 
              onPress={() => fetchTeams()}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>🔄</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={lightColors.primary} />
              <Text style={styles.loadingText}>Csapatok betöltése...</Text>
            </View>
          ) : teams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Még nincs csapatod</Text>
              <Text style={styles.emptyDescription}>
                Várj, amíg egy edző hozzáad téged egy csapathoz
              </Text>
            </View>
          ) : (
            <View style={styles.teamsContainer}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.Id}
                  style={styles.teamCard}
                  onPress={() => handleTeamPress(team)}
                  activeOpacity={0.7}
                >
                  <View style={styles.teamIcon}>
                    <Text style={styles.teamIconText}>🏆</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.Name}</Text>
                    <Text style={styles.teamCoach}>
                      Edző: {team.Coach.FirstName} {team.Coach.LastName}
                    </Text>
                    <Text style={styles.teamPlayers}>
                      👥 {team.PlayerCount} játékos
                    </Text>
                  </View>
                  <View style={styles.teamArrowContainer}>
                    <Text style={styles.teamArrow}>▶</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    fontSize: 32,
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
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: lightColors.foreground,
    letterSpacing: 0.1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: lightColors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: lightColors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutButton: {
    height: 56,
    backgroundColor: lightColors.primary, // #e40145
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: lightColors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  teamsContainer: {
    gap: 16,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 12,
    backgroundColor: lightColors.card,
    shadowColor: lightColors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  teamIconText: {
    fontSize: 20,
  },
  teamInfo: {
    flex: 1,
    gap: 4,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: lightColors.foreground,
    marginBottom: 4,
  },
  teamCoach: {
    fontSize: 14,
    color: lightColors.mutedForeground,
    fontStyle: 'italic',
  },
  teamPlayers: {
    fontSize: 14,
    color: lightColors.mutedForeground,
    fontWeight: '500',
  },
  teamArrowContainer: {
    marginLeft: 16,
    padding: 8,
  },
  teamArrow: {
    fontSize: 16,
    color: lightColors.primary, // #e40145
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    textAlign: 'center',
  },
});