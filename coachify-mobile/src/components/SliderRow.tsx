// src/components/SliderRow.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { lightColors } from '../styles/colors';

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}

export function SliderRow({ label, value, onChange, disabled }: SliderRowProps) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  sliderRow: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: lightColors.foreground,
    letterSpacing: -0.1,
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: '600',
    color: lightColors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderRangeText: {
    fontSize: 12,
    color: lightColors.mutedForeground,
  },
});

