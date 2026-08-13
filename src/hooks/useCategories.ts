/**
 * Active rental categories for the home rail, ordered like the website
 * (rentzor.uz "Popular Categories"). Mirrors rentzor-marketplace's
 * useCategories minus the subcategory tree. Localized names come from the
 * i18n `categoryNames` map keyed by slug; `name` is the English DB fallback.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  sort_order: number | null;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('id, name, slug, icon_name, sort_order')
          .eq('is_active', true)
          .order('sort_order');
        if (fetchError) throw fetchError;
        if (!cancelled) {
          setCategories(data ?? []);
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
  }, []);

  return { categories, loading, error };
}
