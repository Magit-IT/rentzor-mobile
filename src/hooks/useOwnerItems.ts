/**
 * Owner-side listings for the owner-mode "Mahsulotlarim" tab. Mirrors
 * rentzor-owner's useOwnerItems: own items with the primary photo joined in.
 * Display status matches the web app's getStatus(): drafts/pending/rejected
 * pass through, everything approved-or-legacy is "active".
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';
import { fetchPrimaryImages } from '../lib/itemImages';

export type OwnerItemStatus = 'active' | 'pending' | 'draft' | 'rejected';

export interface OwnerItem {
  id: string;
  title: string;
  price_per_day: number;
  available: boolean | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  primary_image: string | null;
  display_status: OwnerItemStatus;
}

function displayStatus(status: string | null): OwnerItemStatus {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'pending':
      return 'pending';
    case 'rejected':
      return 'rejected';
    default:
      return 'active';
  }
}

export function useOwnerItems() {
  const { userId } = useProfile();
  const [items, setItems] = useState<OwnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('items')
          .select('id, title, price_per_day, available, status, rejection_reason, created_at')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        if (dbError) throw dbError;

        const rows = data ?? [];
        const imageMap = await fetchPrimaryImages(rows.map((r) => r.id));

        if (!cancelled) {
          setItems(
            rows.map((row) => ({
              ...row,
              primary_image: imageMap[row.id] ?? null,
              display_status: displayStatus(row.status),
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

  return { items, loading, error, refresh };
}
