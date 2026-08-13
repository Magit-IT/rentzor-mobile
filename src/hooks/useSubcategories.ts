/**
 * One category (by slug) with its active subcategories, for the category
 * screen title and subcategory filter chips. Mirrors the subcategory tree
 * part of rentzor-marketplace's useCategories, scoped to a single category.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export function useSubcategories(categorySlug: string) {
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  // The slug the above state was fetched for — lets callers tell "no
  // subcategories" apart from "haven't fetched this slug yet", which a plain
  // `loading` flag can't do on the render right after the slug changes (state
  // updates, including setLoading, don't apply until the render after next).
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const loading = categorySlug !== '' && loadedSlug !== categorySlug;

  useEffect(() => {
    if (!categorySlug) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: category, error: catError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('slug', categorySlug)
          .maybeSingle();
        if (catError) throw catError;
        if (!category) return;

        const { data: subs, error: subError } = await supabase
          .from('subcategories')
          .select('id, name, slug')
          .eq('category_id', category.id)
          .eq('is_active', true)
          .order('sort_order');
        if (subError) throw subError;

        if (!cancelled) {
          setCategoryName(category.name);
          setSubcategories(subs ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoadedSlug(categorySlug);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  return { categoryName, subcategories, loading, error };
}
