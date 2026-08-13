/**
 * Figma: Home (light 293:11039, dark 539:13841) — location header +
 * notification bell, search bar, category circles, two horizontal product
 * rails ("Sizga yaqin joylashgan", "Yaqinda ko‘rilgan") and the
 * "Tavsiya qilinadi" grid.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationSheet, ProductCard } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { Chevron } from '../../components/icons';
import { useFavorites } from '../../context/FavoritesContext';
import { useT } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import { useCategories } from '../../hooks/useCategories';
import { useFeaturedItems } from '../../hooks/useFeaturedItems';
import { useNearbyItems } from '../../hooks/useNearbyItems';
import { useNotifications } from '../../hooks/useNotifications';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { useSignInPrompt } from '../../hooks/useSignInPrompt';
import { formatCardLocation } from '../../lib/distance';
import { formatDailyPrice } from '../../lib/format';
import { fonts, press, radius, spacing } from '../../theme';

/** A rail card, normalised from whichever hook produced it. */
interface Product {
  id: string;
  title: string;
  location: string;
  price: string;
  image?: ImageSourcePropType;
}

// Circle photos by category slug (see useCategories); a slug without an
// asset falls back to an initial-letter circle.
const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  sports: require('../../assets/home/category-sport.png'),
  music: require('../../assets/home/category-audio.png'),
  transport: require('../../assets/home/category-velosiped.png'),
  electronics: require('../../assets/home/category-noutbuklar.png'),
  gaming: require('../../assets/home/category-oyin.png'),
  tools: require('../../assets/home/category-tools.png'),
  photography: require('../../assets/home/category-photography.png'),
  outdoor: require('../../assets/home/category-outdoor.png'),
  events: require('../../assets/home/category-events.png'),
  home: require('../../assets/home/category-home.png'),
  kids: require('../../assets/home/category-kids.png'),
  fashion: require('../../assets/home/category-fashion.png'),
  books: require('../../assets/home/category-books.png'),
  health: require('../../assets/home/category-health.png'),
  art: require('../../assets/home/category-art.png'),
  cleaning: require('../../assets/home/category-cleaning.png'),
  construction: require('../../assets/home/category-construction.png'),
  agriculture: require('../../assets/home/category-agriculture.png'),
  office: require('../../assets/home/category-office.png'),
  fitness: require('../../assets/home/category-fitness.png'),
  camping: require('../../assets/home/category-camping.png'),
  other: require('../../assets/home/category-other.png'),
};

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { address } = useLocation();
  const { isSaved, toggleSaved } = useFavorites();
  const {
    items: recommended,
    loading: recommendedLoading,
    error: recommendedError,
    retry: retryRecommended,
  } = useFeaturedItems(6);
  const { items: nearbyItems, loading: nearbyLoading, retry: retryNearby } = useNearbyItems(6);
  const { items: recentItems, loading: recentLoading, refresh: refreshRecent } = useRecentlyViewed();
  const { unreadCount, loading: notificationsLoading, refresh: refreshNotifications } = useNotifications();
  const { requireAuth, prompt: signInPrompt } = useSignInPrompt();
  const { categories } = useCategories();
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  // Re-read on focus so an item viewed and backed out of shows up immediately.
  useFocusEffect(
    useCallback(() => {
      refreshRecent();
      refreshNotifications();
    }, [refreshRecent, refreshNotifications]),
  );

  // Pull-to-refresh: drop the spinner once every tracked section has re-fetched.
  useEffect(() => {
    if (!recommendedLoading && !nearbyLoading && !recentLoading && !notificationsLoading) {
      setPullRefreshing(false);
    }
  }, [recommendedLoading, nearbyLoading, recentLoading, notificationsLoading]);

  const nearby: Product[] = nearbyItems.map((item) => ({
    id: item.id,
    title: item.title,
    location: formatCardLocation(item.distance_km, item.location),
    price: formatDailyPrice(item.price_per_day),
    image: item.primary_image ? { uri: item.primary_image } : undefined,
  }));

  const recent: Product[] = recentItems.map((item) => ({
    id: item.id,
    title: item.title,
    location: formatCardLocation(null, item.location),
    price: formatDailyPrice(item.price_per_day),
    image: item.primary_image ? { uri: item.primary_image } : undefined,
  }));
  // Two cards per row: screen minus side margins (20x2) and the 12 gap.
  // On the 393pt design frame this evaluates to the spec's 169.
  const cardWidth = (width - spacing.screenX * 2 - spacing.md) / 2;

  const openProduct = (id: string) => router.push(`/product/${id}`);

  const renderRail = (title: string, products: Product[], loading = false) => {
    // Nothing to show and nothing coming: drop the whole section rather than
    // leave a header above an empty strip.
    if (!loading && products.length === 0) return null;

    return (
      <View style={styles.section}>
        <Pressable style={({ pressed }) => [styles.sectionHeader, pressed && press.dim]}>
          <Text style={[styles.sectionTitle, { color: t.colors.text }]}>{title}</Text>
          <Chevron direction="right" size={24} color={t.colors.text} />
        </Pressable>
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.railLoader} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {products.map((p) => (
              <ProductCard
                key={p.id}
                width={cardWidth}
                image={p.image}
                title={p.title}
                location={p.location}
                price={p.price}
                saved={isSaved(p.id)}
                onPress={() => openProduct(p.id)}
                onToggleSaved={() => toggleSaved(p.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const chipTheme = (pressed: boolean) => ({
    backgroundColor: pressed ? t.colors.surface : t.colors.backgroundSecondary,
    borderColor: t.colors.strokeLight,
  });

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <Pressable
            onPress={() => setLocationSheetVisible(true)}
            style={({ pressed }) => [styles.location, pressed && press.dim]}
          >
            <AppIcon name="locationPin" color={t.colors.text} />
            <Text style={[styles.address, { color: t.colors.text }]} numberOfLines={1}>
              {address}
            </Text>
            <Chevron direction="down" size={20} color={t.colors.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.bellButton, chipTheme(pressed)]}
            onPress={() => requireAuth(() => router.push('/notifications'))}
          >
            <AppIcon name="bell" color={t.colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: t.colors.critical }]}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <Pressable
          style={({ pressed }) => [styles.searchBar, chipTheme(pressed)]}
          onPress={() => router.push('/search')}
        >
          <AppIcon name="search" color={t.colors.text} />
          <Text style={[styles.searchText, { color: t.colors.text }]}>
            {tr.home.searchPlaceholder}
          </Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: t.colors.strokeDark }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => {
              setPullRefreshing(true);
              retryRecommended();
              retryNearby();
              refreshRecent();
              refreshNotifications();
            }}
            colors={[t.colors.primary]}
            tintColor={t.colors.primary}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((c) => {
            const label = tr.categoryNames[c.slug] ?? c.name;
            const image = CATEGORY_IMAGES[c.slug];
            return (
              
              <Pressable
                key={c.id}
                onPress={() => router.push(`/category/${c.slug}`)}
                style={({ pressed }) => [styles.category, pressed && press.dim]}
              >
                {image ? (
                  <Image source={image} style={styles.categoryImage} />
                ) : (
                  <View style={[styles.categoryImage, styles.categoryFallback, { backgroundColor: t.colors.surface }]}>
                    <Text style={[styles.categoryInitial, { color: t.colors.textMuted }]}>
                      {label.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.categoryLabel, { color: t.colors.text }]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {renderRail(tr.home.nearby, nearby, nearbyLoading)}
        {renderRail(tr.home.recentlyViewed, recent)}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: t.colors.text }]}>
              {tr.home.recommended}
            </Text>
          </View>
          {recommendedLoading ? (
            <ActivityIndicator color={t.colors.primary} style={styles.gridLoader} />
          ) : recommendedError ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: t.colors.textMuted }]}>
                {tr.home.loadError}
              </Text>
              <Pressable
                onPress={retryRecommended}
                style={({ pressed }) => [styles.retryButton, chipTheme(pressed)]}
              >
                <Text style={[styles.retryText, { color: t.colors.text }]}>
                  {tr.home.retry}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {recommended.map((p) => (
                <ProductCard
                  key={p.id}
                  width={cardWidth}
                  image={p.primary_image ? { uri: p.primary_image } : undefined}
                  title={p.title}
                  location={p.location ?? ''}
                  price={formatDailyPrice(p.price_per_day)}
                  saved={isSaved(p.id)}
                  onPress={() => openProduct(p.id)}
                  onToggleSaved={() => toggleSaved(p.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <LocationSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        onAddNew={() => {
          setLocationSheetVisible(false);
          router.push('/location');
        }}
        onEdit={(location) => {
          setLocationSheetVisible(false);
          router.push({ pathname: '/edit-location', params: { id: location.id } });
        }}
      />

      {signInPrompt}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    gap: spacing.sm,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  address: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bellButton: {
    width: 48,
    height: 48,
    borderRadius: radius.base,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screenX,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.screenX,
  },
  categories: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  category: {
    width: 83,
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  },
  categoryFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInitial: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
  },
  categoryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.xxl + spacing.sm,
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenX,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
  },
  rail: {
    paddingHorizontal: spacing.screenX,
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenX,
    gap: spacing.md,
    rowGap: spacing.lg,
    justifyContent: 'space-between',
  },
  gridLoader: {
    paddingVertical: spacing.xxl,
  },
  railLoader: {
    paddingVertical: spacing.xxl,
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.screenX,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
