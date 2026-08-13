/**
 * Applies the Filter sheet's filters to text-search results client-side —
 * the search RPC only takes a term, so category/price/rating narrow the
 * fetched rows directly, while dates (booking overlap + manual blocks) and
 * distance (haversine vs coords fetched for the visible ids) resolve
 * asynchronously. Filters follow the badge's "active" semantics: price and
 * distance only apply once changed from their defaults.
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchDateBlockedIds, fetchItemCoords, haversineKm } from '../lib/itemFilters';
import { DEFAULT_DISTANCE_KM, FilterState, PRICE_MAX, PRICE_MIN } from './useFilters';
import { SearchResultItem } from './useItemSearch';

export function useNarrowedSearchResults(
  results: SearchResultItem[],
  filters: FilterState,
  userCoords: { lat: number; lon: number } | null,
) {
  const datesActive = filters.dateFrom != null || filters.dateTo != null;
  const distanceActive = filters.distanceKm !== DEFAULT_DISTANCE_KM && userCoords != null;

  // Synchronous narrowing: category, price, rating are on the rows already.
  const syncNarrowed = useMemo(() => {
    let out = results;
    const category = filters.category;
    if (category) {
      out = out.filter(
        (r) => r.category === category.parentSlug && r.subcategory === category.slug,
      );
    }
    if (filters.priceMin !== PRICE_MIN || filters.priceMax !== PRICE_MAX) {
      out = out.filter(
        (r) => r.price_per_day >= filters.priceMin && r.price_per_day <= filters.priceMax,
      );
    }
    if (filters.rating > 0) out = out.filter((r) => (r.rating ?? 0) >= filters.rating);
    return out;
  }, [results, filters.category, filters.priceMin, filters.priceMax, filters.rating]);

  // Async narrowing inputs: blocked ids for the date range, coords for distance.
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [coords, setCoords] = useState<Map<string, { lat: number; lon: number }>>(new Map());

  useEffect(() => {
    if (!datesActive && !distanceActive) return;
    let cancelled = false;
    const ids = syncNarrowed.map((r) => r.id);
    (async () => {
      const [blocked, coordMap] = await Promise.all([
        datesActive
          ? fetchDateBlockedIds(ids, filters.dateFrom, filters.dateTo)
          : Promise.resolve(new Set<string>()),
        distanceActive ? fetchItemCoords(ids) : Promise.resolve(new Map<string, { lat: number; lon: number }>()),
      ]);
      if (!cancelled) {
        setBlockedIds(blocked);
        setCoords(coordMap);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncNarrowed, datesActive, distanceActive, filters.dateFrom, filters.dateTo]);

  return useMemo(() => {
    let out = syncNarrowed;
    if (datesActive) out = out.filter((r) => !blockedIds.has(r.id));
    if (distanceActive && userCoords) {
      out = out.filter((r) => {
        const c = coords.get(r.id);
        return (
          c != null && haversineKm(userCoords.lat, userCoords.lon, c.lat, c.lon) <= filters.distanceKm
        );
      });
    }
    return out;
  }, [syncNarrowed, datesActive, distanceActive, blockedIds, coords, userCoords, filters.distanceKm]);
}
