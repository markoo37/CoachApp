// app/(tabs)/teams.tsx - Teams page
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../../src/components';
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
          <Header 
            title="Csapatok" 
            subtitle={`Üdv, ${firstName || 'User'}! 👋`}
          />

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              A csapatok funkció hamarosan elérhető lesz
            </Text>
          </View>
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
        <Header 
          title="Csapatok" 
          subtitle={`Üdv, ${firstName || 'User'}! 👋`}
        />

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
    paddingBottom: 100,
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
  teamsContainer: {
    gap: 16,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 0.5,
    borderColor: lightColors.border,
    borderRadius: 12,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(142, 142, 147, 0.08)' : lightColors.card,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: 1,
    elevation: 0,
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