/**
 * Active theme (light/dark). Defaults to the system color scheme; the
 * settings screen can override it explicitly ("Tungi rejim" toggle) and the
 * choice persists across restarts via AsyncStorage. Dark
 * tokens come from the Figma dark-mode sections (539:*). Themed screens and
 * shared components read it via useTheme(); screens not yet migrated still
 * import the static light `colors` from theme.ts.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, themes } from '../theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const PREFERENCE_KEY = 'theme-preference';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.light,
  preference: 'system',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(PREFERENCE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
      }
    });
  }, []);

  const scheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({
      theme: themes[scheme],
      preference,
      setPreference: (next: ThemePreference) => {
        setPreferenceState(next);
        AsyncStorage.setItem(PREFERENCE_KEY, next);
      },
    }),
    [scheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;

/**
 * Theme-dependent StyleSheet: `const styles = useThemedStyles(makeStyles)`
 * where `makeStyles = (t: Theme) => StyleSheet.create({...})` at module scope.
 */
export function useThemedStyles<T>(factory: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => factory(t), [factory, t]);
}

/** Theme override controls for the settings screen. */
export const useThemePreference = () => {
  const { theme, preference, setPreference } = useContext(ThemeContext);
  return { isDark: theme.scheme === 'dark', preference, setPreference };
};
