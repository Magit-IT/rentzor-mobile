/**
 * Balance ledger rows for "To'lovlar tarixi" (public.balance_transactions,
 * written by the internal_adjust_balance money-integrity machinery). Mirrors
 * rentzor-marketplace's useBalanceTransactions: own rows, newest first with
 * balance_after as the tiebreak so same-timestamp entries (charge + fee from
 * one event) keep their ledger order, capped at 100.
 *
 * `amount` is signed: positive = credit, negative = debit.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';

export interface BalanceTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string | null;
}

/**
 * transaction_type values written for the owner side of a booking (see
 * internal_adjust_balance call sites in the DB functions). Top-ups and
 * withdrawals are wallet-level, not role-specific, so they're excluded.
 * dispute_compensation can credit either party; without a role column it's
 * grouped with owner income here.
 */
export const OWNER_TX_TYPES = [
  'owner_payout',
  'owner_rental_share',
  'payout',
  'late_fee_payout',
  'cancellation_fee',
  'dispute_partial_owner',
  'dispute_compensation',
];

export function useBalanceTransactions({ ownerOnly = false }: { ownerOnly?: boolean } = {}) {
  const { userId } = useProfile();
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        let query = supabase
          .from('balance_transactions')
          .select('id, amount, transaction_type, reference_type, reference_id, description, created_at')
          .eq('user_id', userId);
        if (ownerOnly) query = query.in('transaction_type', OWNER_TX_TYPES);
        const { data, error: txError } = await query
          .order('created_at', { ascending: false })
          .order('balance_after', { ascending: false })
          .limit(100);
        if (txError) throw txError;
        if (!cancelled) {
          setTransactions(data ?? []);
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
  }, [userId, attempt, ownerOnly]);

  return { transactions, loading, error, refresh };
}
