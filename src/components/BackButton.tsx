/**
 * Figma: circular icon button used across auth/booking screens —
 * 48x48, r=100, bg gray-10, chevron-left.
 */
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Chevron } from './icons';

export interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export function BackButton({ onPress, style }: BackButtonProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? t.gray[20] : t.colors.surface },
        style,
      ]}
    >
      <Chevron direction="left" size={24} color={t.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
