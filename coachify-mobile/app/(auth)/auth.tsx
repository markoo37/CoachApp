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
import { Ionicons } from '@expo/vector-icons';
import { NumberInput } from '../../src/components';
import { AuthAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { darkColors as lightColors } from '../../src/styles/colors';
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
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('175');
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formFadeAnim = useRef(new Animated.Value(1)).current;

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
    
    // Simple fade animation - fade out, switch mode, fade in
    Animated.sequence([
      Animated.timing(formFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animation value for next switch
      formFadeAnim.setValue(1);
    });
    
    // Switch mode in the middle of animation (when opacity is 0)
    setTimeout(() => {
      setMode(newMode);
      setEmail('');
      setPassword('');
      setRegEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setBirthDate(null);
      setWeight('70');
      setHeight('175');
      setEmailExists(false);
    }, 150);
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
            setWeight('70');
            setHeight('175');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>
                {isLogin ? 'Üdv újra!' : 'Kezdjük el!'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isLogin ? 'Jelentkezz be a fiókodba' : 'Hozd létre a fiókodat'}
              </Text>
            </View>

            {/* Auth Mode Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => handleModeSwitch('register')}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Regisztráció</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => handleModeSwitch('login')}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Bejelentkezés</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.formWrapper}>
              <Animated.View style={[styles.formContainer, { opacity: formFadeAnim }]}>
                {/* Login Form */}
                {isLogin && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputWithIcon}
                          placeholder="email@példa.com"
                          placeholderTextColor={lightColors.mutedForeground}
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          editable={!isLoading}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Jelszó</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputWithIcon}
                          placeholder="••••••••"
                          placeholderTextColor={lightColors.mutedForeground}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          editable={!isLoading}
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>Elfelejtetted a jelszót?</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Registration Form - All fields at once */}
                {!isLogin && (
                <>
                  <View style={styles.nameRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Keresztnév</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputWithIcon}
                          placeholder="Keresztnév"
                          placeholderTextColor={lightColors.mutedForeground}
                          value={firstName}
                          onChangeText={setFirstName}
                          editable={!isLoading}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Vezetéknév</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputWithIcon}
                          placeholder="Vezetéknév"
                          placeholderTextColor={lightColors.mutedForeground}
                          value={lastName}
                          onChangeText={setLastName}
                          editable={!isLoading}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="te@email.com"
                        placeholderTextColor={lightColors.mutedForeground}
                        value={regEmail}
                        onChangeText={setRegEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Ugyanaz az email, amit az edződdel megosztottál.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Jelszó</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Minimum 6 karakter"
                        placeholderTextColor={lightColors.mutedForeground}
                        value={regPassword}
                        onChangeText={setRegPassword}
                        secureTextEntry
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Jelszó megerősítése</Text>
                    <View style={[
                      styles.inputWrapper,
                      confirmPassword && regPassword !== confirmPassword && styles.inputWrapperError
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Erősítsd meg a jelszót"
                        placeholderTextColor={lightColors.mutedForeground}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        editable={!isLoading}
                      />
                    </View>
                    {confirmPassword && regPassword !== confirmPassword && (
                      <Text style={[styles.helperText, { color: '#ef4444' }]}>
                        A jelszavak nem egyeznek meg
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Születési dátum (opcionális)</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      disabled={isLoading}
                      style={styles.inputWrapper}
                    >
                      <Ionicons name="calendar-outline" size={20} color={lightColors.mutedForeground} style={styles.inputIcon} />
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
                                display="inline"
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

                  <View style={styles.sliderStack}>
                    <NumberInput
                      label="Súly (opcionális)"
                      value={weight}
                      onChange={setWeight}
                      unit="kg"
                      min={30}
                      max={200}
                      defaultValue={70}
                      customValueTitle="Súly megadása"
                      customValueMessage="Add meg a súlyt kilogrammban:"
                      customValueError="A súly 30-200 kg között lehet"
                      disabled={isLoading}
                    />
                    <NumberInput
                      label="Magasság (opcionális)"
                      value={height}
                      onChange={setHeight}
                      unit="cm"
                      min={100}
                      max={250}
                      defaultValue={175}
                      customValueTitle="Magasság megadása"
                      customValueMessage="Add meg a magasságot centiméterben:"
                      customValueError="A magasság 100-250 cm között lehet"
                      disabled={isLoading}
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
                    {isLogin ? 'Bejelentkezés' : 'Regisztráció'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Switch mode link */}
              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>
                  {isLogin ? 'Nincs még fiókod? ' : 'Már van fiókod? '}
                </Text>
                <TouchableOpacity onPress={() => handleModeSwitch(isLogin ? 'register' : 'login')}>
                  <Text style={styles.switchModeLink}>
                    {isLogin ? 'Regisztrálj!' : 'Jelentkezz be!'}
                  </Text>
                </TouchableOpacity>
              </View>
              </Animated.View>
            </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  content: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: lightColors.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightColors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: lightColors.foreground,
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: lightColors.mutedForeground,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: lightColors.secondary,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
  },
  toggleButtonActive: {
    backgroundColor: lightColors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: lightColors.mutedForeground,
  },
  toggleTextActive: {
    color: lightColors.primaryForeground,
  },
  formWrapper: {
    minHeight: 0,
  },
  formContainer: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sliderStack: {
    gap: 24,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: lightColors.foreground,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightColors.border,
    borderRadius: 16,
    backgroundColor: lightColors.secondary,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: lightColors.foreground,
    paddingRight: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: lightColors.primary,
    fontWeight: '500',
  },
  datePickerText: {
    fontSize: 16,
    color: lightColors.foreground,
    flex: 1,
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  datePickerModalContent: {
    backgroundColor: lightColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerIOS: {
    width: '100%',
    height: 330,
  },
  helperText: {
    fontSize: 12,
    color: lightColors.mutedForeground,
    marginTop: 4,
  },
  submitButton: {
    height: 56,
    backgroundColor: lightColors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: lightColors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonLoading: { 
    opacity: 0.7,
  },
  buttonText: {
    color: lightColors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchModeText: {
    fontSize: 14,
    color: lightColors.mutedForeground,
  },
  switchModeLink: {
    fontSize: 14,
    color: lightColors.primary,
    fontWeight: '600',
  },
});
