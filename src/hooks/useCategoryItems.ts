/**
 * Approved & available items of one category (optionally narrowed to a
 * subcategory), newest first. Mirrors rentzor-marketplace's
 * useCategoryItems: same filters, item_images!inner join for the primary
 * image and average public renter→owner review rating per item. Pages
 * append for infinite scroll instead of the web's numbered pagination.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

const PAGE_SIZE = 20;

export interface CategoryItem {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  location: string | null;
  primary_image: string | null;
  rating: number | null;
  review_count: number;
}

async function fetchCategoryPage(category: string, subcategory: string | null, page: number) {
  const from = page * PAGE_SIZE;

  let query = supabase
    .from('items')
    .select(
      'id, title, category, price_per_day, location, item_images!inner(image_url, is_primary)',
      { count: 'exact' },
    )
    .eq('available', true)
    .eq('status', 'approved')
    .eq('category', category)
    .order('created_at', { ascending: false });
  if (subcategory) query = query.eq('subcategory', subcategory);

  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
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
    items: rows.map((row): CategoryItem => {
      const primary = row.item_images.find((img) => img.is_primary) ?? row.item_images[0];
      return {
        id: row.id,
        title: row.title,
        category: row.category,
        price_per_day: row.price_per_day,
        location: row.location,
        primary_image: primary?.image_url ?? null,
        rating: ratings[row.id] ? ratings[row.id].sum / ratings[row.id].count : null,
        review_count: ratings[row.id]?.count ?? 0,
      };
    }),
    totalCount: count ?? 0,
  };
}

export function useCategoryItems(category: string, subcategory: string | null = null) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restart from the first page when the category/subcategory changes.
  useEffect(() => setPage(0), [category, subcategory]);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    (page === 0 ? setLoading : setLoadingMore)(true);

    (async () => {
      try {
        const data = await fetchCategoryPage(category, subcategory, page);
        if (!cancelled) {
          setItems((prev) => (page === 0 ? data.items : [...prev, ...data.items]));
          setTotalCount(data.totalCount);
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
  }, [category, subcategory, page]);

  const hasMore = items.length < totalCount;
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) setPage((p) => p + 1);
  }, [hasMore, loading, loadingMore]);

  return { items, totalCount, loading, loadingMore, error, hasMore, loadMore };
}
