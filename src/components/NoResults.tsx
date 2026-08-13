/**
 * Figma: Search resoult (293:12151) — empty search/category result state:
 * the magnifier-over-empty-box illustration (200×200) with the
 * "Natija topilmadi" title (Onest 600 24/32) and an optional hint line
 * (Onest 400 16/28) beneath, centered in the free space below the header.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { fonts, radius, spacing, Theme } from '../theme';

export function NoResults({ message, hint }: { message: string; hint?: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/search/no-results-image.png')}
        style={styles.image}
      />
      <View style={styles.texts}>
        <Text style={styles.title}>{message}</Text>
        {hint != null && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xxl,
    },
    image: {
      width: 200,
      height: 200,
      borderRadius: radius.lg,
    },
    texts: {
      gap: spacing.xs,
      alignItems: 'center',
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 24,
      lineHeight: 32,
      textAlign: 'center',
      color: t.colors.text,
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 28,
      textAlign: 'center',
      color: t.colors.text,
    },
  });
