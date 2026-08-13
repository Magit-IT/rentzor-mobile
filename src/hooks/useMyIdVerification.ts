/**
 * Latest successful MyID verification of the signed-in user — the passport
 * data shown on the "My ID" tab of the personal-information screen. RLS
 * ("Users can view own verifications") scopes the query; pending/failed
 * attempts are skipped.
 */
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';

export interface MyIdVerification {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  birth_date: string | null;
  gender: string | null;
  nationality: string | null;
  citizenship: string | null;
  pass_data: string | null;
  expiry_date: string | null;
  pinfl: string | null;
  permanent_address: string | null;
  temporary_address: string | null;
  region: string | null;
  district: string | null;
  completed_at: string | null;
}

export function useMyIdVerification() {
  const { userId } = useProfile();
  const [verification, setVerification] = useState<MyIdVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    if (!userId) {
      setVerification(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('myid_verifications')
        .select(
          'first_name, middle_name, last_name, first_name_en, last_name_en, birth_date, gender, nationality, citizenship, pass_data, expiry_date, pinfl, permanent_address, temporary_address, region, district, completed_at',
        )
        .eq('user_id', userId)
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        if (!error) setVerification(data ?? null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((n) => n + 1), []);

  return { verification, loading, refetch };
}
