/**
 * Figma: Profile & setting / Profile information (293:11362) and My ID
 * (293:11369) — shared "Shaxsiy ma'lumotlar" header with back arrow and the
 * "Umumiy | My ID" segmented switch. "Umumiy" shows the 80px avatar with the
 * change-photo camera badge (Component 6, 293:11364), the name card with the
 * MyID lock note, and the phone / Telegram contact card. "My ID" shows the
 * "Tasdiqlangan" badge card with the privacy note, the read-only
 * passport-data card, and the "why verification is required" info card.
 *
 * Unverified state — Figma: Profile information (293:11573) and My ID
 * (293:11580) — gray anonymous avatar, "—" name rows with the orange
 * shield note, and a MyID card with the "Tasdiqlanmagan" pill plus a
 * "Tasdiqlash" button instead of the passport data.
 */
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { BottomSheet, Button, MyIdLogo, SegmentedControl, useToast } from '../components';
import { AppIcon } from '../components/AppIcon';
import { Chevron } from '../components/icons';
import { useLanguage, useT } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { MyIdVerification, useMyIdVerification } from '../hooks/useMyIdVerification';
import { supabase } from '../integrations/supabase/client';
import { AvatarUploadError, uploadAvatar } from '../lib/avatar';
import { formatPhoneNumber } from '../lib/format';
import { getMyIdError, verifyIdentity } from '../lib/myid';
import { fonts, press, radius, spacing, Theme } from '../theme';

/** Missing MyID fields render as an em dash. */
const dash = (value: string | null | undefined) => (value?.trim() ? value.trim() : '—');

/** "2026-07-07T11:06:11+00:00" -> "07.07.2026" */
const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/**
 * Passport values in t.profileInfo.idFieldLabels order (full name, English
 * name, birth date, gender, nationality, citizenship, document, expiry,
 * PINFL, permanent address, registration, region/district, verified date).
 */
const idFieldValues = (v: MyIdVerification): string[] => [
  dash([v.last_name, v.first_name].filter(Boolean).join(' ')) +
    (v.middle_name ? `\n${v.middle_name}` : ''),
  dash([v.last_name_en, v.first_name_en].filter(Boolean).join(' ')),
  dash(v.birth_date),
  dash(v.gender),
  dash(v.nationality),
  dash(v.citizenship),
  dash(v.pass_data),
  dash(v.expiry_date),
  dash(v.pinfl),
  dash(v.permanent_address),
  dash(v.temporary_address),
  v.region || v.district ? `${dash(v.region)} / ${dash(v.district)}` : '—',
  formatDate(v.completed_at),
];

/** Camera glyph from the avatar badge (Component 6, 293:11364). */
function CameraIcon({ size = 32 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="48 48 32 32" fill="none">
      <Circle cx={64} cy={64.6665} r={2} stroke={t.colors.text} strokeWidth={1.5} />
      <Path
        d="M62.5184 70H65.4814C67.5621 70 68.6024 70 69.3498 69.5097C69.6733 69.2975 69.9511 69.0248 70.1672 68.7071C70.6666 67.9734 70.6666 66.9519 70.6666 64.9091C70.6666 62.8662 70.6666 61.8448 70.1672 61.1111C69.9511 60.7934 69.6733 60.5207 69.3498 60.3085C68.8695 59.9934 68.2684 59.8808 67.3479 59.8406C66.9087 59.8406 66.5305 59.5138 66.4444 59.0909C66.3152 58.4566 65.7479 58 65.089 58H62.9108C62.252 58 61.6847 58.4566 61.5555 59.0909C61.4693 59.5138 61.0912 59.8406 60.6519 59.8406C59.7315 59.8808 59.1303 59.9934 58.6501 60.3085C58.3266 60.5207 58.0488 60.7934 57.8326 61.1111C57.3333 61.8448 57.3333 62.8662 57.3333 64.9091C57.3333 66.9519 57.3333 67.9734 57.8326 68.7071C58.0488 69.0248 58.3266 69.2975 58.6501 69.5097C59.3974 70 60.4378 70 62.5184 70Z"
        stroke={t.colors.text}
        strokeWidth={1.5}
      />
      <Path
        d="M68.6667 62.6665H68"
        stroke={t.colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Blue verified-check on the MyID note. */
function VerifiedCheck({ size = 20 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill={t.colors.primary} />
      <Path
        d="M17.5994 7.80029L9.89941 15.5003L6.39941 12.0003"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 16 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x={3} y={7} width={10} height={7} rx={1.5} stroke={t.colors.primary} strokeWidth={1.3} />
      <Path
        d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7"
        stroke={t.colors.primary}
        strokeWidth={1.3}
      />
      <Circle cx={8} cy={10.5} r={1} fill={t.colors.primary} />
    </Svg>
  );
}

function InfoIcon({ size = 20 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} stroke={t.colors.primary} strokeWidth={1.5} />
      <Path d="M10 9V14" stroke={t.colors.primary} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={10} cy={6.5} r={1} fill={t.colors.primary} />
    </Svg>
  );
}

function CheckBullet({ size = 16 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M13.3333 4L6 11.3333L2.66667 8"
        stroke={t.colors.success}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ProfileInformationScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const { profile, myIdVerified, userId, refresh } = useProfile();
  const { verification, loading: verificationLoading, refetch: refetchVerification } = useMyIdVerification();
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);

  // General safety net for profile/verification state changing elsewhere
  // (e.g. edited on web) while this screen was backgrounded.
  useFocusEffect(
    useCallback(() => {
      refresh();
      refetchVerification();
    }, [refresh, refetchVerification]),
  );

  const startIdVerification = async () => {
    setVerifyingId(true);
    try {
      const result = await verifyIdentity();
      if (result.status === 'success') {
        await refresh();
        refetchVerification();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'userExited') {
        // User closed the SDK flow on their own; nothing to report.
        return;
      }
      toast.error(getMyIdError(err, language));
    } finally {
      setVerifyingId(false);
    }
  };

  const uploadErrorMessage: Record<AvatarUploadError, string> = {
    too_large: tr.profileInfo.photoTooLarge,
    unsupported_type: tr.profileInfo.photoUnsupported,
    upload_failed: tr.profileInfo.photoUploadFailed,
  };

  /** Persists the new url (or null to clear) and refreshes the context copy. */
  const saveAvatarUrl = async (url: string | null) => {
    if (!userId) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    if (error) {
      toast.error(tr.profileInfo.photoUploadFailed);
      return;
    }
    refresh();
  };

  const pickAvatar = async (source: 'gallery' | 'camera') => {
    setPhotoSheetVisible(false);
    if (!userId) return;

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(tr.profileInfo.photoPermissionDenied);
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setUploading(true);
    const { url, error } = await uploadAvatar(userId, asset);
    if (error) {
      setUploading(false);
      toast.error(uploadErrorMessage[error]);
      return;
    }
    await saveAvatarUrl(url);
    setUploading(false);
  };

  const removeAvatar = async () => {
    setPhotoSheetVisible(false);
    setUploading(true);
    await saveAvatarUrl(null);
    setUploading(false);
  };

  // MyID full_name is "LASTNAME FIRSTNAME PATRONYMIC…"; split for the
  // Ism/Familiya rows. Unverified profiles have no name yet.
  const nameParts = (profile?.full_name ?? '').split(/\s+/).filter(Boolean);
  const nameRows = [
    { label: tr.profileInfo.firstName, value: nameParts[1] ?? '—' },
    { label: tr.profileInfo.lastName, value: nameParts[0] ?? '—' },
  ];
  const phoneLabel = profile?.phone ? formatPhoneNumber(profile.phone) : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => pressed && press.dim}
          >
            <Chevron direction="left" size={24} color={t.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{tr.profileInfo.title}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SegmentedControl
          segments={[tr.profileInfo.tabGeneral, tr.profileInfo.tabMyId]}
          activeIndex={tab}
          onChange={setTab}
        />

        {tab === 0 ? (
          <>
            <View style={styles.avatarWrap}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <AppIcon name="user" color={t.gray[60]} size={40} />
                </View>
              )}
              {uploading && (
                <View style={[styles.avatar, styles.avatarBusy]}>
                  <ActivityIndicator color={t.colors.primary} />
                </View>
              )}
              <Pressable
                hitSlop={8}
                accessibilityLabel={tr.profileInfo.changePhoto}
                disabled={uploading}
                onPress={() => setPhotoSheetVisible(true)}
                style={({ pressed }) => [styles.avatarBadge, pressed && press.dim]}
              >
                <CameraIcon />
              </Pressable>
            </View>

            <View style={styles.card}>
              {nameRows.map((row) => (
                <React.Fragment key={row.label}>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowValue}>{row.value}</Text>
                  </View>
                  <View style={styles.rowDivider} />
                </React.Fragment>
              ))}
              <View style={styles.note}>
                {myIdVerified ? (
                  <VerifiedCheck />
                ) : (
                  <AppIcon name="shieldWarning" color={t.orange[50]} size={20} />
                )}
                <Text style={styles.noteText}>
                  {myIdVerified ? tr.profileInfo.nameNote : tr.profileInfo.nameNoteUnverified}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Pressable style={({ pressed }) => [styles.row, pressed && press.dim]}>
                <Text style={styles.rowLabel}>{tr.profileInfo.phoneLabel}</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValueDark}>{phoneLabel}</Text>
                  <Chevron direction="right" size={20} color={t.colors.text} />
                </View>
              </Pressable>
              <View style={styles.rowDivider} />
              <Pressable
                onPress={() => router.push('/telegram-connect')}
                style={({ pressed }) => [styles.row, pressed && press.dim]}
              >
                <Text style={styles.rowLabel}>{tr.profileInfo.telegram}</Text>
                <View style={styles.rowRight}>
                  <Text
                    style={[
                      styles.rowValueDark,
                      { color: profile?.telegram_verified ? t.colors.success : t.colors.orange },
                    ]}
                  >
                    {profile?.telegram_verified
                      ? tr.profileInfo.connected
                      : tr.profileInfo.notConnected}
                  </Text>
                  <Chevron direction="right" size={20} color={t.colors.text} />
                </View>
              </Pressable>
            </View>
          </>
        ) : !myIdVerified ? (
          <>
            {/* Figma: My ID (293:11580) — MyID card with the "Tasdiqlanmagan"
                pill and the verify button. */}
            <View style={[styles.card, styles.verifyCard]}>
              <View style={styles.verifyRow}>
                <View style={styles.logoTile}>
                  <MyIdLogo width={40} />
                </View>
                <Text style={[styles.badgeTitle, styles.verifyTitle]}>My ID</Text>
                <View style={styles.warningPill}>
                  <Text style={styles.warningPillText}>
                    {tr.profileInfo.notVerifiedBadge}
                  </Text>
                </View>
              </View>
              <View style={styles.rowDivider} />
              <Button
                title={tr.profileInfo.verifyButton}
                fullWidth
                loading={verifyingId}
                onPress={startIdVerification}
              />
            </View>

            <View style={[styles.card, styles.verifyCard]}>
              <View style={styles.infoHeader}>
                <InfoIcon />
                <Text style={styles.infoTitle}>{tr.profileInfo.whyTitle}</Text>
              </View>
              {tr.profileInfo.whyItems.map((item) => (
                <View key={item} style={styles.infoRow}>
                  <CheckBullet />
                  <Text style={styles.infoText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeTitle}>My ID</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tr.profileInfo.verifiedBadge}</Text>
                </View>
              </View>
              <View style={styles.privacyRow}>
                <LockIcon />
                <Text style={styles.privacyText}>{tr.profileInfo.privacyNote}</Text>
              </View>
            </View>

            <View style={styles.card}>
              {verificationLoading ? (
                <ActivityIndicator color={t.colors.primary} style={styles.idLoader} />
              ) : (
                idFieldValues(verification ?? ({} as MyIdVerification)).map((value, i) => (
                  <React.Fragment key={tr.profileInfo.idFieldLabels[i]}>
                    {i > 0 && <View style={styles.rowDivider} />}
                    <View style={styles.idRow}>
                      <Text style={styles.rowLabel}>{tr.profileInfo.idFieldLabels[i]}</Text>
                      <Text style={styles.rowValue}>{value}</Text>
                    </View>
                  </React.Fragment>
                ))
              )}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <InfoIcon />
                <Text style={styles.infoTitle}>{tr.profileInfo.whyTitle}</Text>
              </View>
              {tr.profileInfo.whyItems.map((item) => (
                <View key={item} style={styles.infoRow}>
                  <CheckBullet />
                  <Text style={styles.infoText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        title={tr.profileInfo.changePhoto}
      >
        <Pressable
          onPress={() => pickAvatar('gallery')}
          style={({ pressed }) => [styles.sheetRow, pressed && press.dim]}
        >
          <AppIcon name="imagePlaceholder" color={t.colors.text} size={24} />
          <Text style={styles.sheetRowText}>{tr.profileInfo.photoFromGallery}</Text>
        </Pressable>
        <View style={styles.rowDivider} />
        <Pressable
          onPress={() => pickAvatar('camera')}
          style={({ pressed }) => [styles.sheetRow, pressed && press.dim]}
        >
          <CameraIcon size={24} />
          <Text style={styles.sheetRowText}>{tr.profileInfo.photoFromCamera}</Text>
        </Pressable>
        {profile?.avatar_url ? (
          <>
            <View style={styles.rowDivider} />
            <Pressable
              onPress={removeAvatar}
              style={({ pressed }) => [styles.sheetRow, pressed && press.dim]}
            >
              <AppIcon name="dangerTriangle" color={t.colors.critical} size={24} />
              <Text style={[styles.sheetRowText, { color: t.colors.critical }]}>
                {tr.profileInfo.photoRemove}
              </Text>
            </Pressable>
          </>
        ) : null}
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
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenX,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
    marginHorizontal: spacing.screenX,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xxl,
    gap: spacing.xxl,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginVertical: spacing.sm,
    width: 80,
    height: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.gray[10],
  },
  avatarBusy: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.background,
    opacity: 0.7,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  sheetRowText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    height: 52,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  idLoader: {
    paddingVertical: spacing.xxl,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeLight,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  rowValue: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
    textAlign: 'right',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  rowValueDark: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
    textAlign: 'right',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  verifyCard: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  verifyTitle: { flex: 1 },
  logoTile: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.base,
    backgroundColor: t.violet[0],
  },
  warningPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.orange[30],
    backgroundColor: t.orange[0],
  },
  warningPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.orange[50],
  },
  badgeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: t.blue[0],
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.primary,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  privacyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
  infoCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: t.blue[0],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
});
