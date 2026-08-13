/**
 * Yandex HTTP Geocoder (geocode-maps.yandex.ru) — forward and reverse
 * geocoding for the location flow. Uses the same "JavaScript API and HTTP
 * Geocoder" key the owner webapp's LocationPicker uses, so it works
 * everywhere (including Expo Go); the MapKit Lite build compiled into the
 * app has no native Search/Suggest modules.
 */
import { LanguageCode } from '../i18n';

const API_KEY = process.env.EXPO_PUBLIC_YANDEX_GEOCODER_KEY;
const BASE_URL = 'https://geocode-maps.yandex.ru/1.x/';
// Soft bias toward Uzbekistan for text searches (lon,lat corners).
const UZ_BBOX = '55.9,37.1~73.2,45.6';

const LANG: Record<LanguageCode, string> = { uz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' };

export interface GeocodedPlace {
  /** Short display line, e.g. "Izzat ko‘chasi, 58/6". */
  name: string;
  /** Locality, e.g. "Toshkent". */
  city: string;
  lat: number;
  lon: number;
}

interface GeoObject {
  name: string;
  Point: { pos: string };
  metaDataProperty: {
    GeocoderMetaData: {
      text: string;
      Address: { Components?: { kind: string; name: string }[] };
    };
  };
}

function toPlace(o: GeoObject): GeocodedPlace {
  const [lon, lat] = o.Point.pos.split(' ').map(Number);
  const components = o.metaDataProperty.GeocoderMetaData.Address.Components ?? [];
  const byKind = (kind: string) => components.find((c) => c.kind === kind)?.name;
  return {
    name: o.name,
    city: byKind('locality') ?? byKind('area') ?? byKind('province') ?? '',
    lat,
    lon,
  };
}

async function geocode(query: string, lang: LanguageCode, results: number) {
  if (!API_KEY) return [];
  const params = new URLSearchParams({
    apikey: API_KEY,
    geocode: query,
    format: 'json',
    lang: LANG[lang],
    results: String(results),
    bbox: UZ_BBOX,
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const data = await res.json();
  const members: { GeoObject: GeoObject }[] =
    data?.response?.GeoObjectCollection?.featureMember ?? [];
  return members.map((m) => toPlace(m.GeoObject));
}

/** Coordinates → nearest address, or null when nothing is found. */
export async function reverseGeocode(
  lat: number,
  lon: number,
  lang: LanguageCode = 'uz',
): Promise<GeocodedPlace | null> {
  const places = await geocode(`${lon},${lat}`, lang, 1);
  return places[0] ?? null;
}

/** Free-text address search biased toward Uzbekistan. */
export function searchAddresses(
  query: string,
  lang: LanguageCode = 'uz',
): Promise<GeocodedPlace[]> {
  return geocode(query, lang, 8);
}
