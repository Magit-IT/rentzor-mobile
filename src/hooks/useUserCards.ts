/**
 * Saved payment cards (public.user_cards, written by the paylov-create-card /
 * paylov-confirm-card edge functions). Mirrors rentzor-marketplace's
 * useUserCards: own rows only, newest first.
 *
 * Paylov conventions: vendor is "Uzcard" / "Humo", expire_date is YYMM,
 * masked_number is the full masked PAN (e.g. "860049******4242").
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';

export interface UserCard {
  id: string;
  paylov_card_id: string;
  card_name: string | null;
  masked_number: string;
  owner_name: string;
  expire_date: string;
  vendor: string;
  is_active: boolean;
}

/** "2709" (YYMM from Paylov) -> "09/27"; anything unexpected passes through. */
export function formatExpireDate(yymm: string): string {
  if (yymm.length !== 4) return yymm;
  return `${yymm.slice(2, 4)}/${yymm.slice(0, 2)}`;
}

export function useUserCards() {
  const { userId } = useProfile();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: cardsError } = await supabase
          .from('user_cards')
          .select('id, paylov_card_id, card_name, masked_number, owner_name, expire_date, vendor, is_active')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (cardsError) throw cardsError;
        if (!cancelled) {
          setCards(data ?? []);
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

  return { cards, loading, error, refresh };
}
