/**
 * Figma: Design System / Navigation bar (293:31923) + Navbar item (293:31916).
 * Bottom tab bar: items 60px tall, icon 24 + label Onest 500 12/16;
 * active tint primary, inactive #A1A1AA.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { fonts, press, spacing, Theme } from '../theme';

export interface NavBarItem {
  key: string;
  label: string;
  /** Receives the current tint so the same icon works for both states. */
  icon: (color: string) => React.ReactNode;
}

export interface NavBarProps {
  items: NavBarItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  style?: ViewStyle;
}

export function NavBar({ items, activeKey, onChange, style }: NavBarProps) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {items.map((item) => {
          const active = item.key === activeKey;
          const tint = active ? t.colors.primary : t.colors.textMuted;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange?.(item.key)}
              style={({ pressed }) => [styles.item, pressed && press.dim]}
            >
              {item.icon(tint)}
              <Text style={[styles.label, { color: tint }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    backgroundColor: t.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderColor: t.colors.strokeLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
  },
  item: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    minWidth: 80,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
});
