/**
 * Figma: Booking flow (payment) / Mahsulot rasmlari — condition photo upload
 * for both handovers: "Rasm yuklash" tile, max-10 hint, acceptance checkbox,
 * and the confirm action enabled once photos are added and the box is ticked.
 *
 * Mirrors web's PhotoUploadSection + BookingActions dialogs: photos go to the
 * upload-image edge function, the URL list is saved via the
 * renter_update_booking_photos RPC, and confirming flips the booking status —
 * subtype 'pickup': confirmed → in_progress (renter takes the item);
 * subtype 'return': returning → pending_owner_confirmation (renter hands it
 * back; the owner then verifies and completes).
 */
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ActionBar,
  BottomSheet,
  Button,
  Checkbox,
  PageHeader,
  PageScrollView,
} from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { CloseX } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { supabase } from '../../integrations/supabase/client';
import { PickedPhoto, uploadBookingPhoto } from '../../lib/bookingPhotos';
import { fonts, press, radius, spacing, Theme } from '../../theme';

const MAX_PHOTOS = 10;

function CameraIcon({ size = 24, color }: { size?: number; color?: string }) {
  const t = useTheme();
  color = color ?? t.gray[50];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 18.5C22 19.6046 21.1046 20.5 20 20.5H4C2.89543 20.5 2 19.6046 2 18.5V8.5C2 7.39543 2.89543 6.5 4 6.5H7.5L9.5 3.5H14.5L16.5 6.5H20C21.1046 6.5 22 7.39543 22 8.5V18.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.75} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function BoxIcon({ size = 24, color }: { size?: number; color?: string }) {
  const t = useTheme();
  color = color ?? t.colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M4 7.5L12 12L20 7.5" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M12 12V21" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function ChecklistIcon({ size = 24, color }: { size?: number; color?: string }) {
  const t = useTheme();
  color = color ?? t.colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6.5C3 4.567 4.567 3 6.5 3H17.5C19.433 3 21 4.567 21 6.5V17.5C21 19.433 19.433 21 17.5 21H6.5C4.567 21 3 19.433 3 17.5V6.5Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M7 8.5L8.2 9.7L10.5 7.4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13 8.5H17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M7 15L8.2 16.2L10.5 13.9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13 15H17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function AlertSquareIcon({ size = 24, color }: { size?: number; color?: string }) {
  const t = useTheme();
  color = color ?? t.colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6.5C3 4.567 4.567 3 6.5 3H17.5C19.433 3 21 4.567 21 6.5V17.5C21 19.433 19.433 21 17.5 21H6.5C4.567 21 3 19.433 3 17.5V6.5Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path d="M12 7.5V13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={16.3} r={1} fill={color} />
    </Svg>
  );
}

/** Icons pair index-for-index with the pickupPhotos/returnPhotos checks. */
const makeCheckIcons = (t: Theme) => [
  <CameraIcon size={24} color={t.colors.primary} />,
  <BoxIcon />,
  <ChecklistIcon />,
  <AlertSquareIcon />,
];

function InfoBadge({ size = 20 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} fill={t.gray[40]} />
      <Path d="M10 9V14" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={10} cy={6.2} r={1.1} fill="#FFFFFF" />
    </Svg>
  );
}

export default function PickupPhotosScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { bookingId, subtype: rawSubtype } = useLocalSearchParams<{
    bookingId: string;
    subtype?: string;
  }>();
  const subtype: 'pickup' | 'return' = rawSubtype === 'return' ? 'return' : 'pickup';
  const copy = subtype === 'return' ? tr.returnPhotos : tr.pickupPhotos;
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoError, setPhotoError] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAccepted, setConfirmAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false);

  // Same gallery/camera split as profile-information's pickAvatar; gallery
  // keeps multi-select, the camera returns one shot at a time.
  const addPhoto = async (source: 'gallery' | 'camera') => {
    setSourceSheetVisible(false);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(copy.photoPermissionDenied);
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_PHOTOS - photos.length,
            quality: 0.8,
          });
    if (result.canceled) return;
    setPhotoError(false);
    setPhotos((prev) =>
      [...prev, ...result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }))]
        .slice(0, MAX_PHOTOS),
    );
  };

  // Upload → save URLs → flip the status; mirrors web's pickup/return flows.
  const confirmPhotos = async () => {
    if (submitting || !bookingId || photos.length === 0) return;
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const photo of photos) {
        urls.push(await uploadBookingPhoto(bookingId, subtype, photo));
      }
      const { error: photosError } = await supabase.rpc('renter_update_booking_photos', {
        p_booking_id: bookingId,
        p_photo_type: subtype,
        p_photo_urls: urls,
      });
      if (photosError) throw photosError;

      const { error: statusError } = await supabase.rpc('renter_update_booking_status', {
        p_booking_id: bookingId,
        p_new_status: subtype === 'return' ? 'pending_owner_confirmation' : 'in_progress',
      });
      if (statusError) throw statusError;

      setConfirmVisible(false);
      // Wait out the sheet's dismissal before navigating (Android drops
      // navigations while a native Modal is attached), then toast.
      setTimeout(() => {
        router.back();
        setTimeout(() => toast.success(copy.successToast), 350);
      }, 300);
    } catch (e) {
      console.error(`[${subtype}-photos] confirm failed:`, e);
      toast.error(copy.uploadFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={copy.title} onBack={() => router.back()} />

      <PageScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.photosBlock}>
          <View style={styles.photoGrid}>
            {photos.map((photo, i) => (
              <View key={`${photo.uri}-${i}`}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoTile}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={8}
                  style={({ pressed }) => [styles.removeBadge, pressed && press.dim]}
                >
                  <CloseX size={10} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <View style={styles.uploadWrap}>
                <Pressable
                  onPress={() => setSourceSheetVisible(true)}
                  style={({ pressed }) => [styles.uploadTile, pressed && { backgroundColor: t.gray[20] }]}
                >
                  <CameraIcon />
                </Pressable>
                <Text style={styles.uploadLabel}>{copy.upload}</Text>
              </View>
            )}
          </View>

          <View style={styles.hintRow}>
            <InfoBadge />
            <Text style={styles.hintText}>{copy.maxHint(MAX_PHOTOS)}</Text>
          </View>

          {photoError && (
            <Text style={styles.errorText}>{copy.noPhotosError}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <Pressable style={styles.acceptRow} onPress={() => setAccepted(!accepted)}>
          <Checkbox checked={accepted} onChange={setAccepted} />
          <Text style={styles.acceptText}>{copy.acceptedAsIs}</Text>
        </Pressable>
      </PageScrollView>

      <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
        <Button
          title={copy.accept}
          disabled={!bookingId}
          onPress={() => {
            // Validate on press instead of silently disabling the button, so
            // the renter learns WHY they can't continue.
            if (photos.length === 0) {
              setPhotoError(true);
              toast.error(copy.noPhotosError);
              return;
            }
            if (!accepted) {
              toast.error(copy.acceptRequired);
              return;
            }
            setConfirmAccepted(false);
            setConfirmVisible(true);
          }}
        />
      </ActionBar>

      {/* Photo source chooser — mirrors profile-information's avatar sheet. */}
      <BottomSheet
        visible={sourceSheetVisible}
        onClose={() => setSourceSheetVisible(false)}
        title={copy.upload}
      >
        <Pressable
          onPress={() => addPhoto('gallery')}
          style={({ pressed }) => [styles.sheetRow, pressed && press.dim]}
        >
          <AppIcon name="imagePlaceholder" color={t.colors.text} size={24} />
          <Text style={styles.sheetRowText}>{tr.profileInfo.photoFromGallery}</Text>
        </Pressable>
        <View style={styles.rowDivider} />
        <Pressable
          onPress={() => addPhoto('camera')}
          style={({ pressed }) => [styles.sheetRow, pressed && press.dim]}
        >
          <CameraIcon size={24} color={t.colors.text} />
          <Text style={styles.sheetRowText}>{tr.profileInfo.photoFromCamera}</Text>
        </Pressable>
      </BottomSheet>

      {/* Acceptance confirmation sheet */}
      <BottomSheet
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title={copy.confirmTitle}
        footer={
          <ActionBar>
            <Button
              title={tr.common.confirm}
              disabled={!confirmAccepted || submitting}
              onPress={confirmPhotos}
            />
          </ActionBar>
        }
      >
        <View style={styles.confirmBody}>
          <View style={styles.warnCard}>
            <View style={styles.warnBadge}>
              <Text style={styles.warnBadgeText} allowFontScaling={false}>
                !
              </Text>
            </View>
            <View style={styles.warnTexts}>
              <Text style={styles.warnTitle}>{copy.important}</Text>
              <Text style={styles.warnText}>{copy.importantText}</Text>
            </View>
          </View>

          <Text style={styles.checksTitle}>{copy.checksTitle}</Text>
          <View style={styles.checks}>
            {makeCheckIcons(t).map((icon, i) => (
              <View key={i} style={styles.checkRow}>
                {icon}
                <Text style={styles.checkText}>{copy.checks[i]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.acceptRow}
            onPress={() => setConfirmAccepted(!confirmAccepted)}
          >
            <Checkbox checked={confirmAccepted} onChange={setConfirmAccepted} />
            <Text style={styles.acceptText}>{copy.finalAccept}</Text>
          </Pressable>
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
  scroll: {
    padding: spacing.screenX,
    gap: spacing.lg,
  },
  photosBlock: {
    gap: spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoTile: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
  },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: t.colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadTile: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.text,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hintText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.critical,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  acceptText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
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
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeLight,
  },
  confirmBody: {
    gap: spacing.lg,
  },
  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.lg,
  },
  warnBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: t.colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  warnTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  warnTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.orange,
  },
  warnText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  checksTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  checks: {
    gap: spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
});
