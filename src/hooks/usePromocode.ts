/**
 * Active promocode for the profile "Promokod" screen (public.user_promocodes
 * joined with promocodes meta), mirroring rentzor-marketplace's usePromocode:
 * at most one active row per user, redeemed via the redeem_promocode RPC
 * which deactivates any previous code.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';

export interface PromocodeMeta {
  code: string;
  description: string | null;
  renter_fee_discount: number | null;
  owner_fee_discount: number | null;
}

export interface UserPromocode {
  id: string;
  benefit_expires_at: string | null;
  promocodes: PromocodeMeta | null;
}

export type PromocodeState = 'none' | 'active' | 'expired';

/** RPC failure reasons -> promocode i18n keys (same mapping as the web app). */
export type RedeemErrorKey = 'alreadyUsed' | 'limitReached' | 'invalid';

export const mapRedeemErrorKey = (message: string): RedeemErrorKey => {
  const m = message.toLowerCase();
  if (m.includes('already used')) return 'alreadyUsed';
  if (m.includes('usage limit')) return 'limitReached';
  return 'invalid';
};

export const daysLeft = (iso: string): number =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

export function usePromocode() {
  const { userId } = useProfile();
  const [promocode, setPromocode] = useState<UserPromocode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setPromocode(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // user_promocodes is absent from the generated types (types.ts lags
        // the prod schema), hence the cast — same workaround as the web app.
        const { data, error: qError } = await (supabase as any)
          .from('user_promocodes')
          .select(
            'id, benefit_expires_at, promocodes(code, description, renter_fee_discount, owner_fee_discount)',
          )
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();
        if (qError) throw qError;
        if (!cancelled) {
          setPromocode((data as UserPromocode | null) ?? null);
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

  let state: PromocodeState = 'none';
  if (promocode) {
    const exp = promocode.benefit_expires_at
      ? new Date(promocode.benefit_expires_at).getTime()
      : null;
    state = exp && exp > Date.now() ? 'active' : 'expired';
  }

  /** Throws on failure — map the message with mapRedeemErrorKey. */
  const redeem = useCallback(
    async (rawCode: string): Promise<{ days: number }> => {
      setRedeeming(true);
      try {
        const { data, error: rpcError } = await (supabase as any).rpc('redeem_promocode', {
          p_code: rawCode.trim().toUpperCase(),
        });
        if (rpcError) throw rpcError;
        refresh();
        return { days: daysLeft(data.benefit_expires_at) };
      } finally {
        setRedeeming(false);
      }
    },
    [refresh],
  );

  return { promocode, state, loading, error, redeeming, redeem, refresh };
}
