/**
 * Display-level owner "balance" from the signed-in user's ledger. The real
 * wallet stays the single profiles.balance — this split is only shown in
 * owner mode so earnings aren't mixed with the renter wallet (user decision
 * 2026-07-30: no backend split).
 *
 * - `total`: gross earnings — sum of owner-side entries (OWNER_TX_TYPES).
 *   Dashboard "Jami daromad" KPI.
 * - `net`: earnings minus withdrawals ('withdrawal' rows are negative) —
 *   the owner's current funds. Owner profile card and the withdraw screen
 *   show this so both always display the same number.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';
import { OWNER_TX_TYPES } from './useBalanceTransactions';

export function useOwnerBalance() {
  const { userId } = useProfile();
  const [total, setTotal] = useState(0);
  const [net, setNet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setTotal(0);
      setNet(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('balance_transactions')
          .select('amount, transaction_type')
          .eq('user_id', userId)
          .in('transaction_type', [...OWNER_TX_TYPES, 'withdrawal']);
        if (error) throw error;
        if (!cancelled) {
          const rows = data ?? [];
          const gross = rows
            .filter((r) => r.transaction_type !== 'withdrawal')
            .reduce((sum, r) => sum + r.amount, 0);
          setTotal(gross);
          setNet(rows.reduce((sum, r) => sum + r.amount, 0));
        }
      } catch {
        if (!cancelled) {
          setTotal(0);
          setNet(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  return { total, net, loading, refresh };
}
