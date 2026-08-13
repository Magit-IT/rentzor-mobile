/**
 * Figma: Design System / Checkbox (293:31709) — 20x20, r=6,
 * active: primary bg + white check; inactive: white bg + stroke.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { fonts, press, Theme } from '../theme';
import { Check } from './icons';

export interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({ checked, onChange, label, disabled = false, style }: CheckboxProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={() => onChange?.(!checked)}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && press.dim, style]}
      hitSlop={8}
    >
      <View
        style={[
          styles.box,
          checked && styles.boxChecked,
          disabled && styles.boxDisabled,
        ]}
      >
        {checked && <Check size={14} />}
      </View>
      {label != null && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  boxDisabled: { backgroundColor: t.colors.surface },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
});
