/**
 * Figma: "Indicator" instances (onboarding "swipe" frame) — 6px dots, gap 4;
 * active stretches to a 24px primary pill, inactive dots are primary-30.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme';

export interface PageIndicatorProps {
  count: number;
  activeIndex: number;
  style?: ViewStyle;
}

export function PageIndicator({ count, activeIndex, style }: PageIndicatorProps) {
  const t = useTheme();
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: t.blue[30] },
            i === activeIndex && [styles.dotActive, { backgroundColor: t.colors.primary }],
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    borderRadius: radius.pill,
  },
});
