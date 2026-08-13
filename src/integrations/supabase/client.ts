/**
 * Supabase client for the rentzor-marketplace backend (self-hosted at
 * supabase.rentzor.uz). Mirrors rentzor-marketplace/src/integrations/supabase
 * but adapted for React Native: tokens persist in SecureStore (Keychain /
 * Keystore) and token auto-refresh follows the app foreground/background state.
 *
 * Usage: import { supabase } from '../integrations/supabase/client';
 */
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * SecureStore is backed by the iOS keychain, which has historically rejected
 * values over ~2048 bytes. A full session serialises to ~1.7kB — under the
 * limit, but not by enough to trust: user_metadata grows and each extra OAuth
 * identity adds a few hundred bytes. So only the tokens live here (~800B) and
 * the `user` object is split into AsyncStorage via the `userStorage` option
 * below, which keeps this value structurally small rather than incidentally so.
 */
const secureStorage: SupportedStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

/**
 * Sessions written by earlier builds live in AsyncStorage. Without this, an
 * upgrade would read an empty SecureStore and silently sign everyone out.
 * Moves the token payload across on first read, then clears the plaintext copy.
 */
const migratingSecureStorage: SupportedStorage = {
  ...secureStorage,
  async getItem(key) {
    const secure = await SecureStore.getItemAsync(key);
    if (secure !== null) return secure;

    const legacy = await AsyncStorage.getItem(key);
    if (legacy === null) return null;

    try {
      await SecureStore.setItemAsync(key, legacy);
    } catch {
      // Keep the legacy copy so the user stays signed in and we retry next launch.
      return legacy;
    }
    await AsyncStorage.removeItem(key);
    return legacy;
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: migratingSecureStorage,
    // Non-sensitive profile data, and the bulk of the payload — plain storage
    // keeps it clear of the keychain size limit. Kept under `storageKey-user`.
    userStorage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Supabase recommends refreshing tokens only while the app is foregrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
