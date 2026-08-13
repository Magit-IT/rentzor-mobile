/**
 * Items for the home "Yaqinda ko‘rilgan" rail.
 *
 * Only the viewed ids are persisted (AsyncStorage, newest first, capped) —
 * the rows themselves are refetched so prices/availability stay live and
 * items that were removed or unapproved simply drop out of the rail.
 *
 * Follows useRecentSearches' storage conventions: same key prefix, dedupe on
 * write, cap on write.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { fetchPrimaryImages } from '../lib/itemImages';

const STORAGE_KEY = 'rentzor_recently_viewed';
const MAX_RECENT = 10;

export interface RecentlyViewedItem {
  id: string;
  title: string;
  price_per_day: number;
  location: string | null;
  slug: string | null;
  primary_image: string | null;
}

/** Records an item view. Safe to call from a product screen on every mount. */
export async function recordItemView(itemId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const previous: string[] = stored ? JSON.parse(stored) : [];
    const ids = Array.isArray(previous) ? previous.filter((id) => typeof id === 'string') : [];
    const next = [itemId, ...ids.filter((id) => id !== itemId)].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A dropped view is not worth surfacing to the user.
  }
}

export function useRecentlyViewed(limit = MAX_RECENT) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let ids: string[] = [];
        try {
          const parsed = stored ? JSON.parse(stored) : [];
          if (Array.isArray(parsed)) ids = parsed.filter((id) => typeof id === 'string');
        } catch {
          // Ignore corrupt stored value.
        }
        ids = ids.slice(0, limit);

        if (ids.length === 0) {
          if (!cancelled) {
            setItems([]);
            setError(null);
          }
          return;
        }

        const { data, error: itemsError } = await supabase
          .from('items')
          .select('id, title, price_per_day, location, slug')
          .in('id', ids)
          .eq('status', 'approved')
          .eq('available', true);
        if (itemsError) throw itemsError;
        const rows = data ?? [];

        const imageMap = await fetchPrimaryImages(rows.map((row) => row.id));
        const byId = new Map(rows.map((row) => [row.id, row]));

        if (!cancelled) {
          // `ids` drives the order: .in() returns rows in arbitrary order, and
          // the rail must read newest-viewed first.
          setItems(
            ids
              .map((id) => byId.get(id))
              .filter((row): row is NonNullable<typeof row> => row !== undefined)
              .map((row) => ({ ...row, primary_image: imageMap[row.id] ?? null })),
          );
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
  }, [limit, attempt]);

  return { items, loading, error, refresh };
}
