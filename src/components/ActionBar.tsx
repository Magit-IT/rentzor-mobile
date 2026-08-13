/**
 * Figma: Design System / Action bar (293:32414) — bottom container with
 * top corners r=24, light stroke, 20px padding, one or two buttons side by
 * side (gap 12).
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme';

export interface ActionBarProps {
  /** One or more <Button/>s; two buttons render in a row with equal widths. */
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ActionBar({ children, style }: ActionBarProps) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.colors.backgroundSecondary, borderColor: t.colors.strokeLight },
        style,
      ]}
    >
      <View style={styles.buttons}>
        {React.Children.map(children, (child) =>
          // Skip falsy children — wrapping them would leave an empty flex
          // slot that squeezes the real buttons (e.g. a conditional button).
          child ? <View style={styles.buttonWrap}>{child}</View> : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.screenX,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonWrap: { flex: 1 },
});
