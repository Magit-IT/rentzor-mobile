/**
 * Active UI language (uz/ru/en). Defaults to Uzbek; the onboarding pill and
 * the settings language sheet change it, and the choice persists across
 * restarts via AsyncStorage. Screens read strings with useT().
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, Translations, translations } from '../i18n';

const LANGUAGE_KEY = 'language';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'uz',
  setLanguage: () => {},
  t: translations.uz,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('uz');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      if (saved === 'uz' || saved === 'ru' || saved === 'en') {
        setLanguageState(saved);
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: LanguageCode) => {
        setLanguageState(next);
        AsyncStorage.setItem(LANGUAGE_KEY, next);
      },
      t: translations[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** The active dictionary: `const t = useT(); t.settings.title`. */
export const useT = () => useContext(LanguageContext).t;

export const useLanguage = () => useContext(LanguageContext);
