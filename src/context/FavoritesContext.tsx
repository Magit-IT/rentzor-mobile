/**
 * Saved-items (favorites) state shared across screens. Mirrors
 * rentzor-marketplace's useFavorites/useToggleFavorite: the favorites
 * table keyed by user_id with an optimistic toggle that rolls back on
 * error. Adapted for React Native — while there is no Supabase session
 * (the auth flow isn't wired yet) the set persists via AsyncStorage,
 * following LocationContext's storage pattern, so saving still works;
 * once a session exists the server copy is the source of truth.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

const SAVED_ITEMS_KEY = 'rentzor_saved_items';

interface FavoritesContextValue {
  savedIds: Set<string>;
  /** True until the initial load (server or AsyncStorage) resolves. */
  loading: boolean;
  isSaved: (itemId: string) => boolean;
  toggleSaved: (itemId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  savedIds: new Set(),
  loading: true,
  isSaved: () => false,
  toggleSaved: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const savedIdsRef = useRef(savedIds);
  savedIdsRef.current = savedIds;
  // undefined = session not resolved yet, so the first applySession(null)
  // still triggers the initial load.
  const userIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    // Same query as the marketplace's useFavorites: only favorites whose
    // item is still approved and available.
    const loadFromServer = async (userId: string) => {
      const { data, error } = await supabase
        .from('favorites')
        .select('item_id, items!inner(available, status)')
        .eq('user_id', userId)
        .eq('items.available', true)
        .eq('items.status', 'approved');
      if (!cancelled && !error) {
        setSavedIds(new Set((data ?? []).map((f) => f.item_id)));
      }
      if (!cancelled) setLoading(false);
    };

    const loadFromStorage = async () => {
      const stored = await AsyncStorage.getItem(SAVED_ITEMS_KEY);
      if (cancelled) return;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setSavedIds(new Set(parsed));
        } catch {
          // Ignore corrupt stored value.
        }
      }
      setLoading(false);
    };

    const applySession = (userId: string | null) => {
      if (userId === userIdRef.current) return;
      userIdRef.current = userId;
      if (userId) loadFromServer(userId);
      else loadFromStorage();
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) applySession(data.session?.user.id ?? null);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const apply = useCallback((itemId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(itemId);
      else next.delete(itemId);
      if (!userIdRef.current) {
        AsyncStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify([...next]));
      }
      return next;
    });
  }, []);

  const toggleSaved = useCallback(
    (itemId: string) => {
      const wasSaved = savedIdsRef.current.has(itemId);
      apply(itemId, !wasSaved);

      const userId = userIdRef.current;
      if (!userId) return;

      (async () => {
        const { error } = wasSaved
          ? await supabase
              .from('favorites')
              .delete()
              .eq('user_id', userId)
              .eq('item_id', itemId)
          : await supabase.from('favorites').insert({ user_id: userId, item_id: itemId });
        if (error) apply(itemId, wasSaved);
      })();
    },
    [apply],
  );

  const value = useMemo(
    () => ({
      savedIds,
      loading,
      isSaved: (itemId: string) => savedIds.has(itemId),
      toggleSaved,
    }),
    [savedIds, loading, toggleSaved],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
