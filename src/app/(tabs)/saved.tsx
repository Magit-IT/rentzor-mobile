/**
 * Figma: Saved (293:11326) — "Saqlangan" header and a two-column grid of
 * saved products, each with the filled blue bookmark. Items come from
 * FavoritesContext (see rentzor-marketplace's Favorites page); details
 * load via useSavedItems. Empty state (2095:9514): EmptyState illustration
 * + "Mahsulotlarni ko'rish" CTA back to the home tab, matching the
 * EmptyState+Button pattern (no existing precedent combined the two, but
 * both components already exist -- see bookings.tsx for EmptyState alone).
 */
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/AppIcon';
import { Button, EmptyState, PageHeader, ProductCard } from '../../components';
import { useFavorites } from '../../context/FavoritesContext';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useSavedItems } from '../../hooks/useSavedItems';
import { formatDailyPrice } from '../../lib/format';
import { spacing, Theme } from '../../theme';

export default function SavedScreen() {
  const styles = useThemedStyles(makeStyles);
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.screenX * 2 - spacing.md) / 2;

  const { savedIds, loading: favoritesLoading, isSaved, toggleSaved } = useFavorites();
  const { items, loading } = useSavedItems(savedIds);

  const showLoader = favoritesLoading || (loading && items.length === 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={tr.savedScreen.title} />
      {showLoader ? (
        <ActivityIndicator color={t.colors.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            image={require('../../assets/empty-states/no-saved.png')}
            title={tr.savedScreen.emptyTitle}
            subtitle={tr.savedScreen.emptySubtitle}
          />
          <View style={[styles.emptyCta, { bottom: insets.bottom + spacing.lg }]}>
            <Button
              title={tr.savedScreen.emptyCta}
              leftIcon={<AppIcon name="shoppingBag" color="#FFFFFF" />}
              onPress={() => router.push('/(tabs)/home')}
              fullWidth
            />
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {items.map((item) => (
              <ProductCard
                key={item.id}
                width={cardWidth}
                image={item.primary_image ? { uri: item.primary_image } : undefined}
                title={item.title}
                location={item.location ?? ''}
                price={formatDailyPrice(item.price_per_day)}
                rating={item.rating ?? undefined}
                saved={isSaved(item.id)}
                onPress={() => router.push(`/product/${item.id}`)}
                onToggleSaved={() => toggleSaved(item.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
  },
  emptyCta: {
    position: 'absolute',
    left: spacing.screenX,
    right: spacing.screenX,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    rowGap: spacing.xxl,
    justifyContent: 'space-between',
  },
});
