/**
 * Item search over the `search_items_enhanced` RPC (trigram similarity +
 * category term matching + spelling suggestion). Mirrors
 * rentzor-marketplace's useSearch/useSearchAutocomplete: the query is
 * debounced 300ms, needs ≥2 chars, and results are enriched with each
 * item's average public renter→owner review rating. Pages append for
 * infinite scroll instead of the web's numbered pagination.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export const MIN_SEARCH_LENGTH = 2;
const PAGE_SIZE = 20;
const SIMILARITY_THRESHOLD = 0.3;
const DEBOUNCE_MS = 300;

export interface SearchResultItem {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price_per_day: number;
  location: string | null;
  primary_image: string | null;
  rating: number | null;
  review_count: number;
}

async function fetchSearchPage(term: string, offset: number) {
  const { data, error } = await supabase.rpc('search_items_enhanced', {
    search_term: term,
    similarity_threshold: SIMILARITY_THRESHOLD,
    result_limit: PAGE_SIZE,
    result_offset: offset,
  });
  if (error) throw error;
  const rows = data ?? [];

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

  return {
    items: rows.map((row): SearchResultItem => ({
      id: row.id,
      title: row.title,
      category: row.category,
      subcategory: row.subcategory,
      price_per_day: row.price_per_day,
      location: row.location,
      primary_image: row.primary_image,
      rating: ratings[row.id] ? ratings[row.id].sum / ratings[row.id].count : null,
      review_count: ratings[row.id]?.count ?? 0,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
    suggestedCorrection: rows[0]?.suggested_correction ?? null,
  };
}

export function useItemSearch(rawQuery: string) {
  const trimmed = rawQuery.trim();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [suggestedCorrection, setSuggestedCorrection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(trimmed);
      setPage(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [trimmed]);

  const active = query.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!active) {
      setResults([]);
      setTotalCount(0);
      setSuggestedCorrection(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (page === 0 ? setLoading : setLoadingMore)(true);

    (async () => {
      try {
        const data = await fetchSearchPage(query, page * PAGE_SIZE);
        if (!cancelled) {
          setResults((prev) => (page === 0 ? data.items : [...prev, ...data.items]));
          setTotalCount(data.totalCount);
          setSuggestedCorrection(data.suggestedCorrection);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, query, page]);

  const hasMore = results.length < totalCount;
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) setPage((p) => p + 1);
  }, [hasMore, loading, loadingMore]);

  return {
    /** True once the debounced query is long enough to search. */
    active,
    results,
    totalCount,
    /** RPC's spelling suggestion, e.g. "velosiped" for "velasiped". */
    suggestedCorrection,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
}
