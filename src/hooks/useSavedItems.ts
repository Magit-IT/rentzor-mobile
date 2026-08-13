/**
 * Item details for the Saved tab. Mirrors rentzor-marketplace's
 * useFavoriteItems — items (approved & available only) with their primary
 * image plus the average public renter→owner review rating — but takes
 * the ids from FavoritesContext so it also covers local (signed-out)
 * favorites. Fetched details are cached per id, so toggling a bookmark
 * on the page doesn't refetch; ids whose item no longer passes the
 * filters resolve to null and are hidden, like the web query.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface SavedItem {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  location: string | null;
  primary_image: string | null;
  rating: number | null;
  review_count: number;
}

export function useSavedItems(savedIds: Set<string>) {
  const [cache, setCache] = useState<Record<string, SavedItem | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const idsKey = useMemo(() => [...savedIds].sort().join(','), [savedIds]);

  useEffect(() => {
    const missing = idsKey.split(',').filter((id) => id && !(id in cacheRef.current));
    if (missing.length === 0) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: itemsError } = await supabase
          .from('items')
          .select('id, title, category, price_per_day, location, item_images(image_url, is_primary)')
          .in('id', missing)
          .eq('available', true)
          .eq('status', 'approved');
        if (itemsError) throw itemsError;
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

        if (!cancelled) {
          setCache((prev) => {
            const next = { ...prev };
            for (const id of missing) next[id] = null;
            for (const row of rows) {
              const primary =
                row.item_images.find((img) => img.is_primary) ?? row.item_images[0];
              next[row.id] = {
                id: row.id,
                title: row.title,
                category: row.category,
                price_per_day: row.price_per_day,
                location: row.location,
                primary_image: primary?.image_url ?? null,
                rating: ratings[row.id] ? ratings[row.id].sum / ratings[row.id].count : null,
                review_count: ratings[row.id]?.count ?? 0,
              };
            }
            return next;
          });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const items = useMemo(
    () =>
      [...savedIds]
        .map((id) => cache[id])
        .filter((item): item is SavedItem => item != null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idsKey, cache],
  );

  return { items, loading, error };
}
