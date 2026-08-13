/**
 * Recent search terms, persisted across restarts. Mirrors
 * rentzor-marketplace's useRecentSearches (same storage key and limit),
 * with AsyncStorage in place of localStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'rentzor_recent_searches';
const MAX_RECENT = 5;

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSearches(parsed.filter((s) => typeof s === 'string'));
      } catch {
        // Ignore corrupt stored value.
      }
    });
  }, []);

  const save = useCallback((next: string[]) => {
    setSearches(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /** Adds a term to the top, deduplicated case-insensitively, capped at 5. */
  const addSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < 2) return;
      setSearches((prev) => {
        const next = [
          trimmed,
          ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, MAX_RECENT);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removeSearch = useCallback(
    (term: string) => {
      save(searches.filter((s) => s.toLowerCase() !== term.toLowerCase()));
    },
    [searches, save],
  );

  const clearAll = useCallback(() => save([]), [save]);

  return { searches, addSearch, removeSearch, clearAll };
}
