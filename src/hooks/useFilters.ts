/**
 * Search filter state for the FilterSheet (Figma "Filter" 293:12159):
 * category, price range, date range, distance and rating. Held in the
 * search screen so results can react to it; `activeCount` drives the
 * badge on the filter button.
 */
import { useMemo, useState } from 'react';

export const PRICE_MIN = 50_000;
export const PRICE_MAX = 150_000;
export const DEFAULT_DISTANCE_KM = 4;

/**
 * The picked category. Only subcategories are selectable, so `parentSlug` is
 * the top-level category slug (for `items.category`), `slug` is the
 * subcategory slug (for `items.subcategory`), and `name` is the already-
 * localized label to show in the Filter row.
 */
export interface SelectedCategory {
  parentSlug: string;
  slug: string;
  name: string;
}

export interface FilterState {
  category: SelectedCategory | null;
  priceMin: number;
  priceMax: number;
  dateFrom: Date | null;
  dateTo: Date | null;
  distanceKm: number;
  rating: number;
}

export const DEFAULT_FILTERS: FilterState = {
  category: null,
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  dateFrom: null,
  dateTo: null,
  distanceKm: DEFAULT_DISTANCE_KM,
  rating: 0,
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<FilterState>(DEFAULT_FILTERS);

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.category != null) count += 1;
    if (filters.priceMin !== PRICE_MIN || filters.priceMax !== PRICE_MAX) count += 1;
    if (filters.dateFrom != null || filters.dateTo != null) count += 1;
    if (filters.distanceKm !== DEFAULT_DISTANCE_KM) count += 1;
    if (filters.rating > 0) count += 1;
    return count;
  }, [filters]);

  const openDraft = () => setDraft(filters);
  const apply = () => setFilters(draft);
  const reset = () => setDraft(DEFAULT_FILTERS);

  return { filters, activeCount, draft, setDraft, openDraft, apply, reset };
}
