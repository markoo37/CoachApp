import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
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
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconSquare} />
            <View style={[styles.iconSquare, styles.iconSquareSmall]} />
          </View>
          <Text style={styles.title}>Napi wellness check</Text>
          <Text style={styles.subtitle}>
            Töltsd ki a mai wellness értékelésedet
          </Text>
        </View>

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

function SliderRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}/10</Text>
      </View>
      <Slider
        value={value}
        minimumValue={1}
        maximumValue={10}
        step={1}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={lightColors.primary}
        maximumTrackTintColor={lightColors.border}
        thumbTintColor={lightColors.primary}
        style={styles.slider}
      />
      <View style={styles.sliderRange}>
        <Text style={styles.sliderRangeText}>1</Text>
        <Text style={styles.sliderRangeText}>10</Text>
      </View>
    </View>
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
    paddingBottom: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    position: "relative",
    width: 64,
    height: 64,
    marginBottom: 24,
  },
  iconSquare: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: lightColors.primary,
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
    fontWeight: "700",
    color: lightColors.foreground,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    fontWeight: "400",
  },
  statusCard: {
    padding: 16,
    backgroundColor: lightColors.muted,
    borderRadius: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: lightColors.border,
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
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    backgroundColor: lightColors.card,
    gap: 24,
  },
  sliderRow: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: lightColors.foreground,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "600",
    color: lightColors.primary,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderRange: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderRangeText: {
    fontSize: 12,
    color: lightColors.mutedForeground,
  },
  commentCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    backgroundColor: lightColors.card,
  },
  commentInput: {
    minHeight: 100,
    fontSize: 16,
    color: lightColors.foreground,
    textAlignVertical: "top",
  },
  submitButton: {
    height: 56,
    backgroundColor: lightColors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: lightColors.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
