/**
 * Full item detail for the product screen, fetched by item id. Mirrors
 * rentzor-marketplace's useItem: the item row plus its images (ordered),
 * the owner's public profile, public renter reviews (with reviewer name /
 * avatar), and up to 3 similar items from the same category.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface ItemImage {
  id: string;
  image_url: string;
  is_primary: boolean | null;
  image_order: number | null;
}

export interface ItemOwner {
  id: string;
  full_name: string | null;
  rating: number | null;
  verified: boolean | null;
  avatar_url: string | null;
  created_at: string | null;
  total_rentals: number | null;
  // Booking window used by the product picker: which hourly slots are
  // "preferred" (auto-confirm) and whether auto-confirm is on at all.
  auto_confirm_enabled: boolean | null;
  available_from_time: string | null;
  available_to_time: string | null;
  min_prebook_notice_hours: number | null;
}

export interface ItemReview {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
}

export interface SimilarItem {
  id: string;
  title: string;
  location: string | null;
  price_per_day: number;
  primary_image: string | null;
}

export interface ItemDetail {
  id: string;
  owner_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  price_per_day: number;
  deposit_amount: number;
  equipment_value: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean | null;
  available: boolean | null;
  images: ItemImage[];
  owner: ItemOwner | null;
  reviews: ItemReview[];
  rating: number | null;
  review_count: number;
  similar: SimilarItem[];
}

export function useItem(id: string | undefined) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data: row, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
        if (itemError) throw itemError;

        const [imagesRes, ownerRes, reviewsRes, similarRes] = await Promise.all([
          supabase
            .from('item_images')
            .select('id, image_url, is_primary, image_order')
            .eq('item_id', row.id)
            .order('image_order', { ascending: true }),
          row.owner_id
            ? supabase
                .from('public_profiles')
                .select(
                  'id, full_name, rating, verified, avatar_url, created_at, total_rentals, available_from_time, available_to_time, auto_confirm_enabled, min_prebook_notice_hours',
                )
                .eq('id', row.owner_id)
                .single()
            : Promise.resolve({ data: null }),
          supabase
            .from('reviews')
            .select('id, rating, comment, created_at, reviewer:public_profiles!reviewer_id(full_name, avatar_url)')
            .eq('item_id', row.id)
            .eq('visibility', 'public')
            .eq('review_type', 'renter_to_owner')
            .order('created_at', { ascending: false }),
          supabase
            .from('items')
            .select('id, title, location, price_per_day')
            .eq('category', row.category)
            .eq('status', 'approved')
            .eq('available', true)
            .neq('id', row.id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const reviews = (reviewsRes.data ?? []) as unknown as ItemReview[];
        const ratings = reviews.filter((r) => r.rating != null).map((r) => r.rating as number);
        const rating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;

        const similarRows = similarRes.data ?? [];
        const similarImages: Record<string, string> = {};
        if (similarRows.length > 0) {
          const { data: images } = await supabase
            .from('item_images')
            .select('item_id, image_url')
            .in('item_id', similarRows.map((s) => s.id))
            .eq('is_primary', true);
          for (const img of images ?? []) {
            if (img.item_id) similarImages[img.item_id] = img.image_url;
          }
        }

        if (!cancelled) {
          setItem({
            id: row.id,
            owner_id: row.owner_id,
            slug: row.slug,
            title: row.title,
            description: row.description,
            category: row.category,
            price_per_day: row.price_per_day,
            deposit_amount: row.deposit_amount,
            equipment_value: row.equipment_value,
            location: row.location,
            latitude: row.latitude,
            longitude: row.longitude,
            verified: row.verified,
            available: row.available,
            images: imagesRes.data ?? [],
            owner: (ownerRes.data as ItemOwner | null) ?? null,
            reviews,
            rating,
            review_count: reviews.length,
            similar: similarRows.map((s) => ({ ...s, primary_image: similarImages[s.id] ?? null })),
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
  }, [id]);

  return { item, loading, error };
}
