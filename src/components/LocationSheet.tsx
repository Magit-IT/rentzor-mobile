/**
 * Figma: Location change / Location (293:11977) — "Manzillar" drawer over
 * Home: "Joriy joylashuv" current-location card (blue tint, blue pin circle),
 * "Saqlanganlar" rows with edit pencils, and a "Yangi manzil qo‘shish" button.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '../context/LanguageContext';
import { SavedLocation, useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, press, radius, spacing } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { LocationIcon } from './LocationIcon';

export interface LocationSheetProps {
  visible: boolean;
  onClose: () => void;
  /** "Yangi manzil qo‘shish" — continue to the map screen. */
  onAddNew: () => void;
  /** Pencil on a saved row — open its details screen. */
  onEdit: (location: SavedLocation) => void;
}

export function LocationSheet({ visible, onClose, onAddNew, onEdit }: LocationSheetProps) {
  const t = useTheme();
  const tr = useT();
  const { setAddress, saved, current, currentStatus, refreshCurrent } = useLocation();

  // Resolve GPS when the drawer opens (first open triggers the permission
  // prompt); a denied state retries on the next open.
  useEffect(() => {
    if (visible) refreshCurrent();
  }, [visible, refreshCurrent]);

  const select = (name: string, coords?: { lat: number; lon: number } | null) => {
    setAddress(name, coords);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={tr.locationSheet.title}>
      <View style={styles.body}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
            {tr.locationSheet.currentLocation}
          </Text>
          <Pressable
            onPress={() =>
              current ? select(current.name, { lat: current.lat, lon: current.lon }) : refreshCurrent()
            }
            style={({ pressed }) => [
              styles.currentCard,
              { backgroundColor: t.colors.surfaceActive },
              pressed && press.dim,
            ]}
          >
            <View style={[styles.currentIcon, { backgroundColor: t.colors.primary }]}>
              <LocationIcon name="pinSolid" color="#FFFFFF" />
            </View>
            {current ? (
              <View style={styles.texts}>
                <Text style={[styles.name, { color: t.colors.text }]}>{current.name}</Text>
                <Text style={[styles.city, { color: t.colors.textSecondary }]}>
                  {current.city}
                </Text>
              </View>
            ) : (
              <View style={styles.texts}>
                <Text style={[styles.city, { color: t.colors.textSecondary }]}>
                  {currentStatus === 'denied' ? tr.locationSheet.denied : tr.locationSheet.locating}
                </Text>
              </View>
            )}
            {currentStatus === 'locating' && (
              <ActivityIndicator size="small" color={t.colors.primary} />
            )}
          </Pressable>
        </View>

        {saved.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
            {tr.locationSheet.savedLabel}
          </Text>
          {saved.map((location) => (
            <View
              key={location.id}
              style={[styles.savedCard, { borderColor: t.colors.strokeDark }]}
            >
              <Pressable
                onPress={() =>
                  select(
                    location.name,
                    location.lat != null && location.lon != null
                      ? { lat: location.lat, lon: location.lon }
                      : null,
                  )
                }
                style={({ pressed }) => [styles.savedMain, pressed && press.dim]}
              >
                <View style={[styles.savedIcon, { backgroundColor: t.colors.text }]}>
                  <LocationIcon name="pinSolid" color={t.colors.background} />
                </View>
                <View style={styles.texts}>
                  <Text style={[styles.name, { color: t.colors.text }]}>{location.name}</Text>
                  <Text style={[styles.city, { color: t.colors.textSecondary }]}>
                    {location.city}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => onEdit(location)}
                hitSlop={8}
                style={({ pressed }) => pressed && press.dim}
              >
                <LocationIcon name="pencil" color={t.colors.text} />
              </Pressable>
            </View>
          ))}
        </View>
        )}

        <Button title={tr.locationSheet.addNew} fullWidth onPress={onAddNew} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.xl, paddingBottom: spacing.sm },
  section: { gap: spacing.md },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.base,
  },
  currentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1,
  },
  savedMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  savedIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  city: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});
