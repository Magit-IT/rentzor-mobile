/**
 * Delivery-address state shared by the Home header and the location
 * change flow (Manzillar drawer → map → details screen). Figma:
 * Location change (293:11976).
 *
 * The selected address and the saved list persist via AsyncStorage. The
 * "Joriy joylashuv" card resolves from device GPS (expo-location) reverse
 * geocoded through the Yandex HTTP geocoder; the permission prompt fires
 * on the first refreshCurrent() call (the drawer opening), not app start.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { GeocodedPlace, reverseGeocode } from '../lib/geocode';

export const DEFAULT_ADDRESS = 'Toshkent';

const SAVED_KEY = 'rentzor_saved_locations';
const ADDRESS_KEY = 'rentzor_selected_address';
const ADDRESS_COORDS_KEY = 'rentzor_selected_address_coords';

export interface SavedLocation {
  id: string;
  name: string;
  city: string;
  lat?: number;
  lon?: number;
}

export type CurrentLocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

interface LocationContextValue {
  address: string;
  /** Coordinates for `address`, when the selection had any (saved location,
   *  map pick, or "use current location") — null for a plain typed name. */
  addressCoords: { lat: number; lon: number } | null;
  setAddress: (address: string, coords?: { lat: number; lon: number } | null) => void;
  saved: SavedLocation[];
  addLocation: (location: Omit<SavedLocation, 'id'>) => void;
  updateLocation: (id: string, changes: Partial<Omit<SavedLocation, 'id'>>) => void;
  removeLocation: (id: string) => void;
  /** Device GPS position, reverse geocoded. */
  current: GeocodedPlace | null;
  currentStatus: CurrentLocationStatus;
  /** Requests permission (if needed) and refreshes `current`. */
  refreshCurrent: () => void;
  /**
   * Best-known coordinates for "where the user is", for distance-based
   * features (e.g. the home "nearby" rail): the explicitly selected
   * address's coords when set, else the live GPS fix, else null.
   */
  effectiveCoords: { lat: number; lon: number } | null;
}

const LocationContext = createContext<LocationContextValue>({
  address: DEFAULT_ADDRESS,
  addressCoords: null,
  setAddress: () => {},
  saved: [],
  addLocation: () => {},
  updateLocation: () => {},
  removeLocation: () => {},
  current: null,
  currentStatus: 'idle',
  refreshCurrent: () => {},
  effectiveCoords: null,
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [address, setAddressState] = useState(DEFAULT_ADDRESS);
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [saved, setSaved] = useState<SavedLocation[]>([]);
  const [current, setCurrent] = useState<GeocodedPlace | null>(null);
  const [currentStatus, setCurrentStatus] = useState<CurrentLocationStatus>('idle');
  const locating = useRef(false);

  useEffect(() => {
    AsyncStorage.multiGet([ADDRESS_KEY, ADDRESS_COORDS_KEY, SAVED_KEY]).then(
      ([[, storedAddress], [, storedCoords], [, storedSaved]]) => {
        if (storedAddress) setAddressState(storedAddress);
        if (storedCoords) {
          try {
            const parsed = JSON.parse(storedCoords);
            if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
              setAddressCoords(parsed);
            }
          } catch {
            // Ignore corrupt stored value.
          }
        }
        if (storedSaved) {
          try {
            const parsed = JSON.parse(storedSaved);
            if (Array.isArray(parsed)) setSaved(parsed);
          } catch {
            // Ignore corrupt stored value.
          }
        }
      },
    );
  }, []);

  const setAddress = useCallback(
    (next: string, coords?: { lat: number; lon: number } | null) => {
      setAddressState(next);
      AsyncStorage.setItem(ADDRESS_KEY, next);
      const resolvedCoords = coords ?? null;
      setAddressCoords(resolvedCoords);
      if (resolvedCoords) {
        AsyncStorage.setItem(ADDRESS_COORDS_KEY, JSON.stringify(resolvedCoords));
      } else {
        AsyncStorage.removeItem(ADDRESS_COORDS_KEY);
      }
    },
    [],
  );

  const persistSaved = useCallback((updater: (prev: SavedLocation[]) => SavedLocation[]) => {
    setSaved((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshCurrent = useCallback(() => {
    if (locating.current) return;
    locating.current = true;
    setCurrentStatus((prev) => (prev === 'ready' ? prev : 'locating'));

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentStatus('denied');
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const place = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
          language,
        );
        if (place) {
          setCurrent(place);
          setCurrentStatus('ready');
        } else {
          setCurrentStatus('unavailable');
        }
      } catch {
        setCurrentStatus('unavailable');
      } finally {
        locating.current = false;
      }
    })();
  }, [language]);

  const effectiveCoords = addressCoords ?? (current ? { lat: current.lat, lon: current.lon } : null);

  const value = useMemo(
    () => ({
      address,
      addressCoords,
      setAddress,
      saved,
      addLocation: (location: Omit<SavedLocation, 'id'>) =>
        persistSaved((prev) => [...prev, { ...location, id: `loc-${Date.now()}` }]),
      updateLocation: (id: string, changes: Partial<Omit<SavedLocation, 'id'>>) =>
        persistSaved((prev) => prev.map((l) => (l.id === id ? { ...l, ...changes } : l))),
      removeLocation: (id: string) => {
        // If the deleted entry is the one currently shown in the Home header,
        // fall back to the default city — otherwise the header (and the
        // distance-based rails via effectiveCoords) keep using an address the
        // user just removed, and it survives restarts through AsyncStorage.
        const removed = saved.find((l) => l.id === id);
        // Match on name (what setAddress stores) plus coords, so deleting one
        // of two same-named entries only clears the header when it is really
        // the selected one. A remaining twin keeps the selection valid.
        const isSelected =
          removed != null &&
          removed.name === address &&
          removed.lat === addressCoords?.lat &&
          removed.lon === addressCoords?.lon;
        const twinRemains =
          isSelected &&
          saved.some(
            (l) =>
              l.id !== id &&
              l.name === removed.name &&
              l.lat === removed.lat &&
              l.lon === removed.lon,
          );
        if (isSelected && !twinRemains) {
          setAddress(DEFAULT_ADDRESS, null);
        }
        persistSaved((prev) => prev.filter((l) => l.id !== id));
      },
      current,
      currentStatus,
      refreshCurrent,
      effectiveCoords,
    }),
    [
      address,
      addressCoords,
      setAddress,
      saved,
      persistSaved,
      current,
      currentStatus,
      refreshCurrent,
      effectiveCoords,
    ],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useLocation = () => useContext(LocationContext);
