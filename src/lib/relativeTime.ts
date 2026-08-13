/**
 * "5 daqiqa oldin" style relative timestamps for notification rows. Mirrors
 * web's use of date-fns formatDistanceToNow — mobile has no date-fns
 * dependency, so this is a small hand-rolled equivalent covering the same
 * granularities (minutes/hours/days), each language matching its own
 * pluralization-free phrasing already used elsewhere in the app (e.g. daysFor).
 */
import type { LanguageCode } from '../i18n';

const UNITS: Record<LanguageCode, { now: string; min: (n: number) => string; hour: (n: number) => string; day: (n: number) => string }> = {
  uz: {
    now: 'hozirgina',
    min: (n) => `${n} daqiqa oldin`,
    hour: (n) => `${n} soat oldin`,
    day: (n) => `${n} kun oldin`,
  },
  ru: {
    now: 'только что',
    min: (n) => `${n} мин. назад`,
    hour: (n) => `${n} ч. назад`,
    day: (n) => `${n} дн. назад`,
  },
  en: {
    now: 'just now',
    min: (n) => `${n}m ago`,
    hour: (n) => `${n}h ago`,
    day: (n) => `${n}d ago`,
  },
};

export function relativeTime(iso: string | null, language: LanguageCode): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const u = UNITS[language];

  if (seconds < 60) return u.now;
  if (seconds < 3600) return u.min(Math.floor(seconds / 60));
  if (seconds < 86400) return u.hour(Math.floor(seconds / 3600));
  if (seconds < 2592000) return u.day(Math.floor(seconds / 86400));

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
