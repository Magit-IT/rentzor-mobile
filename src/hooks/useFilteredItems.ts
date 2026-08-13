/**
 * Items matching an applied FilterState — filter browse from the Filter
 * sheet. Queries the `items` table (optionally scoped to the picked
 * category/subcategory slug) with the price range applied server-side
 * (price_per_day is a column), then narrows client-side by:
 *  - minimum rating (averaged from reviews, not a column),
 *  - date availability (confirmed/pending booking overlap + manual
 *    unavailable_dates, mirroring the web's useItemAvailability rule),
 *  - distance from the user's GPS position (haversine vs item lat/lng) —
 *    applied only when the user changed it from the default and a GPS fix
 *    exists; items without coordinates are excluded while it's active.
 *
 * Shape mirrors useCategoryItems / useItemSearch so the search screen can
 * render its results with the same ProductCard grid.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { fetchDateBlockedIds, haversineKm } from '../lib/itemFilters';
import { DEFAULT_DISTANCE_KM, FilterState, PRICE_MAX, PRICE_MIN } from './useFilters';

const PAGE_SIZE = 20;

export interface FilteredItem {
  id: string;
  title: string;
  price_per_day: number;
  location: string | null;
  primary_image: string | null;
  rating: number | null;
  review_count: number;
}

async function fetchFilteredPage(
  filters: FilterState,
  page: number,
  userCoords: { lat: number; lon: number } | null,
) {
  const from = page * PAGE_SIZE;
  let query = supabase
    .from('items')
    .select(
      'id, title, price_per_day, location, latitude, longitude, item_images!inner(image_url, is_primary)',
    )
    .eq('available', true)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  // Every clause follows the badge's "active" semantics: category is
  // optional, and price only constrains once changed from its defaults.
  if (filters.category) {
    query = query
      .eq('category', filters.category.parentSlug)
      .eq('subcategory', filters.category.slug);
  }
  if (filters.priceMin !== PRICE_MIN || filters.priceMax !== PRICE_MAX) {
    query = query.gte('price_per_day', filters.priceMin).lte('price_per_day', filters.priceMax);
  }
  const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  let rows = data ?? [];

  // Distance: only when explicitly changed from the default and GPS is known.
  const distanceActive = filters.distanceKm !== DEFAULT_DISTANCE_KM && userCoords != null;
  if (distanceActive) {
    rows = rows.filter(
      (row) =>
        row.latitude != null &&
        row.longitude != null &&
        haversineKm(userCoords.lat, userCoords.lon, row.latitude, row.longitude) <=
          filters.distanceKm,
    );
  }

  // Dates: drop items with an overlapping booking / manual block.
  if (filters.dateFrom || filters.dateTo) {
    const blocked = await fetchDateBlockedIds(
      rows.map((row) => row.id),
      filters.dateFrom,
      filters.dateTo,
    );
    rows = rows.filter((row) => !blocked.has(row.id));
  }

  // Average public renter→owner rating per item (same as the other lists).
  const ratings: Record<string, { sum: number; count: number }> = {};
  if (rows.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('item_id, rating')
      .in('item_id', rows.map((row) => row.id))
      .eq('visibility', 'public')
      .eq('review_type', 'renter_to_owner');
    for (const review of reviews ?? []) {
      if (!review.item_id || !review.rating) continue;
      ratings[review.item_id] ??= { sum: 0, count: 0 };
      ratings[review.item_id].sum += review.rating;
      ratings[review.item_id].count += 1;
    }
  }

  const items = rows.map((row): FilteredItem => {
    const primary = row.item_images.find((img) => img.is_primary) ?? row.item_images[0];
    return {
      id: row.id,
      title: row.title,
      price_per_day: row.price_per_day,
      location: row.location,
      primary_image: primary?.image_url ?? null,
      rating: ratings[row.id] ? ratings[row.id].sum / ratings[row.id].count : null,
      review_count: ratings[row.id]?.count ?? 0,
    };
  });

  // Rating is a computed average, not a filterable column, so narrow here.
  const filtered =
    filters.rating > 0 ? items.filter((it) => (it.rating ?? 0) >= filters.rating) : items;

  return { items: filtered, totalCount: filtered.length, pageRowCount: (data ?? []).length };
}

/**
 * @param filters the APPLIED filters (not the draft)
 * @param active whether the filter results should be shown at all
 * @param userCoords the user's GPS position, for the distance filter (null = unknown)
 */
export function useFilteredItems(
  filters: FilterState,
  active: boolean,
  userCoords: { lat: number; lon: number } | null,
) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<FilteredItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Whether the last fetched page was full BEFORE client narrowing — the
  // only reliable "there may be more on the server" signal once rating/date/
  // distance narrowing can shrink a page below PAGE_SIZE.
  const [lastPageFull, setLastPageFull] = useState(false);

  const categoryKey = filters.category ? `${filters.category.parentSlug}/${filters.category.slug}` : '';
  const dateKey = `${filters.dateFrom?.getTime() ?? ''}-${filters.dateTo?.getTime() ?? ''}`;
  const coordsKey = userCoords ? `${userCoords.lat},${userCoords.lon}` : '';
  const fetchKey = [
    categoryKey,
    filters.priceMin,
    filters.priceMax,
    filters.rating,
    filters.distanceKm,
    dateKey,
    coordsKey,
  ].join('|');
  // The key the current `items` were fetched for. Deriving `loading` from it
  // makes the spinner appear on the very render Apply lands (no state-update
  // lag flashing the empty state) and hides stale items during a reload.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = active && loadedKey !== fetchKey;

  // Re-run from page 0 whenever the applied filter changes.
  useEffect(() => setPage(0), [fetchKey]);

  useEffect(() => {
    if (!active) {
      setItems([]);
      setTotalCount(0);
      setLoadedKey(null);
      return;
    }
    let cancelled = false;
    if (page > 0) setLoadingMore(true);

    (async () => {
      try {
        const data = await fetchFilteredPage(filters, page, userCoords);
        if (!cancelled) {
          setItems((prev) => (page === 0 ? data.items : [...prev, ...data.items]));
          setTotalCount((prev) => (page === 0 ? data.totalCount : prev + data.totalCount));
          setLastPageFull(data.pageRowCount === PAGE_SIZE);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) {
          setLoadedKey(fetchKey);
          setLoadingMore(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, fetchKey, page]);

  const hasMore = lastPageFull;
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) setPage((p) => p + 1);
  }, [hasMore, loading, loadingMore]);

  return {
    // Hide stale rows while a fresh page-0 load is pending, so the grid's
    // empty slot shows the spinner instead of the previous filter's results.
    items: loading ? [] : items,
    totalCount: loading ? 0 : totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
}
