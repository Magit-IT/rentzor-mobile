/**
 * Figma: Design System / Product (293:32580) — variants Large 169w / Small,
 * Saved on/off. Image r=24 with rating badge (top-left) and bookmark button
 * (top-right); below: location 12/16 muted, title 14/20 semibold, price 14/20.
 */
import { Image } from 'expo-image';
import React from 'react';
import {
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, press, radius } from '../theme';
import { AppIcon } from './AppIcon';
import { ProductIcon } from './ProductIcon';

export interface ProductCardProps {
  /** Omit for the design's "No image" card variant. */
  image?: ImageSourcePropType;
  title: string;
  location: string;
  price: string;
  rating?: number;
  saved?: boolean;
  onPress?: () => void;
  onToggleSaved?: () => void;
  /** Card width; Figma large card is 169. */
  width?: number;
  bookmarkIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function ProductCard({
  image,
  title,
  location,
  price,
  rating,
  saved = false,
  onPress,
  onToggleSaved,
  width = 169,
  bookmarkIcon,
  style,
}: ProductCardProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width }, styles.container, pressed && press.dim, style]}
    >
      <View style={[styles.imageWrap, { height: width, backgroundColor: t.colors.surface }]}>
        {image ? (
          <Image
            source={image}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: t.colors.surface }]}>
            <AppIcon name="imagePlaceholder" color={t.gray[30]} size={56} />
          </View>
        )}
        {rating != null && (
          <View style={[styles.ratingBadge, { backgroundColor: t.colors.background }]}>
            <ProductIcon name="star" size={12} color={t.gray[90]} />
            <Text style={[styles.ratingText, { color: t.gray[90] }]}>{rating.toFixed(1)}</Text>
          </View>
        )}
        {onToggleSaved && (
          <Pressable
            onPress={onToggleSaved}
            hitSlop={8}
            style={({ pressed }) => [
              styles.bookmarkButton,
              { backgroundColor: pressed ? t.gray[10] : t.colors.background },
            ]}
          >
            {bookmarkIcon ??
              (saved ? (
                <AppIcon name="bookmarkFilled" color={t.colors.primary} size={16} />
              ) : (
                <AppIcon name="bookmark" color={t.gray[90]} size={16} />
              ))}
          </Pressable>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.location, { color: t.colors.textMuted }]} numberOfLines={1}>
          {location}
        </Text>
        <Text style={[styles.title, { color: t.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.price, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  imageWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.base,
  },
  ratingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { gap: 4 },
  location: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  price: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
