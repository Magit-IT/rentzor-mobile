/**
 * Figma: Location change / Search (293:12095) — address search opened from
 * the map's "Qidiruv" pill: back + focused input, "So‘nggi qidiruvlar"
 * recent address list (history icon, text, dismiss X). No filter button —
 * that belongs to the product search.
 *
 * Typing ≥3 chars queries the Yandex HTTP geocoder (debounced); picking a
 * result recenters the map screen on it. Picked addresses persist as
 * recents via AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, NoResults } from '../components';
import { AppIcon } from '../components/AppIcon';
import { LocationIcon } from '../components/LocationIcon';
import { SearchIcon } from '../components/SearchIcon';
import { Chevron } from '../components/icons';
import { useLanguage, useT } from '../context/LanguageContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { GeocodedPlace, searchAddresses } from '../lib/geocode';
import { fonts, press, spacing, Theme } from '../theme';

const RECENTS_KEY = 'rentzor_recent_addresses';
const MAX_RECENT = 5;
const MIN_QUERY = 3;
const DEBOUNCE_MS = 300;

export default function AddressSearchScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState<GeocodedPlace[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY).then((stored) => {
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecents(parsed);
      } catch {
        // Ignore corrupt stored value.
      }
    });
  }, []);

  const saveRecents = useCallback((next: GeocodedPlace[]) => {
    setRecents(next);
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  }, []);

  const active = query.trim().length >= MIN_QUERY;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      searchAddresses(trimmed, language)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, language]);

  /** Recenter the map screen on the picked place and remember it. */
  const pick = (place: GeocodedPlace) => {
    saveRecents([
      place,
      ...recents.filter((r) => r.name !== place.name || r.city !== place.city),
    ].slice(0, MAX_RECENT));
    router.replace({
      pathname: '/location',
      params: { lat: String(place.lat), lon: String(place.lon) },
    });
  };

  const removeRecent = (place: GeocodedPlace) =>
    saveRecents(recents.filter((r) => r.name !== place.name || r.city !== place.city));

  const resultRow = (place: GeocodedPlace, index: number) => (
    <Pressable
      key={`${place.lat},${place.lon},${index}`}
      onPress={() => pick(place)}
      style={({ pressed }) => [styles.resultRow, pressed && press.dim]}
    >
      <LocationIcon name="pin" color={t.colors.textSecondary} size={24} />
      <View style={styles.resultTexts}>
        <Text style={styles.resultName} numberOfLines={1}>
          {place.name}
        </Text>
        {place.city !== '' && (
          <Text style={styles.resultCity} numberOfLines={1}>
            {place.city}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          hitSlop={8}
          style={({ pressed }) => pressed && press.dim}
        >
          <Chevron direction="left" size={24} color={t.colors.text} />
        </Pressable>
        <Input
          containerStyle={styles.input}
          leftIcon={<AppIcon name="search" color={t.colors.text} />}
          placeholder={tr.addressSearch.placeholder}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoFocus
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {active ? (
          searching ? (
            <ActivityIndicator color={t.colors.primary} style={styles.loader} />
          ) : results.length > 0 ? (
            <View style={styles.results}>{results.map(resultRow)}</View>
          ) : (
            <NoResults message={tr.search.noResults} />
          )
        ) : (
          recents.length > 0 && (
            <View style={styles.recents}>
              <Text style={styles.recentsTitle}>{tr.addressSearch.recentTitle}</Text>
              {recents.map((place, index) => (
                <View key={`${place.name},${index}`} style={styles.recentRow}>
                  <Pressable
                    onPress={() => pick(place)}
                    style={({ pressed }) => [styles.recentItem, pressed && press.dim]}
                  >
                    <SearchIcon name="history" color={t.colors.textSecondary} />
                    <Text style={styles.recentText} numberOfLines={1}>
                      {place.name}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeRecent(place)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && press.dim}
                  >
                    <SearchIcon name="close" color={t.colors.text} />
                  </Pressable>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.screenX,
  },
  input: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xxl,
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  results: { gap: spacing.lg },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultTexts: { flex: 1, gap: 2 },
  resultName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  resultCity: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
  recents: { gap: spacing.lg },
  recentsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
});
