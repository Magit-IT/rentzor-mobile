/**
 * Newest approved & available items for the home "Tavsiya qilinadi" grid.
 * Mirrors rentzor-marketplace's useFeaturedItems fallback query
 * (items filtered by status/available, newest first) plus each item's
 * primary image from item_images.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface FeaturedItem {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  deposit_amount: number;
  location: string | null;
  verified: boolean | null;
  owner_id: string | null;
  slug: string | null;
  primary_image: string | null;
}

export function useFeaturedItems(limit = 6) {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: itemsError } = await supabase
          .from('items')
          .select('id, title, category, price_per_day, deposit_amount, location, verified, owner_id, slug')
          .eq('status', 'approved')
          .eq('available', true)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (itemsError) throw itemsError;
        const rows = data ?? [];

        const imageMap: Record<string, string> = {};
        if (rows.length > 0) {
          const { data: images } = await supabase
            .from('item_images')
            .select('item_id, image_url')
            .in('item_id', rows.map((row) => row.id))
            .eq('is_primary', true);
          for (const img of images ?? []) {
            if (img.item_id) imageMap[img.item_id] = img.image_url;
          }
        }

        if (!cancelled) {
          setItems(rows.map((row) => ({ ...row, primary_image: imageMap[row.id] ?? null })));
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

  return { items, loading, error, retry };
}
