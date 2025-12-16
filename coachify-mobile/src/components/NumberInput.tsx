// src/components/NumberInput.tsx
import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { lightColors } from '../styles/colors';

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
  const currentValue = parseFloat(value) || defaultValue;
  const isMin = value && parseFloat(value) <= min;
  const isMax = value && parseFloat(value) >= max;

  const handleDecrement = () => {
    if (currentValue > min) {
      onChange((currentValue - 1).toString());
    }
  };

  const handleIncrement = () => {
    if (currentValue < max) {
      onChange((currentValue + 1).toString());
    }
  };

  const handleCustomValue = () => {
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
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.numberInputContainer}>
        <TouchableOpacity
          style={[styles.numberButton, isMin && styles.numberButtonDisabled]}
          onPress={handleDecrement}
          disabled={disabled || !!isMin}
        >
          <Text style={[styles.numberButtonText, isMin && styles.numberButtonTextDisabled]}>−</Text>
        </TouchableOpacity>
        <View style={styles.numberInputValue}>
          <Text style={styles.numberInputText}>{value || defaultValue.toString()}</Text>
          <Text style={styles.numberInputUnit}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={[styles.numberButton, isMax && styles.numberButtonDisabled]}
          onPress={handleIncrement}
          disabled={disabled || !!isMax}
        >
          <Text style={[styles.numberButtonText, isMax && styles.numberButtonTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.numberInputEditButton}
        onPress={handleCustomValue}
        disabled={disabled}
      >
        <Text style={styles.numberInputEditText}>Egyéni érték megadása</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderWidth: 0.5,
    borderColor: lightColors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(142, 142, 147, 0.08)' : lightColors.background,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: 1,
    elevation: 0,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: lightColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  numberButtonDisabled: {
    opacity: 0.3,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: lightColors.primary,
    lineHeight: 24,
  },
  numberButtonTextDisabled: {
    color: lightColors.mutedForeground,
  },
  numberInputValue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  numberInputText: {
    fontSize: 20,
    fontWeight: '600',
    color: lightColors.foreground,
  },
  numberInputUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: lightColors.mutedForeground,
  },
  numberInputEditButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  numberInputEditText: {
    fontSize: 14,
    fontWeight: '500',
    color: lightColors.primary,
  },
});

