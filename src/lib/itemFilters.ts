/**
 * Shared helpers for applying the Filter sheet's date and distance filters
 * to item lists. Dates mirror the web's availability rule
 * (rentzor-marketplace useItemAvailability): an item is unavailable for a
 * range when a confirmed/pending booking overlaps it or a manually blocked
 * unavailable_date falls inside it. Distance is a plain haversine against
 * the item's latitude/longitude.
 */
import { supabase } from '../integrations/supabase/client';

/** Date -> "YYYY-MM-DD" in local time (bookings store wall dates). */
export const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Ids from `itemIds` that are NOT available for [from, to] — blocked by an
 * overlapping confirmed/pending booking or a manual unavailable_date.
 * A single-sided range is treated as that one day.
 */
export async function fetchDateBlockedIds(
  itemIds: string[],
  from: Date | null,
  to: Date | null,
): Promise<Set<string>> {
  const blocked = new Set<string>();
  const start = from ?? to;
  const end = to ?? from;
  if (itemIds.length === 0 || !start || !end) return blocked;
  const startYmd = toYmd(start);
  const endYmd = toYmd(end);

  const [{ data: bookings }, { data: manual }] = await Promise.all([
    supabase
      .from('bookings')
      .select('item_id')
      .in('item_id', itemIds)
      .in('status', ['confirmed', 'pending'])
      .lte('start_date', endYmd)
      .gte('end_date', startYmd),
    supabase
      .from('unavailable_dates')
      .select('item_id')
      .in('item_id', itemIds)
      .gte('unavailable_date', startYmd)
      .lte('unavailable_date', endYmd),
  ]);
  for (const row of bookings ?? []) if (row.item_id) blocked.add(row.item_id);
  for (const row of manual ?? []) if (row.item_id) blocked.add(row.item_id);
  return blocked;
}

/** latitude/longitude per item id, for lists whose source lacks coords. */
export async function fetchItemCoords(
  itemIds: string[],
): Promise<Map<string, { lat: number; lon: number }>> {
  const coords = new Map<string, { lat: number; lon: number }>();
  if (itemIds.length === 0) return coords;
  const { data } = await supabase
    .from('items')
    .select('id, latitude, longitude')
    .in('id', itemIds);
  for (const row of data ?? []) {
    if (row.latitude != null && row.longitude != null) {
      coords.set(row.id, { lat: row.latitude, lon: row.longitude });
    }
  }
  return coords;
}
