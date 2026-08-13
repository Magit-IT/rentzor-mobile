/**
 * Category browse — opened from the home screen's category circles.
 * Layout follows Figma "Search resoult" (293:12139): back arrow +
 * search-bar (showing the category name, tap to open the search screen);
 * bold "N ta natija" count over the two-column product grid; the 293:12151
 * no-results state when the category is empty.
 * Data mirrors rentzor-marketplace's /category/:slug page — approved &
 * available items, newest first — with the web's subcategory routes
 * becoming a horizontal chip row ("Barchasi" + one chip per subcategory).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoResults, ProductCard } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { Chevron } from '../../components/icons';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useCategoryItems } from '../../hooks/useCategoryItems';
import { useSubcategories } from '../../hooks/useSubcategories';
import { formatDailyPrice } from '../../lib/format';
import { fonts, press, radius, spacing, Theme } from '../../theme';

export default function CategoryScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [subcategory, setSubcategory] = useState<string | null>(null);

  const { categoryName, subcategories } = useSubcategories(slug);
  const { items, totalCount, loading, loadingMore, error, loadMore } = useCategoryItems(
    slug,
    subcategory,
  );

  const title = tr.categoryNames[slug] ?? categoryName ?? '';
  // Two cards per row, same as the home grid (169 on the 393pt frame).
  const cardWidth = (width - spacing.screenX * 2 - spacing.md) / 2;
  const empty = items.length === 0;

  const chip = (label: string, value: string | null) => {
    const active = subcategory === value;
    return (
      <Pressable
        key={value ?? 'all'}
        onPress={() => setSubcategory(value)}
        style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && press.dim]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => pressed && press.dim}
          >
            <Chevron direction="left" size={24} color={t.colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [styles.searchBar, pressed && press.dim]}
          >
            <AppIcon name="search" color={t.colors.text} />
            <Text style={styles.searchBarText} numberOfLines={1}>
              {title}
            </Text>
          </Pressable>
        </View>
      </View>

      {subcategories.length > 0 && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {chip(tr.category.all, null)}
            {subcategories.map((sub) => chip(tr.subcategoryNames[sub.slug] ?? sub.name, sub.slug))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <ProductCard
            width={cardWidth}
            image={item.primary_image ? { uri: item.primary_image } : undefined}
            title={item.title}
            location={item.location ?? ''}
            price={formatDailyPrice(item.price_per_day)}
            rating={item.rating ?? undefined}
            onPress={() => router.push(`/product/${item.id}`)}
            onToggleSaved={() => {}}
          />
        )}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.gridContent, empty && styles.gridContentEmpty]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          totalCount > 0 ? (
            <Text style={styles.resultsCount}>{tr.search.resultsCount(totalCount)}</Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={t.colors.primary} style={styles.loader} />
          ) : (
            <NoResults message={error ?? tr.search.noResults} />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={t.colors.primary} style={styles.loader} />
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  header: {
    gap: spacing.lg,
    backgroundColor: t.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.screenX,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 16,
    minHeight: 48,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
  },
  searchBarText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: t.colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
    marginHorizontal: spacing.screenX,
    borderWidth : 1
  },
  chips: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom : spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  chipActive: {
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  chipTextActive: {
    color: t.colors.textInverse,
  },
  resultsCount: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  gridContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
});
