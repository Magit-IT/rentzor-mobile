/**
 * Figma: Design System / Radio Button (293:31750) — 20x20 circle,
 * active: primary bg + 8px white dot; inactive: white bg + stroke.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, press } from '../theme';

export interface RadioButtonProps {
  selected: boolean;
  onPress?: () => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function RadioButton({ selected, onPress, label, disabled = false, style }: RadioButtonProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && press.dim, style]}
      hitSlop={8}
    >
      <View
        style={[
          styles.circle,
          { borderColor: t.colors.strokeDark, backgroundColor: t.colors.background },
          selected && { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
          disabled && { backgroundColor: t.colors.surface },
        ]}
      >
        {selected && <View style={styles.dot} />}
      </View>
      {label != null && <Text style={[styles.label, { color: t.colors.text }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
