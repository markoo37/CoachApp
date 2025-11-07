// app/(auth)/auth.tsx
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { lightColors } from '../../src/styles/colors';
import { RegisterPlayerRequest } from '../../src/types/auth';

type AuthMode = 'login' | 'register';
type RegisterStep = 'email' | 'profile';

export default function UnifiedAuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const toggleSlideAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const { setAuth, fetchAndUpdateProfile } = useAuthStore();

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
    setRegisterStep('email');
    setEmail('');
    setPassword('');
    setRegEmail('');
    setRegPassword('');
    setFirstName('');
    setLastName('');
    setBirthDate('');
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
    if (registerStep === 'email') {
      if (!regEmail.trim()) {
        Alert.alert('Hiányzó email', 'Kérlek adj meg email címet');
        return false;
      }
      if (!validateEmail(regEmail)) {
        Alert.alert('Hibás email', 'Kérlek adj meg érvényes email címet');
        return false;
      }
      return true;
    } else {
      // Profile step validation
      if (!regPassword || regPassword.length < 6) {
        Alert.alert('Gyenge jelszó', 'A jelszónak legalább 6 karakter hosszúnak kell lennie');
        return false;
      }
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert('Hiányzó név', 'Kérlek töltsd ki a keresztnevet és vezetéknevet');
        return false;
      }
      return true;
    }
  };

  const handleCheckEmail = async () => {
    if (!validateRegistrationForm()) return;
    
    setIsLoading(true);
    try {
      const response = await AuthAPI.checkEmail({ Email: regEmail.trim() });
      setEmailExists(response.exists);
      
      if (response.exists) {
        setRegisterStep('profile');
        Alert.alert(
          'Email megtalálva!', 
          'Ez az email cím már szerepel a rendszerben. Kérlek töltsd ki a profil adataidat.',
          [{ text: 'Rendben', onPress: () => {} }]
        );
      } else {
        Alert.alert(
          'Email nem található', 
          'Ez az email cím nem szerepel a rendszerben. Kérlek vedd fel a kapcsolatot az edződdel.',
          [{ text: 'Rendben', onPress: () => {} }]
        );
      }
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    
    setIsLoading(true);
    try {
      const resp = await AuthAPI.loginPlayer({ Email: email.trim(), Password: password });
      await setAuth(resp.token, resp.player);
      
      // Fetch full profile after successful login
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

  const handleRegister = async () => {
    if (!validateRegistrationForm()) return;
    
    setIsLoading(true);
    try {
      const registrationData: RegisterPlayerRequest = {
        Email: regEmail.trim().toLowerCase(),
        Password: regPassword,
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        BirthDate: birthDate || undefined,
        Weight: weight ? parseFloat(weight) : undefined,
        Height: height ? parseFloat(height) : undefined,
      };

      await AuthAPI.registerPlayer(registrationData);
      
      Alert.alert('Sikeres regisztráció! 🎉', 'Most már bejelentkezhetsz.', [
        { text: 'Rendben', onPress: () => {
          setMode('login');
          setEmail(regEmail);
          setRegisterStep('email');
          setRegEmail('');
          setRegPassword('');
          setFirstName('');
          setLastName('');
          setBirthDate('');
          setWeight('');
          setHeight('');
          setEmailExists(false);
        }},
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
      if (registerStep === 'email') {
        handleCheckEmail();
      } else {
        handleRegister();
      }
    }
  };

  const handleBackToEmail = () => {
    setRegisterStep('email');
    setRegPassword('');
    setFirstName('');
    setLastName('');
    setBirthDate('');
    setWeight('');
    setHeight('');
  };

  const isLogin = mode === 'login';
  const isEmailStep = registerStep === 'email';

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
                {isLogin ? 'Üdv újra!' : (isEmailStep ? 'Regisztráció' : 'Profil adatok')}
              </Text>
            </View>

            {/* Auth Mode Toggle - only show in email step or login */}
            {(isLogin || isEmailStep) && (
              <Animated.View style={[styles.toggleContainer, { transform: [{ translateY: toggleSlideAnim }] }]}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                  onPress={() => handleModeSwitch('login')}
                >
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                    Bejelentkezés
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                  onPress={() => handleModeSwitch('register')}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                    Regisztráció
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Back button for profile step */}
            {!isLogin && !isEmailStep && (
              <TouchableOpacity style={styles.backButton} onPress={handleBackToEmail}>
                <Text style={styles.backButtonText}>← Vissza az emailhez</Text>
              </TouchableOpacity>
            )}

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

              {/* Registration Email Step */}
              {!isLogin && isEmailStep && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email cím</Text>
                  <TextInput
                    style={[styles.input, { borderColor: regEmail ? lightColors.ring : lightColors.border }]}
                    placeholder="email@példa.com"
                    placeholderTextColor={lightColors.mutedForeground}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <Text style={styles.helperText}>
                    Add meg az email címed, amit az edződdel megosztottál
                  </Text>
                </View>
              )}

              {/* Registration Profile Step */}
              {!isLogin && !isEmailStep && (
                <>
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
                    <TextInput
                      style={[styles.input, { borderColor: birthDate ? lightColors.ring : lightColors.border }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={lightColors.mutedForeground}
                      value={birthDate}
                      onChangeText={setBirthDate}
                      editable={!isLoading}
                    />
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
                    {isLogin ? 'Bejelentkezés' : (isEmailStep ? 'Email ellenőrzése' : 'Fiók létrehozása')}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Status */}
            <Text style={styles.statusText}>
              {__DEV__ ? 'Development' : 'Production'}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1 
  },

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

  // Header Styles
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

  // Back Button
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },

  backButtonText: {
    fontSize: 14,
    color: lightColors.primary,
    fontWeight: '500',
  },

  // Toggle Styles
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

  // Form Styles
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
  
  buttonLoading: { 
    opacity: 0.7 
  },
  
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