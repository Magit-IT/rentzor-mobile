/**
 * Figma: empty pages (624:9514 Dispute / 624:9549 My cards / 624:9590 My
 * booking) — 3D illustration with a bold "…yo‘q" heading and a two-line
 * explainer beneath, centered in the free space under the header.
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { fonts, radius, spacing, Theme } from '../theme';

export function EmptyState({
  image,
  title,
  subtitle,
}: {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
    textBlock: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 24,
      lineHeight: 32,
      textAlign: 'center',
      color: t.colors.text,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 28,
      textAlign: 'center',
      color: t.colors.text,
    },
  });
