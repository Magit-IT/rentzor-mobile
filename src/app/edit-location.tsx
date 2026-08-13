/**
 * Figma: Location change / Edit location (293:12104) — "Manzil tafsilotlari"
 * header with a red trash action, address row, "Manzil nomi" input,
 * "Manzil xaritada" rounded map preview with expand button, and the
 * "Manzilni saqlash" action bar. The trash opens the "Manzilni o‘chirish"
 * confirm drawer (293:12031).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BottomSheet, Button, Input } from '../components';
import { LocationIcon } from '../components/LocationIcon';
import { ProductIcon } from '../components/ProductIcon';
import { Chevron } from '../components/icons';
import { useT } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { yamap } from '../lib/yamap';
import { fonts, press, radius, spacing, Theme } from '../theme';

export default function EditLocationScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    city?: string;
    lat?: string;
    lon?: string;
  }>();
  const { setAddress, saved, addLocation, updateLocation, removeLocation } = useLocation();

  const existing = params.id ? saved.find((l) => l.id === params.id) : undefined;
  const name = existing?.name ?? params.name ?? '';
  const city = existing?.city ?? params.city ?? 'Toshkent';
  const lat = existing?.lat ?? (params.lat ? Number(params.lat) : undefined);
  const lon = existing?.lon ?? (params.lon ? Number(params.lon) : undefined);
  const [label, setLabel] = useState(name);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  /** Leave the whole location flow and land back on Home. */
  const closeFlow = () => {
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/(tabs)/home');
  };

  const save = () => {
    const trimmed = label.trim() || name;
    if (existing) {
      updateLocation(existing.id, { name: trimmed });
    } else {
      addLocation({ name: trimmed, city, lat, lon });
    }
    setAddress(trimmed, lat != null && lon != null ? { lat, lon } : null);
    closeFlow();
  };

  const remove = () => {
    if (existing) removeLocation(existing.id);
    setDeleteVisible(false);
    closeFlow();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={8}
          style={({ pressed }) => pressed && press.dim}
        >
          <Chevron direction="left" size={24} color={t.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{tr.editLocation.title}</Text>
        {existing && (
          <Pressable
            onPress={() => setDeleteVisible(true)}
            hitSlop={8}
            style={({ pressed }) => pressed && press.dim}
          >
            <LocationIcon name="trash" color={t.colors.critical} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{tr.editLocation.addressSection}</Text>
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <LocationIcon name="pinSolid" color="#FFFFFF" />
            </View>
            <View style={styles.addressTexts}>
              <Text style={styles.addressName}>{name}</Text>
              <Text style={styles.addressCity}>{city}</Text>
            </View>
          </View>
        </View>

        <Input
          label={tr.editLocation.nameLabel}
          value={label}
          onChangeText={setLabel}
          placeholder={tr.editLocation.namePlaceholder}
        />

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{tr.editLocation.onMap}</Text>
          <View style={styles.mapWrap}>
            {yamap && lat != null && lon != null ? (
              <yamap.Yamap
                style={styles.map}
                initialRegion={{ lat, lon, zoom: 16 }}
                interactiveDisabled
                showUserPosition={false}
              />
            ) : (
              <Image
                source={require('../assets/shared/map-image.png')}
                style={styles.map}
                resizeMode="cover"
              />
            )}
            <View pointerEvents="none" style={styles.mapPin}>
              <LocationIcon name="pin" color="#E03137" size={32} />
            </View>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/location',
                  params:
                    lat != null && lon != null
                      ? { lat: String(lat), lon: String(lon) }
                      : {},
                })
              }
              style={({ pressed }) => [styles.mapExpand, pressed && { backgroundColor: t.gray[20] }]}
            >
              <ProductIcon name="expandMap" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
        <Button title={tr.editLocation.save} onPress={save} />
      </ActionBar>

      {/* Figma: Location change (293:12031) — delete confirm drawer */}
      <BottomSheet
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        title={tr.editLocation.deleteTitle}
      >
        <View style={styles.deleteBody}>
          <Text style={styles.deleteText}>
            {tr.editLocation.deletePromptBefore}
            <Text style={styles.deleteTextBold}>
              {city}, {name}
            </Text>
            {tr.editLocation.deletePromptAfter}
          </Text>
          <View style={styles.deleteButtons}>
            <View style={styles.deleteButton}>
              <Button
                title={tr.common.back}
                variant="secondary"
                onPress={() => setDeleteVisible(false)}
              />
            </View>
            <View style={styles.deleteButton}>
              <Button title={tr.editLocation.yesDelete} variant="critical" onPress={remove} />
            </View>
          </View>
        </View>
      </BottomSheet>
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
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xxl,
    gap: spacing.xxl,
  },
  block: { gap: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
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
  mapWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 200,
  },
  mapPin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapExpand: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBody: { gap: spacing.xl, paddingBottom: spacing.sm },
  deleteText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  deleteTextBold: {
    fontFamily: fonts.semiBold,
    color: t.colors.text,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deleteButton: { flex: 1 },
});
