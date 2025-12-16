// app/(tabs)/trainings.tsx - Trainings page
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { Header, LogoutButton } from '../../src/components';
import { useAuthStore } from '../../src/stores/authStore';
import { lightColors } from '../../src/styles/colors';

// Inline types
interface TrainingPlanData {
  Id: number;
  Name: string;
  Description: string;
  Date: string;
  StartTime?: string;
  EndTime?: string;
  AthleteId?: number;
  AthleteName?: string;
  TeamId?: number;
  TeamName?: string;
}

// Inline utils
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

const formatTimeDisplay = (startTime?: string, endTime?: string) => {
  if (!startTime && !endTime) return '';
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return `${startTime}-tól`;
  return `${endTime}-ig`;
};

export default function TrainingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { player, logout } = useAuthStore();

  // Inline API loading
  const [apiAvailable, setApiAvailable] = useState(false);
  const [PlayerAPI, setPlayerAPI] = useState<any>(null);

  const [trainingPlans, setTrainingPlans] = useState<TrainingPlanData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { FirstName: firstName } = player || {};
  
  // Get team info from params if navigated from teams page
  const teamId = params.teamId ? parseInt(params.teamId as string) : undefined;
  const teamName = params.teamName as string;

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
      fetchTrainingPlans();
    }
  }, [apiAvailable, teamId]);

  const fetchTrainingPlans = async () => {
    if (!PlayerAPI) {
      Alert.alert('Hiba', 'API nem elérhető');
      return;
    }

    setLoading(true);
    try {
      let trainingData: TrainingPlanData[];
      if (teamId) {
        trainingData = await PlayerAPI.getTeamTrainingPlans(teamId);
      } else {
        trainingData = await PlayerAPI.getTrainingPlans();
      }
      setTrainingPlans(trainingData || []);
    } catch (error) {
      console.error('Error fetching training plans:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni az edzésterveket');
      setTrainingPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!apiAvailable) return;

    setRefreshing(true);
    try {
      await fetchTrainingPlans();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };


  const handleBackToTeams = () => {
    router.back();
  };

  if (!apiAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Header 
            title="Edzések" 
            subtitle={`Üdv, ${firstName || 'User'}! 👋`}
          />

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Az edzések funkció hamarosan elérhető lesz
            </Text>
          </View>

          <LogoutButton onLogout={logout} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Header 
          title="Edzések" 
          subtitle={`Üdv, ${firstName || 'User'}! 👋`}
        />

        {/* Training Plans Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {teamName ? `${teamName} edzései` : 'Edzésterveim'}
              </Text>
              {teamName && (
                <TouchableOpacity onPress={handleBackToTeams}>
                  <Text style={styles.backText}>← Vissza a csapatokhoz</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => fetchTrainingPlans()}>
              <Text style={styles.refreshText}>🔄</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={lightColors.primary} />
            </View>
          ) : trainingPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {teamName ? 'Ennek a csapatnak még nincsenek edzéstervei' : 'Még nincsenek edzésterveid'}
              </Text>
            </View>
          ) : (
            <View style={styles.trainingPlansContainer}>
              {trainingPlans.map((plan) => (
                <View key={plan.Id} style={styles.trainingCard}>
                  <View style={styles.trainingHeader}>
                    <Text style={styles.trainingName}>{plan.Name}</Text>
                    <Text style={styles.trainingDate}>{formatDate(plan.Date)}</Text>
                  </View>
                  
                  <Text style={styles.trainingDescription}>{plan.Description}</Text>
                  
                  <View style={styles.trainingDetails}>
                    {formatTimeDisplay(plan.StartTime, plan.EndTime) && (
                      <Text style={styles.trainingTime}>
                        🕐 {formatTimeDisplay(plan.StartTime, plan.EndTime)}
                      </Text>
                    )}
                    
                    {plan.TeamName && !teamName && (
                      <Text style={styles.trainingTeam}>🏆 {plan.TeamName}</Text>
                    )}
                    
                    {plan.AthleteName && (
                      <Text style={styles.trainingAthlete}>👤 {plan.AthleteName}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Logout Button */}
        <LogoutButton onLogout={logout} />
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
    fontSize: 18,
    fontWeight: '600',
    color: lightColors.foreground,
    letterSpacing: 0.1,
  },
  refreshText: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    textAlign: 'center',
  },
  backText: {
    fontSize: 14,
    color: lightColors.mutedForeground,
    marginTop: 4,
  },
  trainingPlansContainer: {
    gap: 16,
  },
  trainingCard: {
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
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trainingName: {
    fontSize: 16,
    fontWeight: '600',
    color: lightColors.foreground,
    flex: 1,
    marginRight: 16,
  },
  trainingDate: {
    fontSize: 14,
    color: lightColors.mutedForeground,
    fontWeight: '500',
  },
  trainingDescription: {
    fontSize: 14,
    color: lightColors.mutedForeground,
    marginBottom: 12,
    lineHeight: 20,
  },
  trainingDetails: {
    gap: 4,
  },
  trainingTime: {
    fontSize: 13,
    color: lightColors.mutedForeground,
  },
  trainingTeam: {
    fontSize: 13,
    color: lightColors.mutedForeground,
  },
  trainingAthlete: {
    fontSize: 13,
    color: lightColors.mutedForeground,
  },
});