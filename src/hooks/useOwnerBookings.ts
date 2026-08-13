/**
 * Owner-side bookings for the owner-mode "Buyurtmalar" tab. Mirrors
 * rentzor-owner's useOwnerBookings: rows where the signed-in user is the
 * owner, item title joined, renter enriched from public_profiles, plus the
 * item's primary photo. Owner earnings use the booking's frozen
 * owner_share_rate (default 90% — get_platform_fee('owner_rental_share');
 * promocodes can raise it), matching rentzor-owner's financials.ts.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';
import { fetchPrimaryImages } from '../lib/itemImages';

export const OWNER_SHARE = 0.9;

export type OwnerOrderStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface OwnerBooking {
  id: string;
  item_id: string | null;
  renter_id: string | null;
  start_date: string;
  end_date: string;
  total_days: number | null;
  rental_cost: number | null;
  total_cost: number | null;
  status: string | null;
  dispute_status: string | null;
  created_at: string | null;
  item_title: string | null;
  renter_name: string | null;
  primary_image: string | null;
  /** Owner's net take for this booking (rental minus platform commission). */
  earnings: number;
  display_status: OwnerOrderStatus;
}

/** Groups raw booking statuses into the owner filter pills. */
export function ownerOrderStatus(status: string | null): OwnerOrderStatus {
  switch (status) {
    case 'pending':
    case 'pending_owner_confirmation':
      return 'pending';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'rejected':
      return 'cancelled';
    default:
      // confirmed / in_progress / returning / overdue / disputed…
      return 'active';
  }
}

export function useOwnerBookings() {
  const { userId } = useProfile();
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
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
            'id, item_id, renter_id, start_date, end_date, total_days, rental_cost, total_cost, owner_share_rate, status, dispute_status, created_at, items ( title )',
          )
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        if (dbError) throw dbError;

        const rows = data ?? [];
        const renterIds = [
          ...new Set(rows.map((r) => r.renter_id).filter((id): id is string => id !== null)),
        ];

        const [{ data: profiles }, imageMap] = await Promise.all([
          renterIds.length
            ? supabase.from('public_profiles').select('id, full_name').in('id', renterIds)
            : Promise.resolve({ data: [] as { id: string | null; full_name: string | null }[] }),
          fetchPrimaryImages(rows.map((r) => r.item_id).filter((id): id is string => id !== null)),
        ]);

        const nameMap = new Map<string, string | null>();
        for (const p of profiles ?? []) {
          if (p.id) nameMap.set(p.id, p.full_name);
        }

        if (!cancelled) {
          setBookings(
            rows.map((row) => ({
              id: row.id,
              item_id: row.item_id,
              renter_id: row.renter_id,
              start_date: row.start_date,
              end_date: row.end_date,
              total_days: row.total_days,
              rental_cost: row.rental_cost,
              total_cost: row.total_cost,
              status: row.status,
              dispute_status: row.dispute_status,
              created_at: row.created_at,
              item_title: row.items?.title ?? null,
              renter_name: row.renter_id ? (nameMap.get(row.renter_id) ?? null) : null,
              primary_image: row.item_id ? (imageMap[row.item_id] ?? null) : null,
              earnings: Math.round((row.rental_cost ?? 0) * (row.owner_share_rate ?? OWNER_SHARE)),
              display_status: ownerOrderStatus(row.status),
            })),
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
