// app/(auth)/auth.tsx
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { lightColors } from '../../src/styles/colors';
import { RegisterPlayerRequest } from '../../src/types/auth';

type AuthMode = 'login' | 'register';

export default function UnifiedAuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const toggleSlideAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const { setAuth, fetchAndUpdateProfile } = useAuthStore();

  // Animáció induláskor
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleModeSwitch = (newMode: AuthMode) => {
    if (newMode === mode) return;
    Animated.sequence([
      Animated.timing(toggleSlideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      Animated.timing(toggleSlideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    setMode(newMode);
    setEmail('');
    setPassword('');
    setRegEmail('');
    setRegPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setBirthDate(null);
    setWeight('');
    setHeight('');
    setEmailExists(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateLoginForm = () => {
    if (!email.trim() || !password) {
      Alert.alert('Hiányzó adatok', 'Kérlek töltsd ki az email és jelszó mezőket');
      return false;
    }
    if (!validateEmail(email)) {
      Alert.alert('Hibás email', 'Kérlek adj meg érvényes email címet');
      return false;
    }
    return true;
  };

  const validateRegistrationForm = () => {
    if (!regEmail.trim()) {
      Alert.alert('Hiányzó email', 'Kérlek adj meg email címet');
      return false;
    }
    if (!validateEmail(regEmail)) {
      Alert.alert('Hibás email', 'Kérlek adj meg érvényes email címet');
      return false;
    }
    if (!regPassword || regPassword.length < 6) {
      Alert.alert('Gyenge jelszó', 'A jelszónak legalább 6 karakter hosszúnak kell lennie');
      return false;
    }
    if (regPassword !== confirmPassword) {
      Alert.alert('Jelszavak nem egyeznek', 'A két jelszó nem egyezik meg. Kérlek ellenőrizd!');
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Hiányzó név', 'Kérlek töltsd ki a keresztnevet és vezetéknevet');
      return false;
    }
    return true;
  };

  // Email ellenőrzés a regisztráció során
  const handleCheckEmail = async (): Promise<boolean> => {
    try {
      const response = await AuthAPI.checkEmail({ Email: regEmail.trim() });
      setEmailExists(response.exists);

      if (!response.exists) {
        Alert.alert(
          'Email nem található',
          response.message ??
            'Ez az email cím nem szerepel a rendszerben. Kérlek vedd fel a kapcsolatot az edződdel.'
        );
        return false;
      }

      if (response.hasAccount) {
        Alert.alert(
          'Már regisztráltál',
          'Ezzel az email címmel már létezik fiók. Kérlek jelentkezz be.'
        );
        return false;
      }

      return true;
    } catch (err: any) {
      let userMessage = 'Ismeretlen hiba történt';
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          userMessage = parsed.message ?? data;
        } catch {
          userMessage = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else if (err instanceof Error) {
        userMessage = err.message;
      }
      Alert.alert('Email ellenőrzési hiba', userMessage);
      return false;
    }
  };

  // Login
  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setIsLoading(true);
    try {
      const resp = await AuthAPI.loginPlayer({ Email: email.trim(), Password: password });
      await setAuth(resp.token, resp.player);
      await fetchAndUpdateProfile();
      Alert.alert('Sikeres bejelentkezés!', `Üdv ${resp.player.FirstName}!`);
      router.replace('/(tabs)');
    } catch (err: any) {
      let userMessage = 'Ismeretlen hiba történt';
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          userMessage = parsed.message ?? data;
        } catch {
          userMessage = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else if (err instanceof Error) {
        userMessage = err.message;
      }
      Alert.alert('Bejelentkezési hiba', userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Regisztráció – először email ellenőrzés, majd regisztráció
  const handleRegister = async () => {
    if (!validateRegistrationForm()) return;

    setIsLoading(true);
    try {
      // Először ellenőrizzük az emailt
      const emailValid = await handleCheckEmail();
      if (!emailValid) {
        setIsLoading(false);
        return;
      }

      // Ha az email valid, folytatjuk a regisztrációt
      const registrationData: RegisterPlayerRequest = {
        Email: regEmail.trim().toLowerCase(),
        Password: regPassword,
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        BirthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
        Weight: weight ? parseFloat(weight) : undefined,
        Height: height ? parseFloat(height) : undefined,
      };

      await AuthAPI.registerPlayer(registrationData);

      Alert.alert('Sikeres regisztráció! 🎉', 'Most már bejelentkezhetsz.', [
        {
          text: 'Rendben',
          onPress: () => {
            setMode('login');
            setEmail(regEmail);
            setRegEmail('');
            setRegPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setBirthDate(null);
            setWeight('');
            setHeight('');
            setEmailExists(false);
          },
        },
      ]);
    } catch (err: any) {
      let userMessage = 'Ismeretlen hiba történt';
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          userMessage = parsed.message ?? data;
        } catch {
          userMessage = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else if (err instanceof Error) {
        userMessage = err.message;
      }
      Alert.alert('Regisztrációs hiba', userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const isLogin = mode === 'login';

  // JSX – amit küldtél, csak most már biztosan az új logikával dolgozik
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <View style={styles.icon} />
                <View style={styles.iconInner} />
              </View>
              <Text style={styles.title}>Coachify</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Üdv újra!' : 'Regisztráció'}
              </Text>
            </View>

            {/* Auth Mode Toggle */}
            <Animated.View style={[styles.toggleContainer, { transform: [{ translateY: toggleSlideAnim }] }]}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => handleModeSwitch('login')}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Bejelentkezés</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => handleModeSwitch('register')}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Regisztráció</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formContainer, { transform: [{ translateY: toggleSlideAnim }] }]}>
              {/* Login Form */}
              {isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={[styles.input, { borderColor: email ? lightColors.ring : lightColors.border }]}
                      placeholder="email@példa.com"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Jelszó</Text>
                    <TextInput
                      style={[styles.input, { borderColor: password ? lightColors.ring : lightColors.border }]}
                      placeholder="••••••••"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}

              {/* Registration Form - All fields at once */}
              {!isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Játékos email címed</Text>
                    <TextInput
                      style={[styles.input, { borderColor: regEmail ? lightColors.ring : lightColors.border }]}
                      placeholder="te@email.com"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <Text style={styles.helperText}>
                      Ugyanaz az email, amit az edződdel megosztottál.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Jelszó</Text>
                    <TextInput
                      style={[styles.input, { borderColor: regPassword ? lightColors.ring : lightColors.border }]}
                      placeholder="Minimum 6 karakter"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry
                      editable={!isLoading}
                    />
                    <Text style={styles.helperText}>
                      A jelszónak legalább 6 karakter hosszúnak kell lennie
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Jelszó megerősítése</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor:
                            confirmPassword && regPassword === confirmPassword
                              ? lightColors.ring
                              : confirmPassword && regPassword !== confirmPassword
                                ? '#ef4444'
                                : lightColors.border
                        }
                      ]}
                      placeholder="Erősítsd meg a jelszót"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      editable={!isLoading}
                    />
                    {confirmPassword && regPassword !== confirmPassword && (
                      <Text style={[styles.helperText, { color: '#ef4444' }]}>
                        A jelszavak nem egyeznek meg
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Keresztnév</Text>
                    <TextInput
                      style={[styles.input, { borderColor: firstName ? lightColors.ring : lightColors.border }]}
                      placeholder="Keresztnév"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Vezetéknév</Text>
                    <TextInput
                      style={[styles.input, { borderColor: lastName ? lightColors.ring : lightColors.border }]}
                      placeholder="Vezetéknév"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={lastName}
                      onChangeText={setLastName}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Születési dátum (opcionális)</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      disabled={isLoading}
                      style={[
                        styles.input,
                        styles.datePickerButton,
                        { borderColor: birthDate ? lightColors.ring : lightColors.border }
                      ]}
                    >
                      <Text
                        style={[
                          styles.datePickerText,
                          !birthDate && { color: lightColors.mutedForeground }
                        ]}
                      >
                        {birthDate
                          ? birthDate.toLocaleDateString('hu-HU', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })
                          : 'Válassz dátumot'}
                      </Text>
                    </TouchableOpacity>
                    {Platform.OS === 'ios' ? (
                      <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                      >
                        <View style={styles.datePickerModalContainer}>
                          <View style={styles.datePickerModalContent}>
                            <View style={styles.datePickerHeader}>
                              <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                                style={styles.datePickerCancelButton}
                              >
                                <Text style={styles.datePickerCancelText}>Mégse</Text>
                              </TouchableOpacity>
                              <Text style={styles.datePickerTitle}>Születési dátum</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setShowDatePicker(false);
                                }}
                                style={styles.datePickerDoneButton}
                              >
                                <Text style={styles.datePickerDoneText}>Kész</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.datePickerWrapper}>
                              <DateTimePicker
                                value={birthDate || new Date()}
                                mode="date"
                                display="spinner"
                                onChange={(event, selectedDate) => {
                                  if (selectedDate) {
                                    setBirthDate(selectedDate);
                                  }
                                }}
                                maximumDate={new Date()}
                                locale="hu-HU"
                                textColor={lightColors.foreground}
                                themeVariant="light"
                                style={styles.datePickerIOS}
                              />
                            </View>
                          </View>
                        </View>
                      </Modal>
                    ) : (
                      showDatePicker && (
                        <DateTimePicker
                          value={birthDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (event.type === 'set' && selectedDate) {
                              setBirthDate(selectedDate);
                            }
                          }}
                          maximumDate={new Date()}
                          locale="hu-HU"
                        />
                      )
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Súly kg (opcionális)</Text>
                    <TextInput
                      style={[styles.input, { borderColor: weight ? lightColors.ring : lightColors.border }]}
                      placeholder="70"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Magasság cm (opcionális)</Text>
                    <TextInput
                      style={[styles.input, { borderColor: height ? lightColors.ring : lightColors.border }]}
                      placeholder="175"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.buttonLoading]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={lightColors.primaryForeground} size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Bejelentkezés' : 'Fiók létrehozása'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.statusText}>{__DEV__ ? 'Development' : 'Production'}</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles változatlanul mehet ugyanúgy, mint nálad
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
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
  icon: {
    position: 'absolute',
    width: 64,
    height: 64,
    backgroundColor: lightColors.primary,
    borderRadius: 8,
  },
  iconInner: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: lightColors.primaryForeground,
    borderRadius: 2,
    top: 24,
    left: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: lightColors.foreground,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    fontWeight: '400',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: lightColors.muted,
    borderRadius: 8,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: lightColors.background,
    shadowColor: lightColors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: lightColors.mutedForeground,
  },
  toggleTextActive: {
    color: lightColors.foreground,
    fontWeight: '600',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: lightColors.foreground,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: lightColors.background,
    color: lightColors.foreground,
  },
  datePickerButton: {
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: lightColors.foreground,
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModalContent: {
    backgroundColor: lightColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: lightColors.mutedForeground,
    fontWeight: '500',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: lightColors.foreground,
  },
  datePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: lightColors.primary,
    fontWeight: '600',
  },
  datePickerWrapper: {
    backgroundColor: lightColors.background,
    paddingVertical: 10,
  },
  datePickerIOS: {
    width: '100%',
    height: 200,
  },
  helperText: {
    fontSize: 12,
    color: lightColors.mutedForeground,
    marginTop: 4,
  },
  submitButton: {
    height: 44,
    backgroundColor: lightColors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonLoading: { opacity: 0.7 },
  buttonText: {
    color: lightColors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    textAlign: 'center',
    color: lightColors.mutedForeground,
    fontSize: 12,
    marginTop: 32,
    opacity: 0.6,
  },
});
