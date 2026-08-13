/**
 * One-shot "seen the intro carousel" flag. Guests can now browse without
 * an account (see app/_layout.tsx), so the splash needs to know whether to
 * show onboarding or go straight to the home tab — without this flag a
 * signed-out user would re-watch the carousel on every cold start.
 * AsyncStorage, matching LocationContext/FavoritesContext persistence.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = 'rentzor_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1').catch(() => {});
}
