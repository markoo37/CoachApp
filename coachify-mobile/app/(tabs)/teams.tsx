// app/(tabs)/teams.tsx - Teams page
import { MaterialIcons } from '@expo/vector-icons';
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
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../../src/components';
import { useAuthStore } from '../../src/stores/authStore';
import { darkColors, lightColors } from '../../src/styles/colors';

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
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Header 
            title={firstName || 'User'} 
            subtitle="Csapatok"
          />

          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
              <MaterialIcons name="groups" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Még nincs csapatod</Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              A csapatok funkció hamarosan elérhető lesz
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <Header 
          title={firstName || 'User'} 
          subtitle="Csapatok"
        />

        {/* Teams Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Csapataim</Text>
            <TouchableOpacity 
              onPress={() => fetchTeams()}
              style={styles.refreshButton}
            >
              <MaterialIcons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Csapatok betöltése...</Text>
            </View>
          ) : teams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
                <MaterialIcons name="groups" size={48} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Még nincs csapatod</Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                Várj, amíg egy edző hozzáad téged egy csapathoz
              </Text>
            </View>
          ) : (
            <View style={styles.teamsContainer}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.Id}
                  style={[styles.teamCard, { backgroundColor: colors.card }]}
                  onPress={() => handleTeamPress(team)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.teamIcon, { backgroundColor: '#f3e8ff' }]}>
                    <MaterialIcons name="groups" size={28} color="#8b5cf6" />
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, { color: colors.foreground }]}>{team.Name}</Text>
                    <View style={styles.teamDetails}>
                      <View style={styles.teamDetailRow}>
                        <MaterialIcons name="person" size={16} color={colors.mutedForeground} />
                        <Text style={[styles.teamDetailText, { color: colors.mutedForeground }]}>
                          {team.Coach.FirstName} {team.Coach.LastName}
                        </Text>
                      </View>
                      <View style={styles.teamDetailRow}>
                        <MaterialIcons name="people" size={16} color={colors.mutedForeground} />
                        <Text style={[styles.teamDetailText, { color: colors.mutedForeground }]}>
                          {team.PlayerCount} játékos
                        </Text>
                      </View>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.mutedForeground} />
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
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  teamsContainer: {
    gap: 12,
  },
  teamCard: {
    flexDirection: 'row',
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
  teamIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  teamDetails: {
    gap: 6,
  },
  teamDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamDetailText: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});