/**
 * Figma: Search (293:12095) — header with back arrow and search input;
 * hairline divider; below: "Yaqinda ko‘rilgan" recent searches (history
 * icon, text, dismiss X).
 *
 * Search behaviour mirrors rentzor-marketplace: typing ≥2 chars runs the
 * trigram-based search_items_enhanced RPC (debounced in useItemSearch) and
 * shows a two-column result grid with total count and the RPC's spelling
 * suggestion; recent searches persist via useRecentSearches.
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { FilterSheet, Input, NoResults, ProductCard } from '../components';
import { AppIcon } from '../components/AppIcon';
import { SearchIcon } from '../components/SearchIcon';
import { Chevron } from '../components/icons';
import { useT } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useFilteredItems } from '../hooks/useFilteredItems';
import { DEFAULT_DISTANCE_KM, useFilters } from '../hooks/useFilters';
import { MIN_SEARCH_LENGTH, useItemSearch } from '../hooks/useItemSearch';
import { useNarrowedSearchResults } from '../hooks/useNarrowedSearchResults';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { formatDailyPrice } from '../lib/format';
import { fonts, press, radius, spacing, Theme } from '../theme';

export default function SearchScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const { searches: recents, addSearch, removeSearch, clearAll } = useRecentSearches();
  const search = useItemSearch(query);
  const { filters, activeCount, draft, setDraft, openDraft, apply, reset } = useFilters();
  const [filterOpen, setFilterOpen] = useState(false);
  const { effectiveCoords: userCoords, refreshCurrent } = useLocation();

  // A distance filter needs known coordinates — request a GPS fix (permission
  // prompt on first use) as soon as the user applies a non-default distance
  // and no address/GPS coords are known yet.
  useEffect(() => {
    if (filters.distanceKm !== DEFAULT_DISTANCE_KM && !userCoords) refreshCurrent();
  }, [filters.distanceKm, userCoords, refreshCurrent]);

  const searching = query.trim().length >= MIN_SEARCH_LENGTH;
  // With no search text but any filter applied, browse the matching items
  // (category-scoped when one is picked) instead of the recent searches.
  const browsingFilters = !searching && activeCount > 0;
  const filtered = useFilteredItems(filters, browsingFilters, userCoords);
  // Text-search results narrowed by the applied filters (client-side).
  const narrowedResults = useNarrowedSearchResults(search.results, filters, userCoords);
  // Two cards per row, same as the home grid (169 on the 393pt frame).
  const cardWidth = (width - spacing.screenX * 2 - spacing.md) / 2;

  const openProduct = (id: string) => {
    if (query.trim()) addSearch(query);
    router.push(`/product/${id}`);
  };

  // Normalize both result sources to the fields the grid needs.
  type GridItem = {
    id: string;
    title: string;
    location: string | null;
    price_per_day: number;
    primary_image: string | null;
    rating: number | null;
  };
  const gridData: GridItem[] = searching ? narrowedResults : filtered.items;
  const gridLoading = searching ? search.loading || !search.active : filtered.loading;
  const gridLoadingMore = searching ? search.loadingMore : filtered.loadingMore;
  const gridError = searching ? search.error : filtered.error;
  const gridLoadMore = searching ? search.loadMore : filtered.loadMore;
  // The RPC's server count ignores the filters — once any filter narrows the
  // search rows, count what's actually shown instead.
  const gridTotalCount = searching
    ? activeCount > 0
      ? narrowedResults.length
      : search.totalCount
    : filtered.totalCount;

  const resultsHeader = (
    <View style={styles.resultsHeader}>
      {searching && search.suggestedCorrection != null && (
        <Pressable
          onPress={() => setQuery(search.suggestedCorrection!)}
          style={({ pressed }) => [styles.suggestionRow, pressed && press.dim]}
        >
          <Text style={styles.suggestionLabel}>{tr.search.didYouMean} </Text>
          <Text style={styles.suggestionTerm}>{search.suggestedCorrection}</Text>
        </Pressable>
      )}
      {browsingFilters && filters.category != null && (
        <Text style={styles.resultsCount}>{filters.category.name}</Text>
      )}
      {gridTotalCount > 0 && (
        <Text style={styles.resultsCount}>{tr.search.resultsCount(gridTotalCount)}</Text>
      )}
    </View>
  );

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
          <Input
            containerStyle={styles.input}
            leftIcon={<AppIcon name="search" color={t.colors.text} />}
            placeholder={tr.search.placeholder}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => addSearch(query)}
            autoFocus
          />
          <Pressable
            onPress={() => {
              openDraft();
              setFilterOpen(true);
            }}
            style={({ pressed }) => [
              styles.filterButton,
              { borderColor: t.colors.strokeDark, backgroundColor: t.colors.background },
              pressed && press.dim,
            ]}
          >
            <SearchIcon name="tuning" color={t.colors.text} />
            {activeCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: t.colors.critical }]}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={styles.divider} />
      </View>

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={draft}
        onChange={setDraft}
        onReset={reset}
        onApply={apply}
      />

      {searching || browsingFilters ? (
        <FlatList
          data={gridData}
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
              onPress={() => openProduct(item.id)}
              onToggleSaved={() => {}}
            />
          )}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.gridContent,
            gridData.length === 0 && styles.gridContentEmpty,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onEndReached={gridLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={resultsHeader}
          ListEmptyComponent={
            gridLoading ? (
              <ActivityIndicator color={t.colors.primary} style={styles.loader} />
            ) : (
              <NoResults
                message={gridError ?? tr.search.noResults}
                hint={gridError == null ? tr.search.noResultsHint : undefined}
              />
            )
          }
          ListFooterComponent={
            gridLoadingMore ? (
              <ActivityIndicator color={t.colors.primary} style={styles.loader} />
            ) : null
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {recents.length > 0 && (
            <View style={styles.recents}>
              <View style={styles.recentsTitleRow}>
                <Text style={styles.recentsTitle}>{tr.search.recentTitle}</Text>
                <Pressable onPress={clearAll} hitSlop={8} style={({ pressed }) => pressed && press.dim}>
                  <Text style={styles.recentsClear}>{tr.search.clearAll}</Text>
                </Pressable>
              </View>
              {recents.map((item) => (
                <View key={item} style={styles.recentRow}>
                  <Pressable
                    onPress={() => {
                      setQuery(item);
                      addSearch(item);
                    }}
                    style={({ pressed }) => [styles.recentItem, pressed && press.dim]}
                  >
                    <SearchIcon name="history" color={t.colors.textSecondary} />
                    <Text style={styles.recentText} numberOfLines={1}>
                      {item}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeSearch(item)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && press.dim}
                  >
                    <SearchIcon name="close" color={t.colors.text} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
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
  input: { flex: 1 },
  filterButton: {
    padding: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
    marginHorizontal: spacing.screenX,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xxl,
  },
  recents: { gap: spacing.lg },
  recentsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  recentsClear: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  resultsHeader: { gap: spacing.md },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  suggestionLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  suggestionTerm: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
  resultsCount: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
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
  gridRow: {
    justifyContent: 'space-between',
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
});
