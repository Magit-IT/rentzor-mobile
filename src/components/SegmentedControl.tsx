/**
 * Figma: Design System / Segment (293:31819) — active segment: white bg,
 * r=10, soft shadow; inactive: transparent on a light-gray track.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { fonts, radius, Theme } from '../theme';

export interface SegmentedControlProps {
  segments: string[];
  activeIndex: number;
  onChange?: (index: number) => void;
  style?: ViewStyle;
}

export function SegmentedControl({ segments, activeIndex, onChange, style }: SegmentedControlProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.track, style]}>
      {segments.map((segment, i) => (
        <Pressable
          key={segment}
          onPress={() => onChange?.(i)}
          style={({ pressed }) => [
            styles.segment,
            i === activeIndex && styles.segmentActive,
            pressed && i !== activeIndex && styles.segmentPressed,
          ]}
        >
          <Text style={[styles.label, i === activeIndex && styles.labelActive]}>{segment}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: t.scheme === 'dark' ? t.gray[10] : '#F3F4F4',
    borderRadius: radius.sm + 2,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentPressed: {
    backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
  },
  segmentActive: {
    backgroundColor: t.scheme === 'dark' ? t.gray[30] : '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: '#8A8C91',
  },
  labelActive: { color: t.scheme === 'dark' ? t.colors.text : '#1B1B1B' },
});
