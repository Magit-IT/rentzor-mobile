/**
 * Owner listing wizard — pickup-location picker (mirrors the renter
 * location.tsx map flow and the owner web app's LocationPicker): pan the
 * map under a fixed pin, search an address, or jump to the GPS position;
 * every stop reverse-geocodes into the bottom panel. Confirming stores the
 * pick in lib/pickupLocation for the wizard to consume on focus.
 * In Expo Go (no MapKit native module) a static map image is shown and only
 * search + GPS work.
 */
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { LocationIcon } from '../../components/LocationIcon';
import { Chevron } from '../../components/icons';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { GeocodedPlace, reverseGeocode, searchAddresses } from '../../lib/geocode';
import { setPickedPickupLocation } from '../../lib/pickupLocation';
import { yamap } from '../../lib/yamap';
import { fonts, press, radius, spacing, Theme } from '../../theme';

/** Tashkent center — fallback when GPS is unavailable. */
const FALLBACK_CENTER = { lat: 41.3111, lon: 69.2797 };
const PICK_ZOOM = 16;
const MIN_QUERY = 3;
const DEBOUNCE_MS = 300;

export default function PickLocationScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<any>(null);
  const requestId = useRef(0);
  const [picked, setPicked] = useState<GeocodedPlace | null>(null);
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);

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

  useEffect(() => {
    resolvePoint(FALLBACK_CENTER.lat, FALLBACK_CENTER.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced address search (Yandex HTTP geocoder, like address-search.tsx).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      searchAddresses(trimmed, language)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, language]);

  const jumpTo = (place: GeocodedPlace) => {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    setPicked(place);
    mapRef.current?.setCenter({ lat: place.lat, lon: place.lon }, PICK_ZOOM, 0, 0, 0.4);
  };

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
    setPickedPickupLocation(picked);
    router.back();
  };

  const Yamap = yamap?.Yamap;
  const showResults = query.trim().length >= MIN_QUERY;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && press.dim}
        >
          <Chevron direction="left" size={24} color={t.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{tr.owner.wizard.locationLabel}</Text>
      </View>

      {/* Search box with a results dropdown over the map */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <AppIcon name="search" color={t.gray[40]} size={20} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={tr.addressSearch.placeholder}
            placeholderTextColor={t.gray[40]}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={t.colors.primary} />}
        </View>
      </View>

      <View style={styles.mapArea}>
        {Yamap ? (
          <Yamap
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{ ...FALLBACK_CENTER, zoom: PICK_ZOOM }}
            showUserPosition={false}
            onCameraPositionChangeEnd={(e: any) => {
              const { lat, lon } = e.nativeEvent.point;
              resolvePoint(lat, lon);
            }}
          />
        ) : (
          <Image
            source={require('../../assets/shared/map-location-image.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        <View pointerEvents="none" style={styles.pin}>
          <LocationIcon name="pin" color="#E03137" size={40} />
        </View>

        <Pressable
          onPress={locate}
          style={({ pressed }) => [styles.locateButton, pressed && styles.buttonPressed]}
        >
          <LocationIcon name="gps" color={t.colors.text} />
        </Pressable>

        {showResults && (
          <View style={styles.resultsOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.map((place) => (
                <Pressable
                  key={`${place.lat},${place.lon}`}
                  onPress={() => jumpTo(place)}
                  style={({ pressed }) => [styles.resultRow, pressed && styles.buttonPressed]}
                >
                  <LocationIcon name="pinSolid" color={t.colors.primary} />
                  <View style={styles.resultTexts}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={styles.resultCity} numberOfLines={1}>
                      {place.city}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Picked address panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.panelTitle}>{tr.location.currentAddress}</Text>
        <View style={styles.addressRow}>
          <View style={styles.addressIcon}>
            <LocationIcon name="pinSolid" color="#FFFFFF" />
          </View>
          <View style={styles.addressTexts}>
            <Text style={styles.addressName} numberOfLines={1}>
              {picked?.name ?? tr.locationSheet.locating}
            </Text>
            <Text style={styles.addressCity} numberOfLines={1}>
              {picked?.city ?? ''}
            </Text>
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
      paddingBottom: spacing.md,
    },
    headerTitle: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 28,
      color: t.colors.text,
    },
    searchWrap: {
      paddingHorizontal: spacing.screenX,
      paddingBottom: spacing.md,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeDark,
      backgroundColor: t.colors.backgroundSecondary,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: t.colors.text,
    },
    mapArea: {
      flex: 1,
      overflow: 'hidden',
    },
    pin: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      // Pin tip should point at the center: lift the glyph by half its height.
      paddingBottom: 40,
    },
    locateButton: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: t.colors.backgroundSecondary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    buttonPressed: { opacity: 0.7 },
    resultsOverlay: {
      position: 'absolute',
      top: 0,
      left: spacing.screenX,
      right: spacing.screenX,
      maxHeight: 280,
      borderRadius: radius.base,
      backgroundColor: t.colors.backgroundSecondary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.strokeLight,
    },
    resultTexts: {
      flex: 1,
    },
    resultName: {
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
      color: t.colors.text,
    },
    resultCity: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
    },
    panel: {
      gap: spacing.md,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.lg,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      backgroundColor: t.colors.backgroundSecondary,
    },
    panelTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
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
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: t.colors.primary,
    },
    addressTexts: {
      flex: 1,
    },
    addressName: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      lineHeight: 22,
      color: t.colors.text,
    },
    addressCity: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
    },
  });
