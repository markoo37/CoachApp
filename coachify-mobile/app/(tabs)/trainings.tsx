// app/(tabs)/trainings.tsx - Trainings page
import { MaterialIcons } from '@expo/vector-icons';
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
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../../src/components';
import { useAuthStore } from '../../src/stores/authStore';
import { darkColors, lightColors } from '../../src/styles/colors';

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
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Header 
            title={firstName || 'User'} 
            subtitle="Edzések"
          />

          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
              <MaterialIcons name="fitness-center" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Még nincsenek edzések</Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Az edzések funkció hamarosan elérhető lesz
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
          subtitle={teamName ? `${teamName} edzései` : 'Edzések'}
        />

        {/* Training Plans Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {teamName ? `${teamName} edzései` : 'Edzésterveim'}
              </Text>
              {teamName && (
                <TouchableOpacity onPress={handleBackToTeams} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={16} color={colors.primary} />
                  <Text style={[styles.backText, { color: colors.primary }]}>Vissza a csapatokhoz</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => fetchTrainingPlans()} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : trainingPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
                <MaterialIcons name="fitness-center" size={48} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {teamName ? 'Ennek a csapatnak még nincsenek edzéstervei' : 'Még nincsenek edzésterveid'}
              </Text>
            </View>
          ) : (
            <View style={styles.trainingPlansContainer}>
              {trainingPlans.map((plan) => (
                <View key={plan.Id} style={[styles.trainingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.trainingHeader}>
                    <View style={styles.trainingHeaderLeft}>
                      <View style={[styles.trainingIconContainer, { backgroundColor: '#fef3c7' }]}>
                        <MaterialIcons name="fitness-center" size={24} color="#f59e0b" />
                      </View>
                      <View style={styles.trainingTitleContainer}>
                        <Text style={[styles.trainingName, { color: colors.foreground }]}>{plan.Name}</Text>
                        <Text style={[styles.trainingDate, { color: colors.mutedForeground }]}>
                          {formatDate(plan.Date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {plan.Description && (
                    <Text style={[styles.trainingDescription, { color: colors.mutedForeground }]}>
                      {plan.Description}
                    </Text>
                  )}
                  
                  <View style={styles.trainingDetails}>
                    {formatTimeDisplay(plan.StartTime, plan.EndTime) && (
                      <View style={styles.trainingDetailRow}>
                        <MaterialIcons name="schedule" size={18} color={colors.mutedForeground} />
                        <Text style={[styles.trainingDetailText, { color: colors.mutedForeground }]}>
                          {formatTimeDisplay(plan.StartTime, plan.EndTime)}
                        </Text>
                      </View>
                    )}
                    
                    {plan.TeamName && !teamName && (
                      <View style={styles.trainingDetailRow}>
                        <MaterialIcons name="groups" size={18} color={colors.mutedForeground} />
                        <Text style={[styles.trainingDetailText, { color: colors.mutedForeground }]}>
                          {plan.TeamName}
                        </Text>
                      </View>
                    )}
                    
                    {plan.AthleteName && (
                      <View style={styles.trainingDetailRow}>
                        <MaterialIcons name="person" size={18} color={colors.mutedForeground} />
                        <Text style={[styles.trainingDetailText, { color: colors.mutedForeground }]}>
                          {plan.AthleteName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
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
    alignItems: 'flex-start',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  trainingPlansContainer: {
    gap: 12,
  },
  trainingCard: {
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
  trainingHeader: {
    marginBottom: 12,
  },
  trainingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trainingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingTitleContainer: {
    flex: 1,
  },
  trainingName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  trainingDate: {
    fontSize: 14,
    fontWeight: '400',
  },
  trainingDescription: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
  },
  trainingDetails: {
    gap: 10,
    marginTop: 4,
  },
  trainingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainingDetailText: {
    fontSize: 14,
    fontWeight: '400',
  },
  trainingTime: {
    fontSize: 13,
  },
  trainingTeam: {
    fontSize: 13,
  },
  trainingAthlete: {
    fontSize: 13,
  },
});