/**
 * Figma: "Owner rating star" / "Review rating star" instances — row of stars
 * used in reviews and owner profiles; filled stars in yellow, empty in gray.
 */
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { press, Theme } from '../theme';
import { ProductIcon } from './ProductIcon';

export interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  /** When provided, stars become tappable (review input). */
  onChange?: (rating: number) => void;
  style?: ViewStyle;
}

export function RatingStars({ rating, max = 5, size = 16, onChange, style }: RatingStarsProps) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        // The rounded Figma star (ProductIcon), not the angular ★ glyph —
        // same shape the product/review screens use.
        const star = (
          <ProductIcon name="star" size={size} color={filled ? t.colors.warning : t.gray[20]} />
        );
        if (!onChange) return <View key={i}>{star}</View>;
        return (
          <Pressable
            key={i}
            onPress={() => onChange(i + 1)}
            hitSlop={4}
            style={({ pressed }) => pressed && press.dim}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
