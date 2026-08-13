
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ConfirmDialog, PageHeader } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { RatingStars } from '../../../components/RatingStars';
import { useToast } from '../../../components/Toast';
import { useT } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { OWNER_SHARE, ownerOrderStatus } from '../../../hooks/useOwnerBookings';
import { supabase } from '../../../integrations/supabase/client';
import { fetchPrimaryImages } from '../../../lib/itemImages';
import { formatDailyPrice, formatPhoneNumber, formatSum } from '../../../lib/format';
import { fonts, radius, spacing, Theme } from '../../../theme';

interface RenterReview {
  rating: number | null;
  comment: string | null;
  visibility: string | null;
}

interface OwnerBookingDetail {
  id: string;
  status: string | null;
  start_date: string;
  end_date: string;
  total_days: number | null;
  pickup_time: string | null;
  dropoff_time: string | null;
  rental_cost: number | null;
  owner_share_rate: number | null;
  item_id: string | null;
  renter_id: string | null;
  item_title: string | null;
  item_price_per_day: number | null;
  item_image: string | null;
  renter_name: string | null;
  renter_avatar: string | null;
  renter_verified: boolean;
  renter_phone: string | null;
  /**
   * The renter's reviews of this booking. RLS returns the public row to
   * everyone and the private row only to the reviewee — i.e. this owner.
   */
  reviews: RenterReview[];
}

export default function OwnerBookingDetailScreen() {
  const t = useTheme();
  const tr = useT();
  const o = tr.owner.order;
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<OwnerBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reject' | 'return' | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: row, error } = await supabase
      .from('bookings')
      .select(
        'id, status, start_date, end_date, total_days, pickup_time, dropoff_time, rental_cost, owner_share_rate, item_id, renter_id',
      )
      .eq('id', id)
      .single();
    if (error || !row) {
      if (error) console.error('[owner-order] booking load failed:', JSON.stringify(error, null, 2));
      setLoading(false);
      return;
    }

    const [itemRes, profileRes, phoneRes, imageMap, reviewsRes] = await Promise.all([
      row.item_id
        ? supabase.from('items').select('title, price_per_day').eq('id', row.item_id).single()
        : Promise.resolve({ data: null }),
      row.renter_id
        ? supabase
            .from('public_profiles')
            .select('full_name, avatar_url, verified')
            .eq('id', row.renter_id)
            .single()
        : Promise.resolve({ data: null }),
      row.renter_id
        ? supabase.rpc('get_booking_party_phone', { p_other_user_id: row.renter_id })
        : Promise.resolve({ data: null }),
      fetchPrimaryImages(row.item_id ? [row.item_id] : []),
      supabase
        .from('reviews')
        .select('rating, comment, visibility')
        .eq('booking_id', row.id)
        .eq('review_type', 'renter_to_owner')
        .order('visibility', { ascending: false }),
    ]);

    setBooking({
      id: row.id,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      total_days: row.total_days,
      pickup_time: row.pickup_time,
      dropoff_time: row.dropoff_time,
      rental_cost: row.rental_cost,
      owner_share_rate: row.owner_share_rate,
      item_id: row.item_id,
      renter_id: row.renter_id,
      item_title: itemRes.data?.title ?? null,
      item_price_per_day: itemRes.data?.price_per_day ?? null,
      item_image: row.item_id ? (imageMap[row.item_id] ?? null) : null,
      renter_name: profileRes.data?.full_name ?? null,
      renter_avatar: profileRes.data?.avatar_url ?? null,
      renter_verified: profileRes.data?.verified === true,
      renter_phone: (phoneRes.data as string | null) ?? null,
      reviews: (reviewsRes.data ?? []) as RenterReview[],
    });
    setLoading(false);
  }, [id]);

  // Refetch on focus so status changes made elsewhere show up on return.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const updateStatus = async (newStatus: 'confirmed' | 'rejected' | 'completed') => {
    if (!booking || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('owner_update_booking_status', {
        p_booking_id: booking.id,
        p_new_status: newStatus,
      });
      if (error) throw error;
      toast.success(o.updated);
      setConfirmAction(null);
      await load();
    } catch (e) {
      console.error(
        `[owner-order] owner_update_booking_status failed (booking=${booking.id}, from=${booking.status}, to=${newStatus}):`,
        JSON.stringify(e, null, 2),
      );
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(
        /insufficient renter balance/i.test(msg) ? o.renterInsufficientBalance : tr.owner.wizard.submitError,
      );
    } finally {
      setBusy(false);
    }
  };

  /** "2026-07-12" + "09:00:00" -> "12 iyul, 09:00" */
  const dateTime = (ymd: string, time: string | null, fallback: string) => {
    const d = new Date(ymd);
    const day = Number.isNaN(d.getTime())
      ? ''
      : `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()}`;
    return `${day}, ${time ? time.slice(0, 5) : fallback}`;
  };

  if (loading || !booking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <PageHeader title={o.title} onBack={() => router.back()} />
        <View style={styles.loadingWrap}>
          {loading ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : (
            <Text style={styles.rowLabel}>{o.loadError}</Text>
          )}
        </View>
      </View>
    );
  }

  const displayStatus = ownerOrderStatus(booking.status);
  const chip = (() => {
    switch (displayStatus) {
      case 'active':
        return { bg: t.green[0], text: t.green[70] };
      case 'pending':
        return { bg: t.orange[0], text: t.orange[60] };
      case 'cancelled':
        return { bg: t.red[0], text: t.red[60] };
      default:
        return { bg: t.gray[10], text: t.colors.textSecondary };
    }
  })();

  const rentalCost = booking.rental_cost ?? 0;
  const earnings = Math.round(rentalCost * (booking.owner_share_rate ?? OWNER_SHARE));
  const commission = rentalCost - earnings;
  const days = booking.total_days ?? 0;

  const rowPair = (label: string, value: string, valueStyle?: object) => (
    <View style={styles.row} key={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );

  // Matches the DB owner_update_booking_status transitions exactly:
  // pending → confirmed/rejected, pending_owner_confirmation → completed.
  // While the rental runs (in_progress/returning/overdue) the OWNER can't
  // complete it — the renter's return flow must reach
  // pending_owner_confirmation first.
  const canDecide = booking.status === 'pending';
  const canCompleteReturn = booking.status === 'pending_owner_confirmation';

  const publicReview = booking.reviews.find((r) => r.visibility === 'public') ?? null;
  const privateReview = booking.reviews.find((r) => r.visibility === 'private') ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PageHeader title={o.title} onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.statusChipText, { color: chip.text }]}>
            {tr.owner.orderStatus[displayStatus]}
          </Text>
        </View>

        {/* Item summary */}
        <View style={styles.card}>
          <View style={styles.itemRow}>
            {booking.item_image ? (
              <Image source={{ uri: booking.item_image }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <AppIcon name="imagePlaceholder" color={t.gray[40]} size={24} />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {booking.item_title ?? ''}
              </Text>
              {booking.item_price_per_day != null && (
                <Text style={styles.itemPrice}>{formatDailyPrice(booking.item_price_per_day)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Renter */}
        <Text style={styles.sectionTitle}>{o.renterTitle}</Text>
        <View style={[styles.card, styles.renterCard]}>
          {booking.renter_avatar ? (
            <Image source={{ uri: booking.renter_avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppIcon name="user" color={t.gray[60]} size={36} />
            </View>
          )}
          <View style={styles.renterInfo}>
            <Text style={styles.renterName}>{booking.renter_name ?? ''}</Text>
            {!!booking.renter_phone && (
              <Text style={styles.renterPhone}>{formatPhoneNumber(booking.renter_phone)}</Text>
            )}
            {booking.renter_verified && (
              <View style={styles.idBadge}>
                <AppIcon name="shieldCheck" color={t.blue[70]} size={16} />
                <Text style={styles.idBadgeText}>{tr.profile.myIdVerified}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rental period */}
        <View style={[styles.card, styles.rowsCard]}>
          <Text style={styles.cardTitle}>{o.periodTitle}</Text>
          {rowPair(o.pickup, dateTime(booking.start_date, booking.pickup_time, '09:00'))}
          {rowPair(o.return, dateTime(booking.end_date, booking.dropoff_time, '19:00'))}
          {rowPair(o.duration, `${days} ${o.daySuffix}`)}
        </View>

        {/* Cost breakdown */}
        <View style={[styles.card, styles.rowsCard]}>
          <Text style={styles.cardTitle}>{o.costTitle}</Text>
          {rowPair(o.rentalLine(days), formatSum(rentalCost))}
          {rowPair(o.commission, `− ${formatSum(commission)}`)}
          <View style={styles.divider} />
          {rowPair(o.yourEarnings, formatSum(earnings), styles.earnings)}
        </View>

        {/* Renter's review of this booking — public row plus, thanks to the
            "viewable by reviewee" RLS policy, the hidden comment only this
            owner can read. */}
        {(publicReview != null || privateReview != null) && (
          <View style={[styles.card, styles.reviewCard]}>
            <Text style={styles.cardTitle}>{o.reviewTitle}</Text>
            {publicReview != null && (
              <View style={styles.reviewBlock}>
                <View style={styles.reviewLabelRow}>
                  <AppIcon name="eye" color={t.colors.textSecondary} size={18} />
                  <Text style={styles.reviewLabel}>{o.publicReviewLabel}</Text>
                </View>
                <RatingStars rating={publicReview.rating ?? 0} size={20} />
                {!!publicReview.comment && (
                  <Text style={styles.reviewComment}>{publicReview.comment}</Text>
                )}
              </View>
            )}
            {publicReview != null && privateReview != null && <View style={styles.divider} />}
            {privateReview != null && (
              <View style={styles.reviewBlock}>
                <View style={styles.reviewLabelRow}>
                  <AppIcon name="eyeOff" color={t.colors.textSecondary} size={18} />
                  <Text style={styles.reviewLabel}>{o.privateReviewLabel}</Text>
                </View>
                {!!privateReview.comment && (
                  <Text style={styles.reviewComment}>{privateReview.comment}</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {(canDecide || canCompleteReturn) && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {canDecide && (
            <>
              <Button
                title={o.reject}
                variant="secondary"
                disabled={busy}
                onPress={() => setConfirmAction('reject')}
                style={styles.footerButton}
              />
              <Button
                title={o.confirm}
                loading={busy}
                onPress={() => updateStatus('confirmed')}
                style={styles.footerButton}
              />
            </>
          )}
          {canCompleteReturn && (
            <Button
              title={o.markReturned}
              loading={busy}
              onPress={() => setConfirmAction('return')}
              style={styles.footerButton}
            />
          )}
        </View>
      )}

      <ConfirmDialog
        visible={confirmAction === 'reject'}
        title={o.rejectConfirmTitle}
        message={o.rejectConfirmMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={o.reject}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => updateStatus('rejected')}
      />
      <ConfirmDialog
        visible={confirmAction === 'return'}
        title={o.returnConfirmTitle}
        message={o.returnConfirmMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={o.confirm}
        confirmVariant="primary"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => updateStatus('completed')}
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
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      gap: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
      paddingHorizontal: spacing.screenX,
    },
    statusChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    statusChipText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
    },
    card: {
      padding: spacing.lg,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: t.gray[10],
    },
    thumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemInfo: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    itemPrice: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: t.colors.textSecondary,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    renterCard: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.lg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.gray[10],
    },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    renterInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    renterName: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    renterPhone: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    idBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.blue[10],
      backgroundColor: t.blue[0],
    },
    idBadgeText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
      color: t.blue[70],
    },
    rowsCard: {
      gap: spacing.md,
    },
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    rowLabel: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    rowValue: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.strokeLight,
    },
    earnings: {
      fontFamily: fonts.semiBold,
      color: t.green[60],
    },
    reviewCard : {
      gap : spacing.md,
      marginBottom : 25,
    },
    reviewBlock: {
      gap: spacing.sm,
    },
    reviewLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    reviewLabel: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
      color: t.colors.textSecondary,
    },
    reviewComment: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.lg,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
    },

    footerButton: {
      flex: 1,
    },
  });
