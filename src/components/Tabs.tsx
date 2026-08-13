/**
 * Figma: Design System / Tab (293:33114) — pill tabs, r=100, pad 12x8;
 * active: primary bg + white label; inactive: transparent + gray label.
 * Used as status filters ("Barchasi", "Kutilayotgan", ...) across booking screens.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, ViewStyle } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { fonts, radius, Theme } from '../theme';

export interface TabsProps {
  tabs: string[];
  activeIndex: number;
  onChange?: (index: number) => void;
  scrollable?: boolean;
  /**
   * Wrapper (ScrollView) style — vertical MARGINS go here. The wrapper has a
   * fixed height (the horizontal ScrollView mismeasures the pills otherwise,
   * clipping them), so vertical padding inside it would clip again.
   */
  style?: ViewStyle;
  /** Pill row style — horizontal padding goes here so it scrolls with the content. */
  contentStyle?: ViewStyle;
}

export function Tabs({ tabs, activeIndex, onChange, scrollable = true, style, contentStyle }: TabsProps) {
  const styles = useThemedStyles(makeStyles);
  const items = tabs.map((tab, i) => (
    <Pressable
      key={tab}
      onPress={() => onChange?.(i)}
      style={({ pressed }) => [
        styles.tab,
        i === activeIndex && styles.tabActive,
        pressed && (i === activeIndex ? styles.tabActivePressed : styles.tabPressed),
      ]}
    >
      {/* Pills have a fixed 36pt height; let the labels ignore the system
          font-size setting so they never outgrow (and clip against) it. */}
      <Text
        allowFontScaling={false}
        style={[styles.label, i === activeIndex && styles.labelActive]}
      >
        {tab}
      </Text>
    </Pressable>
  ));

  if (!scrollable) {
    return (
      <ScrollView
        horizontal
        scrollEnabled={false}
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.row, contentStyle]}
      >
        {items}
      </ScrollView>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.row, contentStyle]}
    >
      {items}
    </ScrollView>
  );
}

// 20pt label line height + 8pt vertical padding each side.
const TAB_HEIGHT = 36;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  // flexGrow: 0 — ScrollView defaults to 1, which stretches the pill row to
  // fill leftover column space. flexShrink: 0 — when a sibling (e.g. a long
  // booking list) overflows the column, the strip must not be compressed
  // below the pills' height (that clipped them). Fixed height — the
  // horizontal ScrollView does not reliably derive its height from the pills.
  scroll: { flexGrow: 0, flexShrink: 0, height: TAB_HEIGHT },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', height: TAB_HEIGHT },
  // Explicit pill height with centered label (rather than vertical padding
  // around the text) so custom-font metrics can never grow the pill past the
  // fixed-height wrapper and get it clipped.
  tab: {
    height: TAB_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: t.colors.primary },
  tabPressed: { backgroundColor: t.gray[10] },
  tabActivePressed: { backgroundColor: t.blue[70] },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
    // Android adds the font's ascent/descent padding on top of lineHeight,
    // which nudges the label (and pill) off-center in the fixed-height row.
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  labelActive: { color: t.colors.textInverse },
});
