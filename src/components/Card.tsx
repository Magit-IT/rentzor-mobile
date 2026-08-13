/**
 * Figma: Design System / Card (293:32124) — generic row card, r=24, 12px
 * padding, gap 12. Default: white + stroke; Active: primary-0 tinted bg
 * (as used for the selected location card in the Drawer).
 */
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { press, radius, spacing, Theme } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, active = false, onPress, style }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  const content = (
    <View style={[styles.card, active ? styles.cardActive : styles.cardDefault, style]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && press.dim}>
      {content}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  cardDefault: {
    backgroundColor: t.colors.background,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
  },
  cardActive: {
    backgroundColor: t.colors.surfaceActive,
  },
});
