import { Header, SliderRow } from "@/src/components";
import { createTodayWellnessCheck, getTodayWellnessCheck } from "@/src/services/wellness";
import { darkColors, lightColors } from "@/src/styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
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
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WellnessScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Betöltés...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const disabled = submitted;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header 
          title="Wellness" 
          subtitle="Napi wellness értékelés"
        />

        {/* Status Message */}
        {submitted && (
          <View style={[styles.statusCard, { backgroundColor: '#d1fae5' }]}>
            <View style={styles.statusCardContent}>
              <MaterialIcons name="check-circle" size={24} color="#10b981" />
              <Text style={[styles.statusText, { color: '#065f46' }]}>
                A mai napra már kitöltötted a kérdőívet. Az értékeket megtekintheted.
              </Text>
            </View>
          </View>
        )}

        {/* Wellness Metrics Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Wellness értékelés</Text>
          <View style={[styles.metricsCard, { backgroundColor: colors.card }]}>
            <SliderRow label="Fáradtság" value={fatigue} onChange={setFatigue} disabled={disabled} />
            <View style={styles.divider} />
            <SliderRow label="Alvás minősége" value={sleepQuality} onChange={setSleepQuality} disabled={disabled} />
            <View style={styles.divider} />
            <SliderRow label="Izomláz" value={muscleSoreness} onChange={setMuscleSoreness} disabled={disabled} />
            <View style={styles.divider} />
            <SliderRow label="Stressz" value={stress} onChange={setStress} disabled={disabled} />
            <View style={styles.divider} />
            <SliderRow label="Hangulat" value={mood} onChange={setMood} disabled={disabled} />
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Megjegyzés</Text>
          <View style={[styles.commentCard, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.foreground }]}
              value={comment}
              editable={!disabled}
              multiline
              placeholder="Opcionális megjegyzés..."
              placeholderTextColor={colors.mutedForeground}
              onChangeText={setComment}
            />
          </View>
        </View>

        {/* Submit Button */}
        {!submitted && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  statusCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
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
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  metricsCard: {
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 16,
  },
  commentCard: {
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
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
  commentInput: {
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
