/**
 * Figma: Owner — Mahsulot tafsiloti (2137:9723) — hero image pager with a
 * floating back button, status chip + availability toggle, price, Tavsif,
 * condition photos (renter-hidden), equipment-value card, pickup map with
 * the address, pickup/return instructions, and the Tahrirlash / E'lonni
 * o'chirish action bar. Editing re-opens the wizard (resubmits to pending).
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Button, ConfirmDialog, PickupZoneMap } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { ProductIcon } from '../../../components/ProductIcon';
import { useToast } from '../../../components/Toast';
import { Chevron } from '../../../components/icons';
import { useT } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { supabase } from '../../../integrations/supabase/client';
import { formatDailyPrice, formatSum } from '../../../lib/format';
import { yamap } from '../../../lib/yamap';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  price_per_day: number;
  equipment_value: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  pickup_instructions: string | null;
  available: boolean | null;
  status: string | null;
}

interface ItemImage {
  id: string;
  image_url: string;
  image_type: string | null;
}

interface ItemReview {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
}

export default function OwnerProductDetailScreen() {
  const t = useTheme();
  const tr = useT();
  const d = tr.owner.detail;
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [images, setImages] = useState<ItemImage[]>([]);
  const [reviews, setReviews] = useState<ItemReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroPage, setHeroPage] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Refetch on focus so edits made through the wizard show up on return.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let cancelled = false;
      (async () => {
        const [{ data: row }, { data: imgs }, { data: revs }] = await Promise.all([
          supabase
            .from('items')
            .select(
              'id, title, description, price_per_day, equipment_value, location, latitude, longitude, pickup_instructions, available, status',
            )
            .eq('id', id)
            .single(),
          supabase
            .from('item_images')
            .select('id, image_url, image_type')
            .eq('item_id', id)
            .order('image_order', { ascending: true }),
          // Same public renter reviews the renters' product page shows.
          supabase
            .from('reviews')
            .select(
              'id, rating, comment, created_at, reviewer:public_profiles!reviewer_id(full_name, avatar_url)',
            )
            .eq('item_id', id)
            .eq('visibility', 'public')
            .eq('review_type', 'renter_to_owner')
            .order('created_at', { ascending: false }),
        ]);
        if (cancelled) return;
        if (row) setItem(row);
        setImages(imgs ?? []);
        setReviews((revs ?? []) as unknown as ItemReview[]);
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  const displayImages = images.filter((i) => i.image_type === 'display');
  const conditionImages = images.filter((i) => i.image_type === 'condition');
  const isActive = item?.available !== false;
  const ratedReviews = reviews.filter((r) => r.rating != null);
  const avgRating = ratedReviews.length
    ? ratedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedReviews.length
    : null;

  // The owner sees their own listing, so the map shows the exact pickup pin
  // rather than the renters' approximate 1km zone circle. Rendered inside a
  // native <Marker> when MapKit is available, or as a screen-space overlay
  // over the static fallback image (same pattern as booking/[id].tsx).
  const pickupPin = (
    <Svg width={36} height={44} viewBox="0 0 36 44" fill="none">
      <Path
        d="M18 2C9.7 2 3 8.7 3 17C3 27.5 18 42 18 42C18 42 33 27.5 33 17C33 8.7 26.3 2 18 2Z"
        fill={t.colors.critical}
      />
      <Circle cx={18} cy={17} r={6} fill="#FFFFFF" />
    </Svg>
  );
  // Anchors the pin's SVG tip (bottom-center of the 36x44 art) to the
  // marker's coordinate, instead of the marker's own center.
  const pinAnchor = { x: 0.5, y: 42 / 44 };

  const toggleAvailability = async () => {
    if (!item || toggling) return;
    setToggling(true);
    try {
      const next = !isActive;
      const { error } = await supabase
        .from('items')
        .update({ available: next })
        .eq('id', item.id);
      if (error) throw error;
      setItem({ ...item, available: next });
    } catch {
      toast.error(tr.owner.wizard.submitError);
    } finally {
      setToggling(false);
    }
  };

  const deleteItem = async () => {
    if (!item || deleting) return;
    setDeleting(true);
    try {
      // Items with booking history can't be hard-deleted (bookings FK has no
      // cascade) — unlist them instead so renters stop seeing the listing.
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('item_id', item.id);
      if ((count ?? 0) > 0) {
        await supabase.from('items').update({ available: false }).eq('id', item.id);
        toast.show(d.deleteBlocked, 'info');
        setItem({ ...item, available: false });
        setDeleteVisible(false);
        return;
      }

      // RLS only lets owners delete draft/rejected rows — park the listing
      // in draft first, then delete for real (verified via .select()).
      const { error: statusError } = await supabase
        .from('items')
        .update({ status: 'draft' })
        .eq('id', item.id);
      if (statusError) throw statusError;
      await supabase.from('item_images').delete().eq('item_id', item.id);
      const { data: deleted, error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)
        .select('id');
      if (error || !deleted?.length) throw error ?? new Error('delete blocked');
      toast.success(tr.owner.deletedToast);
      setDeleteVisible(false);
      router.back();
    } catch {
      toast.error(tr.owner.wizard.submitError);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !item) {
    return (
      <View style={[styles.container, styles.loadingWrap]}>
        {loading ? (
          <ActivityIndicator color={t.colors.primary} />
        ) : (
          <Text style={styles.sectionBody}>{d.loadError}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero image pager */}
        <View style={styles.hero}>
          {displayImages.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setHeroPage(Math.round(e.nativeEvent.contentOffset.x / winW))
              }
            >
              {displayImages.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.image_url }}
                  style={{ width: winW, height: 300 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroPlaceholder, { width: winW }]}>
              <AppIcon name="imagePlaceholder" color={t.gray[40]} size={48} />
            </View>
          )}
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
          >
            <Chevron direction="left" size={22} color={t.colors.text} />
          </Pressable>
          {displayImages.length > 1 && (
            <View style={styles.dots}>
              {displayImages.map((img, i) => (
                <View key={img.id} style={[styles.dot, i === heroPage && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Status + availability toggle */}
          <View style={styles.statusRow}>
            <View style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}>
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? t.green[70] : t.colors.textSecondary },
                ]}
              >
                {isActive ? tr.owner.productStatus.active : d.inactiveChip}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.toggleButton, pressed && press.dim]}
              disabled={toggling}
              onPress={toggleAvailability}
            >
              {toggling ? (
                <ActivityIndicator size="small" color={t.colors.text} />
              ) : (
                <>
                  <AppIcon name={isActive ? 'eyeOff' : 'eye'} color={t.colors.text} size={16} />
                  <Text style={styles.toggleText}>{isActive ? d.turnOff : d.turnOn}</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>{formatDailyPrice(item.price_per_day)}</Text>

          {/* Description */}
          {!!item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{d.descriptionTitle}</Text>
              <Text style={styles.sectionBody}>{item.description}</Text>
            </View>
          )}

          {/* Condition photos */}
          {conditionImages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{d.conditionTitle}</Text>
              <Text style={styles.sectionNote}>{d.conditionNote}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.thumbRow}>
                  {conditionImages.map((img) => (
                    <Image key={img.id} source={{ uri: img.image_url }} style={styles.thumb} />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Equipment value */}
          <View style={styles.valueCard}>
            <Text style={styles.sectionNote}>{d.valueLabel}</Text>
            <Text style={styles.valueAmount}>{formatSum(item.equipment_value)}</Text>
          </View>

          {/* Reviews — same section as the renters' product page. */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <View style={styles.scoreRow}>
                  <ProductIcon name="star" color={t.colors.warning} size={24} />
                  <Text style={styles.reviewsScore}>{avgRating?.toFixed(1)}</Text>
                  <Text style={styles.reviewsCount}>
                    {tr.bookingDetail.reviewsCount(reviews.length)}
                  </Text>
                </View>
                <Button
                  title={tr.common.all}
                  variant="ghostBlue"
                  size="medium"
                  onPress={() => router.push(`/product/${item.id}/reviews`)}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewsRail}
              >
                {reviews.slice(0, 5).map((r) => (
                  <View key={r.id} style={[styles.reviewCard, { width: winW - 58 }]}>
                    <View style={styles.rowBetween}>
                      <View style={styles.reviewAuthorRow}>
                        {r.reviewer?.avatar_url ? (
                          <Image source={{ uri: r.reviewer.avatar_url }} style={styles.reviewAvatar} />
                        ) : (
                          <View style={[styles.reviewAvatar, styles.reviewAvatarFallback]}>
                            <Text style={styles.reviewAvatarInitial}>
                              {(r.reviewer?.full_name ?? '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reviewAuthorInfo}>
                          <Text style={styles.reviewAuthor} numberOfLines={1}>
                            {r.reviewer?.full_name ?? '—'}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      </View>
                      {r.rating != null && (
                        <View style={styles.scoreRow}>
                          <ProductIcon name="star" color={t.colors.warning} />
                          <Text style={styles.scoreText}>{r.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.reviewText} numberOfLines={3}>
                      {r.comment}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Pickup location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{d.pickupTitle}</Text>
            {item.latitude != null && item.longitude != null && (
              <View style={styles.map}>
                <PickupZoneMap
                  latitude={item.latitude}
                  longitude={item.longitude}
                  showExactLocation
                  style={styles.mapInner}
                >
                  {yamap && (
                    <yamap.Marker
                      point={{ lat: item.latitude, lon: item.longitude }}
                      anchor={pinAnchor}
                    >
                      {pickupPin}
                    </yamap.Marker>
                  )}
                </PickupZoneMap>
                {!yamap && (
                  <View style={styles.mapPinWrap} pointerEvents="none">
                    {pickupPin}
                  </View>
                )}
              </View>
            )}
            {!!item.location && <Text style={styles.sectionNote}>{item.location}</Text>}
          </View>

          {/* Pickup/return instructions */}
          {!!item.pickup_instructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.sectionTitle}>{d.instructionsTitle}</Text>
              <Text style={styles.sectionBody}>{item.pickup_instructions}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tahrirlash / E'lonni o'chirish action bar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && press.dim]}
          onPress={() => router.push(`/(owner)/new-listing?draftId=${item.id}`)}
        >
          <Text style={styles.editText}>{d.edit}</Text>
        </Pressable>
        <Button
          title={tr.owner.deleteListing}
          variant="critical"
          onPress={() => setDeleteVisible(true)}
          style={styles.deleteButton}
        />
      </View>

      <ConfirmDialog
        visible={deleteVisible}
        title={tr.owner.deleteListing}
        message={tr.owner.deleteConfirmMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={tr.owner.deleteShort}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={deleteItem}
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    loadingWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingBottom: spacing.xxl,
    },
    hero: {
      height: 300,
      backgroundColor: t.gray[10],
    },
    heroPlaceholder: {
      height: 300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButton: {
      position: 'absolute',
      left: spacing.lg,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: t.colors.backgroundSecondary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    dots: {
      position: 'absolute',
      bottom: spacing.md,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
      backgroundColor: '#FFFFFF',
    },
    body: {
      gap: spacing.md,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.screenX,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      marginTop: -radius.lg,
      backgroundColor: t.colors.background,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    chipActive: {
      backgroundColor: t.green[0],
    },
    chipInactive: {
      backgroundColor: t.gray[10],
    },
    chipText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.colors.strokeDark,
      backgroundColor: t.colors.backgroundSecondary,
    },
    toggleText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.text,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      lineHeight: 30,
      color: t.colors.text,
    },
    price: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 26,
      color: t.colors.primary,
    },
    section: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    sectionNote: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
    },
    sectionBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    thumbRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    thumb: {
      width: 110,
      height: 90,
      borderRadius: radius.md,
      backgroundColor: t.gray[10],
    },
    valueCard: {
      gap: 2,
      padding: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    valueAmount: {
      fontFamily: fonts.bold,
      fontSize: 18,
      lineHeight: 26,
      color: t.colors.text,
    },
    // Reviews rail — same styles as the renters' product page.
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    scoreText: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    reviewsScore: {
      fontFamily: fonts.semiBold,
      fontSize: 20,
      lineHeight: 32,
      color: t.colors.text,
    },
    reviewsCount: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    reviewsRail: { gap: spacing.md },
    reviewCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    reviewAuthorRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reviewAuthorInfo: { flex: 1 },
    reviewAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    reviewAvatarFallback: {
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewAvatarInitial: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      color: t.colors.textMuted,
    },
    reviewAuthor: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    reviewDate: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    reviewText: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: t.gray[70],
    },
    map: {
      height: 180,
      borderRadius: radius.base,
      overflow: 'hidden',
    },
    mapInner: {
      flex: 1,
    },
    mapPinWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    instructionsCard: {
      gap: spacing.sm,
      padding: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: radius.base,
      backgroundColor: t.colors.surface,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
    },
    editButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
    },
    editText: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    deleteButton: {
      flex: 1,
    },
  });
