/**
 * Figma: Design System / Header (293:31850) — Types: "Without icon" (title only)
 * and "With left icon" (back + title). Title Onest 600 20/32, hairline bottom border.
 * Status bar area is left to the OS / SafeAreaView.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { fonts, press, spacing, Theme } from '../theme';
import { Chevron } from './icons';

export interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function PageHeader({ title, onBack, right, style }: PageHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && press.dim}>
            <Chevron direction="left" size={24} color="#18181B" />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    backgroundColor: t.colors.background,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenX,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
    marginHorizontal: spacing.screenX,
  },
});
