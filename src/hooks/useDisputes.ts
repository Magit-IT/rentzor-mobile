/**
 * Disputes for the "Nizolar" screens — bookings carrying a dispute
 * (bookings.dispute_status: 'open' | 'resolved_renter' | 'resolved_owner' |
 * 'resolved_partial') where the signed-in user is either party. The item
 * title comes via the items FK; the primary photo via item_images.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';
import { fetchPrimaryImages } from '../lib/itemImages';

export interface Dispute {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number | null;
  total_cost: number | null;
  dispute_status: string;
  dispute_reason: string | null;
  disputed_at: string | null;
  resolution_notes: string | null;
  item_title: string | null;
  item_image: string | null;
}

/** "DSP-53F59860" — the short id shown on cards and as the detail title. */
export const disputeCode = (bookingId: string) =>
  `DSP-${bookingId.slice(0, 8).toUpperCase()}`;

const SELECT =
  'id, start_date, end_date, total_days, total_cost, dispute_status, dispute_reason, disputed_at, resolution_notes, item_id, items ( title )';

interface DisputeRow {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number | null;
  total_cost: number | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  disputed_at: string | null;
  resolution_notes: string | null;
  item_id: string | null;
  items: { title: string } | null;
}

async function withImages(rows: DisputeRow[]): Promise<Dispute[]> {
  const imageMap = await fetchPrimaryImages(
    rows.map((row) => row.item_id).filter((id): id is string => id !== null),
  );
  return rows.map((row) => ({
    id: row.id,
    start_date: row.start_date,
    end_date: row.end_date,
    total_days: row.total_days,
    total_cost: row.total_cost,
    dispute_status: row.dispute_status ?? 'open',
    dispute_reason: row.dispute_reason,
    disputed_at: row.disputed_at,
    resolution_notes: row.resolution_notes,
    item_title: row.items?.title ?? null,
    item_image: row.item_id ? (imageMap[row.item_id] ?? null) : null,
  }));
}

export function useDisputes() {
  const { userId } = useProfile();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setDisputes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select(SELECT)
          .not('dispute_status', 'is', null)
          .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
          .order('disputed_at', { ascending: false });
        if (dbError) throw dbError;
        const rows = await withImages((data ?? []) as DisputeRow[]);
        if (!cancelled) {
          setDisputes(rows);
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

  return { disputes, loading, error, refresh };
}

export function useDispute(bookingId: string | undefined) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // RLS scopes bookings to their parties, so no explicit user filter.
        const { data, error } = await supabase
          .from('bookings')
          .select(SELECT)
          .eq('id', bookingId)
          .maybeSingle();
        if (error) throw error;
        const rows = data ? await withImages([data as DisputeRow]) : [];
        if (!cancelled) setDispute(rows[0] ?? null);
      } catch {
        if (!cancelled) setDispute(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return { dispute, loading };
}
