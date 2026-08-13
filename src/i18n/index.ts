import { uz } from './uz';
import { ru } from './ru';
import { en } from './en';

/** Shape of every dictionary — derived from the Uzbek source strings. */
export type Translations = typeof uz;

export type LanguageCode = 'uz' | 'ru' | 'en';

export const translations: Record<LanguageCode, Translations> = { uz, ru, en };

/** Language metadata for pickers (labels are endonyms — never translated). */
export const LANGUAGES: { code: LanguageCode; label: string; short: string; flag: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'O‘zb', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'Рус', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'Eng', flag: '🇬🇧' },
];
