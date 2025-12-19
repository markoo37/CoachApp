import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header, LogoutButton, SliderRow } from "@/src/components";
import { getTodayWellnessCheck, createTodayWellnessCheck } from "@/src/services/wellness";
import { lightColors } from "@/src/styles/colors";

export default function WellnessScreen() {
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const [fatigue, setFatigue] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState(5);
  const [stress, setStress] = useState(5);
  const [mood, setMood] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getTodayWellnessCheck();

        if (data) {
          setSubmitted(true);
          // Note: The API response doesn't include the wellness values,
          // only metadata. You may need to fetch the full check separately
          // or update the API response structure
        }
      } catch (err) {
        console.error("Error loading wellness check", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    try {
      await createTodayWellnessCheck({
        fatigue,
        sleepQuality,
        muscleSoreness,
        stress,
        mood,
        comment,
      });

      setSubmitted(true);
      Alert.alert("Sikeres mentés", "A mai wellness check elmentve.");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Hiba", err?.response?.data?.message ?? "Hiba történt.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightColors.primary} />
          <Text style={styles.loadingText}>Betöltés...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const disabled = submitted;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header 
          title="Napi wellness check" 
          subtitle="Töltsd ki a mai wellness értékelésedet"
        />

        {/* Status Message */}
        {submitted && (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              ✓ A mai napra már kitöltötted a kérdőívet. Az értékeket megtekintheted.
            </Text>
          </View>
        )}

        {/* Wellness Metrics Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Wellness értékelés</Text>
          <View style={styles.metricsCard}>
            <SliderRow label="Fáradtság" value={fatigue} onChange={setFatigue} disabled={disabled} />
            <SliderRow label="Alvás minősége" value={sleepQuality} onChange={setSleepQuality} disabled={disabled} />
            <SliderRow label="Izomláz" value={muscleSoreness} onChange={setMuscleSoreness} disabled={disabled} />
            <SliderRow label="Stressz" value={stress} onChange={setStress} disabled={disabled} />
            <SliderRow label="Hangulat" value={mood} onChange={setMood} disabled={disabled} />
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Megjegyzés</Text>
          <View style={styles.commentCard}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              editable={!disabled}
              multiline
              placeholder="Opcionális megjegyzés..."
              placeholderTextColor={lightColors.mutedForeground}
              onChangeText={setComment}
            />
          </View>
        </View>

        {/* Submit Button */}
        {!submitted && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Mentés</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 100,
  },
  statusCard: {
    padding: 16,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(142, 142, 147, 0.08)' : lightColors.muted,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 0.5,
    borderColor: lightColors.border,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: 1,
    elevation: 0,
  },
  statusText: {
    fontSize: 14,
    color: lightColors.foreground,
    fontWeight: "500",
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: lightColors.foreground,
    letterSpacing: 0.1,
    marginBottom: 16,
  },
  metricsCard: {
    padding: 24,
    borderWidth: 0.5,
    borderColor: lightColors.border,
    borderRadius: 12,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(142, 142, 147, 0.08)' : lightColors.card,
    gap: 24,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: 1,
    elevation: 0,
  },
  commentCard: {
    padding: 16,
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
  commentInput: {
    minHeight: 100,
    fontSize: 17,
    color: lightColors.foreground,
    textAlignVertical: "top",
  },
  submitButton: {
    height: 50,
    backgroundColor: lightColors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: lightColors.primaryForeground,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
