// src/components/NumberInput.tsx
import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../styles/colors';

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  customValueTitle: string;
  customValueMessage: string;
  customValueError: string;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  defaultValue,
  customValueTitle,
  customValueMessage,
  customValueError,
  disabled = false,
}: NumberInputProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const currentValue = parseFloat(value) || defaultValue;

  const handleCustomValue = () => {
    if (disabled) return;

    // Alert.prompt is iOS-only; keep iOS experience, provide a simple fallback on Android.
    if (Platform.OS === 'ios') {
      Alert.prompt(
        customValueTitle,
        customValueMessage,
        [
          { text: 'Mégse', style: 'cancel' },
          {
            text: 'OK',
            onPress: (text: string | undefined) => {
              const num = parseFloat(text || '');
              if (!isNaN(num) && num >= min && num <= max) {
                onChange(num.toString());
              } else if (text) {
                Alert.alert('Hibás érték', customValueError);
              }
            },
          },
        ],
        'plain-text',
        value || defaultValue.toString(),
        'numeric'
      );
      return;
    }

    Alert.alert(
      customValueTitle,
      `${customValueMessage}\n\n(Androidon egyelőre sliderrel állítható.)`
    );
  };

  return (
    <View style={styles.inputGroup}>
      <TouchableOpacity
        style={[styles.headerRow, disabled && styles.disabled]}
        onPress={handleCustomValue}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.labelColumn}>
          <View style={styles.labelTopRow}>
            <Text
              style={[styles.inputLabel, { color: colors.mutedForeground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label.toUpperCase()}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={18}
              color={colors.mutedForeground}
            />
          </View>
          <Text
            style={[styles.unitLabel, { color: colors.mutedForeground }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ({unit})
          </Text>
        </View>
        <Text style={[styles.valueText, { color: colors.foreground }]}>
          {Math.round(currentValue)}
        </Text>
      </TouchableOpacity>

      <Slider
        value={currentValue}
        minimumValue={min}
        maximumValue={max}
        step={1}
        onValueChange={(n) => onChange(Math.round(n).toString())}
        disabled={disabled}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  labelColumn: {
    flex: 1,
    paddingRight: 16,
  },
  labelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  unitLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 16,
    marginTop: 2,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    minWidth: 56,
    textAlign: 'right',
    marginLeft: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  disabled: {
    opacity: 0.6,
  },
});

