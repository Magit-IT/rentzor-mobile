/**
 * Renter-side bookings for the "Buyurtmalar" tab. Mirrors rentzor-marketplace's
 * useRenterBookings (mobile is the renter-facing app, same as rz1): own rows
 * as renter, item joined for title/location, owner enriched from
 * public_profiles + the get_booking_party_phone RPC (no RLS, no sensitive
 * columns exposed directly). Adds the item's primary photo, which the web
 * query doesn't need since it uses a different thumbnail source.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';
import { fetchPrimaryImages } from '../lib/itemImages';

export interface BookingOwner {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface Booking {
  id: string;
  item_id: string | null;
  owner_id: string | null;
  start_date: string;
  end_date: string;
  total_days: number | null;
  rental_cost: number | null;
  total_cost: number | null;
  status: string | null;
  dispute_status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  item: {
    title: string;
    location: string | null;
  } | null;
  owner: BookingOwner | null;
  primary_image: string | null;
}

interface BookingRow {
  id: string;
  item_id: string | null;
  owner_id: string | null;
  start_date: string;
  end_date: string;
  total_days: number | null;
  rental_cost: number | null;
  total_cost: number | null;
  status: string | null;
  dispute_status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  items: { title: string; location: string | null } | null;
}

async function enrichWithOwners(rows: BookingRow[]): Promise<Omit<Booking, 'primary_image'>[]> {
  const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter((id): id is string => id !== null))];

  const [{ data: profiles }, phoneResults] = await Promise.all([
    ownerIds.length
      ? supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }),
    Promise.all(
      ownerIds.map(async (id) => {
        const { data } = await supabase.rpc('get_booking_party_phone', { p_other_user_id: id });
        return { id, phone: data as string | null };
      }),
    ),
  ]);

  const ownerMap = new Map<string, BookingOwner>();
  for (const id of ownerIds) {
    const pub = profiles?.find((p) => p.id === id);
    const ph = phoneResults.find((p) => p.id === id);
    ownerMap.set(id, {
      full_name: pub?.full_name ?? null,
      avatar_url: pub?.avatar_url ?? null,
      phone: ph?.phone ?? null,
    });
  }

  return rows.map((row) => ({
    id: row.id,
    item_id: row.item_id,
    owner_id: row.owner_id,
    start_date: row.start_date,
    end_date: row.end_date,
    total_days: row.total_days,
    rental_cost: row.rental_cost,
    total_cost: row.total_cost,
    status: row.status,
    dispute_status: row.dispute_status,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    confirmed_at: row.confirmed_at,
    item: row.items,
    owner: row.owner_id ? (ownerMap.get(row.owner_id) ?? null) : null,
  }));
}

export function useBookings() {
  const { userId } = useProfile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select(
            'id, item_id, owner_id, start_date, end_date, total_days, rental_cost, total_cost, status, dispute_status, rejection_reason, created_at, confirmed_at, items ( title, location )',
          )
          .eq('renter_id', userId)
          .order('created_at', { ascending: false });
        if (dbError) throw dbError;

        const rows = (data ?? []) as BookingRow[];
        const [enriched, imageMap] = await Promise.all([
          enrichWithOwners(rows),
          fetchPrimaryImages(rows.map((r) => r.item_id).filter((id): id is string => id !== null)),
        ]);

        if (!cancelled) {
          setBookings(
            enriched.map((b) => ({ ...b, primary_image: b.item_id ? (imageMap[b.item_id] ?? null) : null })),
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
  }, [userId, attempt]);

  return { bookings, loading, error, refresh };
}

export async function cancelBooking(bookingId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('renter_cancel_booking', { p_booking_id: bookingId });
  return { error: error ? error.message : null };
}

export async function openDispute(
  bookingId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('renter_open_dispute', {
    p_booking_id: bookingId,
    p_dispute_reason: reason,
  });
  return { error: error ? error.message : null };
}
