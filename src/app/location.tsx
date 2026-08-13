/**
 * Figma: Location change / Map (293:12085) — "Manzil qo‘shish" header,
 * map with "Qidiruv" search pill, centered red pin, floating GPS locate
 * button, and the "Joriy manzil" confirm panel.
 *
 * The Yandex map pans under the fixed center pin; every camera stop
 * reverse geocodes the center through the Yandex HTTP geocoder into the
 * panel. GPS button recenters on the device position (expo-location).
 * In Expo Go (no MapKit native module) a static map image is shown and
 * only the GPS flow works.
 */
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components';
import { AppIcon } from '../components/AppIcon';
import { LocationIcon } from '../components/LocationIcon';
import { Chevron } from '../components/icons';
import { useLanguage, useT } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { GeocodedPlace, reverseGeocode } from '../lib/geocode';
import { yamap } from '../lib/yamap';
import { fonts, press, radius, spacing, Theme } from '../theme';

/** Tashkent center — fallback when GPS is unavailable. */
const FALLBACK_CENTER = { lat: 41.3111, lon: 69.2797 };
const PICK_ZOOM = 16;

export default function LocationScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const { current } = useLocation();

  const initialCenter =
    params.lat && params.lon
      ? { lat: Number(params.lat), lon: Number(params.lon) }
      : current
        ? { lat: current.lat, lon: current.lon }
        : FALLBACK_CENTER;

  const mapRef = useRef<any>(null);
  const requestId = useRef(0);
  const [picked, setPicked] = useState<GeocodedPlace | null>(null);
  const [resolving, setResolving] = useState(false);

  /** Reverse geocodes a map center into the panel, dropping stale replies. */
  const resolvePoint = (lat: number, lon: number) => {
    const id = ++requestId.current;
    setResolving(true);
    reverseGeocode(lat, lon, language)
      .then((place) => {
        if (id !== requestId.current) return;
        if (place) setPicked(place);
      })
      .catch(() => {})
      .finally(() => {
        if (id === requestId.current) setResolving(false);
      });
  };

  // Resolve the initial center so the panel isn't empty before the first pan.
  useEffect(() => {
    resolvePoint(initialCenter.lat, initialCenter.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const point = { lat: position.coords.latitude, lon: position.coords.longitude };
      mapRef.current?.setCenter(point, PICK_ZOOM, 0, 0, 0.4);
      resolvePoint(point.lat, point.lon);
    } catch {
      // GPS unavailable — keep the current pick.
    }
  };

  const confirm = () => {
    if (!picked) return;
    router.push({
      pathname: '/edit-location',
      params: {
        name: picked.name,
        city: picked.city,
        lat: String(picked.lat),
        lon: String(picked.lon),
      },
    });
  };

  const Yamap = yamap?.Yamap;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          hitSlop={8}
          style={({ pressed }) => pressed && press.dim}
        >
          <Chevron direction="left" size={24} color={t.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{tr.location.title}</Text>
      </View>

      {/* Map area with the search pill, centered pin and locate button */}
      <View style={styles.mapArea}>
        {Yamap ? (
          <Yamap
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{ ...initialCenter, zoom: PICK_ZOOM }}
            showUserPosition={false}
            onCameraPositionChangeEnd={(e: any) => {
              const { lat, lon } = e.nativeEvent.point;
              resolvePoint(lat, lon);
            }}
          />
        ) : (
          <Image
            source={require('../assets/shared/map-location-image.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
        <Pressable
          onPress={() => router.push('/address-search')}
          style={({ pressed }) => [styles.searchPill, pressed && styles.buttonPressed]}
        >
          <AppIcon name="search" color={t.colors.text} />
          <Text style={styles.searchPillText}>{tr.location.searchPill}</Text>
        </Pressable>

        <View pointerEvents="none" style={styles.pin}>
          <LocationIcon name="pin" color="#E03137" size={40} />
        </View>

        <Pressable
          onPress={locate}
          style={({ pressed }) => [styles.locateButton, pressed && styles.buttonPressed]}
        >
          <LocationIcon name="gps" color={t.colors.text} />
        </Pressable>
      </View>

      {/* Joriy manzil panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.panelTitle}>{tr.location.currentAddress}</Text>
        <View style={styles.addressRow}>
          <View style={styles.addressIcon}>
            <LocationIcon name="pinSolid" color="#FFFFFF" />
          </View>
          <View style={styles.addressTexts}>
            <Text style={styles.addressName}>
              {picked?.name ?? tr.locationSheet.locating}
            </Text>
            <Text style={styles.addressCity}>{picked?.city ?? ''}</Text>
          </View>
          {resolving && <ActivityIndicator size="small" color={t.colors.primary} />}
        </View>
        <Button
          title={tr.location.confirmAddress}
          fullWidth
          disabled={!picked}
          onPress={confirm}
        />
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  mapArea: { flex: 1 },
  searchPill: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: t.colors.background,
    elevation: 3,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchPillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  buttonPressed: { backgroundColor: t.colors.surface },
  pin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the glyph so its tip, not its middle, marks the map center.
    paddingBottom: 40,
  },
  locateButton: {
    position: 'absolute',
    right: spacing.screenX,
    bottom: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  panel: {
    backgroundColor: t.colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.screenX,
    gap: spacing.lg,
  },
  panelTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTexts: { flex: 1, gap: 2 },
  addressName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  addressCity: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
});
