/**
 * Signed-in user's profile row (public.profiles), shared by the Profile
 * tab, the personal-information screen and the product booking gate.
 * Follows the Supabase session like FavoritesContext: loads on start-up
 * and whenever auth state changes; null while signed out. RLS "Users can
 * view own full profile" scopes the query to the current user.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  verified: boolean | null;
  myid_verified: boolean | null;
  telegram_verified: boolean | null;
  avatar_url: string | null;
  balance: number | null;
  /** Reserved for pending bookings — not spendable. See useProfile's availableBalance. */
  held_balance: number | null;
  /** Average review rating received as an owner; null when unreviewed. */
  rating: number | null;
}

interface ProfileContextValue {
  /** Supabase auth user id; null while signed out. */
  userId: string | null;
  profile: Profile | null;
  /** True until the initial session + profile load resolves. */
  loading: boolean;
  myIdVerified: boolean;
  /** Re-fetches the profile row (e.g. after verification or top-up). Await it before navigating away if the destination reads profile/myIdVerified immediately, since the fetch is async. */
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  userId: null,
  profile: null,
  loading: true,
  myIdVerified: false,
  refresh: () => Promise.resolve(),
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null | undefined>(undefined);

  const load = useCallback(async (id: string | null) => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, verified, myid_verified, telegram_verified, avatar_url, balance, held_balance, rating')
      .eq('id', id)
      .maybeSingle();
    if (!error) setProfile(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const applySession = (id: string | null) => {
      if (id === userIdRef.current) return;
      userIdRef.current = id;
      setUserId(id);
      load(id);
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session?.user.id ?? null);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user.id ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [load]);

  // Stable identity independent of `profile` -- refresh() itself causes
  // `profile` to change, so deriving it inside the value's useMemo (which
  // depends on `profile`) would give consumers a new function every fetch,
  // defeating effects like useFocusEffect(() => refresh(), [refresh]).
  const refresh = useCallback(() => load(userIdRef.current ?? null), [load]);

  const value = useMemo(
    () => ({
      userId,
      profile,
      loading,
      myIdVerified: profile?.myid_verified === true,
      refresh,
    }),
    [userId, profile, loading, refresh],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => useContext(ProfileContext);
