/**
 * Items for the home "Sizga yaqin joylashgan" rail, nearest first.
 *
 * Mirrors rentzor-marketplace's useFeaturedItems location branch: with
 * coordinates it calls the get_items_by_distance RPC (server-side haversine,
 * already filtered to approved+available items that have coordinates); without
 * them it degrades to the newest-first query so the rail is never empty.
 *
 * The RPC has no radius cap — it always returns the closest N items, however
 * far. Rows farther than MAX_DISTANCE_KM are dropped here, so a user in a
 * city with no local listings (e.g. Kokand when everything is in Tashkent)
 * gets an empty rail instead of misleadingly "nearby" results hundreds of km
 * away. Only applies to the coordinate path — the no-GPS fallback has no
 * distance to cut on and is left as-is.
 *
 * Coordinates use LocationContext's `effectiveCoords` — the explicitly
 * picked address's coords when the user set one (saved location, map pick,
 * or "use current location"), else the live GPS fix. This hook never calls
 * refreshCurrent() itself, because the GPS permission prompt is meant to
 * fire when the user opens the location drawer, not when Home mounts.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../integrations/supabase/client';
import { fetchPrimaryImages } from '../lib/itemImages';

const MAX_DISTANCE_KM = 50;

export interface NearbyItem {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  deposit_amount: number;
  location: string | null;
  verified: boolean | null;
  slug: string | null;
  primary_image: string | null;
  /** Null when sorted by recency because no coordinates were available. */
  distance_km: number | null;
}

export function useNearbyItems(limit = 6) {
  const { effectiveCoords } = useLocation();
  const lat = effectiveCoords?.lat ?? null;
  const lon = effectiveCoords?.lon ?? null;

  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        let rows: Omit<NearbyItem, 'primary_image'>[];

        if (lat !== null && lon !== null) {
          // All six args are required: the DB carries both a 4-arg and a 6-arg
          // overload of this function, and PostgREST rejects a 4-arg call as
          // ambiguous (PGRST203). The region/city filters stay null — mobile
          // has no region picker. The cast is because the generated types.ts
          // predates the 6-arg migration and still describes the 4-arg form.
          const { data, error: rpcError } = await supabase.rpc('get_items_by_distance', {
            user_lat: lat,
            user_lng: lon,
            page_limit: limit,
            page_offset: 0,
            p_region_id: null,
            p_city_id: null,
          } as never);
          if (rpcError) throw rpcError;
          rows = (data ?? [])
            .filter((row) => row.distance_km <= MAX_DISTANCE_KM)
            .map((row) => ({
              id: row.id,
              title: row.title,
              category: row.category,
              price_per_day: row.price_per_day,
              deposit_amount: row.deposit_amount,
              location: row.location,
              verified: row.verified,
              slug: row.slug,
              distance_km: row.distance_km,
            }));
        } else {
          const { data, error: itemsError } = await supabase
            .from('items')
            .select('id, title, category, price_per_day, deposit_amount, location, verified, slug')
            .eq('status', 'approved')
            .eq('available', true)
            .order('created_at', { ascending: false })
            .limit(limit);
          if (itemsError) throw itemsError;
          rows = (data ?? []).map((row) => ({ ...row, distance_km: null }));
        }

        const imageMap = await fetchPrimaryImages(rows.map((row) => row.id));

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
  }, [lat, lon, limit, attempt]);

  return { items, loading, error, retry };
}
