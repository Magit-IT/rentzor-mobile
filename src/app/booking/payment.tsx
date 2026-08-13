import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionBar,
  BottomSheet,
  Button,
  Checkbox,
  PageHeader,
  PageScrollView,
} from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { TransactionIcon } from '../../components/TransactionIcon';
import { useToast } from '../../components/Toast';
import { formatUZS } from '../../context/BalanceContext';
import { useT } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useOwnerBalance } from '../../hooks/useOwnerBalance';
import { supabase } from '../../integrations/supabase/client';
import { billableDays, wallMs } from '../../lib/bookingTime';
import { recordAcceptance } from '../../lib/recordAcceptance';
import { fonts, radius, spacing, Theme } from '../../theme';

// Real item/date/price, passed from the product screen's calendar+time
// picker. rental_cost/service_fee/total_cost below are display-only, same
// as web's own SERVICE_FEE_PERCENT comment notes — the DB trigger
// (aa_enforce_booking_money) is what actually prices the booking on insert.
const SERVICE_FEE_RATE = 0.1;

// Tashkent is UTC+5 (no DST). Kept local rather than in lib/bookingTime.ts:
// that module holds wall-clock math only and must never be mixed with
// Date.now() — real-clock lead-time checks live at the call sites, as on web.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Real UTC instant for a Tashkent wall-clock date + "HH:00". */
function tashkentWallToUtcMs(ymd: string, hhmm: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, 0, 0) - TASHKENT_OFFSET_MS;
}

function useBookingParams() {
  const params = useLocalSearchParams<{
    itemId: string;
    ownerId: string;
    title: string;
    image: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
    dropoffTime: string;
    pricePerDay: string;
    /** '1' when the product screen resolved these times as auto-confirming. */
    willAutoConfirm: string;
  }>();

  const pricePerDay = Number(params.pricePerDay) || 0;
  const startMs = params.startDate ? wallMs(params.startDate, params.pickupTime || '09:00') : null;
  const endMs = params.endDate ? wallMs(params.endDate, params.dropoffTime || '19:00') : null;
  const totalDays = startMs != null && endMs != null ? billableDays(startMs, endMs) : 0;
  const rentalCost = totalDays * pricePerDay;
  const serviceFee = Math.round(rentalCost * SERVICE_FEE_RATE);

  return {
    itemId: params.itemId,
    ownerId: params.ownerId || '',
    title: params.title || '',
    image: params.image || null,
    startDate: params.startDate,
    endDate: params.endDate,
    pickupTime: params.pickupTime || '09:00',
    dropoffTime: params.dropoffTime || '19:00',
    willAutoConfirm: params.willAutoConfirm === '1',
    totalDays,
    rentalCost,
    serviceFee,
    totalCost: rentalCost + serviceFee,
  };
}

/** "2026-05-08" -> "8 May" */
function formatDay(ymd: string, months: readonly string[]): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${d} ${months[m - 1]}`;
}

function InfoCircle({ size = 20, color }: { size?: number; color?: string }) {
  const t = useTheme();
  color = color ?? t.colors.critical;
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={7.5} stroke={color} strokeWidth={1.5} />
      <Path d="M10 9.2V13.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={10} cy={6.6} r={0.9} fill={color} />
    </Svg>
  );
}

/** Dashed clock — the late-penalty glyph from the product page, in orange. */
function PenaltyClockIcon({ size = 24 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2"
        stroke={t.colors.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 9V13H16"
        stroke={t.colors.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={t.colors.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="0.5 3.5"
      />
    </Svg>
  );
}

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

function ContractIcon({ size = 20, color }: { size?: number; color?: string }) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M14 2V8H20" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M12 11V17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M9.5 14.5L12 17L14.5 14.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Icons pair index-for-index with t.payment.terms. */
const makeTermIcons = (t: Theme) => [
  <PenaltyClockIcon />,
  <CameraIcon />,
  <AppIcon name="dangerTriangle" color={t.colors.critical} />,
  <AppIcon name="shieldCheck" color={t.colors.success} />,
];

export default function PaymentScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { userId, profile, refresh } = useProfile();
  const booking = useBookingParams();
  // Money reserved for pending bookings isn't spendable — mirrors web's
  // BookingForm: Math.max(0, balance - held_balance). On top of that, the
  // display-only wallet split keeps the owner's funds out of renter mode, so
  // the spendable figure never exceeds what the renter profile card shows.
  const { net: ownerFunds } = useOwnerBalance();
  const walletAvailable = Math.max(0, (profile?.balance ?? 0) - (profile?.held_balance ?? 0));
  const renterFunds = Math.max(0, (profile?.balance ?? 0) - ownerFunds);
  const balance = Math.min(renterFunds, walletAvailable);
  const sufficient = balance >= booking.totalCost;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mirrors web's useCreateBooking (rentzor-marketplace/src/hooks/useBookings.ts):
  // send only the booking identity — money fields and total_days are computed
  // server-side by the aa_enforce_booking_money trigger, which also charges/
  // holds the balance and can auto-confirm for auto_confirm_enabled owners.
  const confirmBooking = async () => {
    if (submitting) return;
    if (!userId || !booking.ownerId) {
      console.error(
        '[booking] cannot create — missing ids. userId:', userId,
        'ownerId:', booking.ownerId,
        '(stale payment screen from before ownerId was added to the route params?)',
      );
      toast.error(tr.payment.bookingError);
      return;
    }
    if (userId === booking.ownerId) {
      toast.error(tr.payment.cannotBookOwn);
      return;
    }
    // Re-check the server's lead-time gates at submit time — the screen may
    // have sat idle long enough for the pickup to drift inside them. Mirrors
    // web's pre-submit guard in BookingForm.handleConfirmBooking.
    const leadHours =
      (tashkentWallToUtcMs(booking.startDate, booking.pickupTime) - Date.now()) / 3_600_000;
    if (leadHours < 2) {
      toast.error(tr.payment.leadTimeError);
      return;
    }
    if (leadHours < 12 && !booking.willAutoConfirm) {
      toast.error(tr.payment.instantOnlyWindow);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        item_id: booking.itemId,
        owner_id: booking.ownerId,
        renter_id: userId,
        start_date: booking.startDate,
        end_date: booking.endDate,
        pickup_time: booking.pickupTime,
        dropoff_time: booking.dropoffTime,
        status: 'pending',
        contract_accepted_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();
    setSubmitting(false);

    if (error || !data) {
      console.error(
        '[booking] insert failed:',
        error?.code, error?.message, '| details:', error?.details, '| hint:', error?.hint,
      );
      const msg = error?.message ?? '';
      // Lead-time rules are raised by the DB trigger with a human-readable
      // message; web surfaces them verbatim too (BookingForm catch block).
      if (/12 hours|2 hours|instant confirmation|pickup must be at least/i.test(msg)) {
        toast.error(msg);
      } else if (/insufficient balance/i.test(msg)) {
        toast.error(tr.payment.insufficientTitle);
      } else {
        toast.error(tr.payment.bookingError);
      }
      return;
    }

    setConfirmVisible(false);
    recordAcceptance(userId, 'rental_contract', data.id).catch(() => {});
    refresh(); // balance/held_balance changed server-side
    // Android drops navigations issued while a native Modal window is still
    // attached — wait out the sheet's 220ms slide-out before replacing, and
    // only overlay the toast Modal once the new screen is up.
    setTimeout(() => {
      router.replace('/(tabs)/bookings');
      setTimeout(() => toast.success(tr.payment.requestSent), 350);
    }, 300);
  };

  const dateRangeLabel =
    booking.startDate && booking.endDate
      ? `${formatDay(booking.startDate, tr.product.months)} - ${formatDay(booking.endDate, tr.product.months)}`
      : '';

  const confirmDetails = [
    [
      { label: tr.payment.item, value: booking.title },
      { label: tr.payment.period, value: dateRangeLabel },
    ],
    [
      { label: tr.payment.duration, value: tr.bookingDetail.daysFor(booking.totalDays) },
      { label: tr.payment.totalPrice, value: formatUZS(booking.totalCost) },
    ],
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={tr.payment.title} onBack={() => router.back()} />

      <PageScrollView style={styles.scrollArea} contentContainerStyle={styles.scroll}>
        {/* Product summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            {booking.image ? (
              <Image source={{ uri: booking.image }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, { backgroundColor: t.colors.surface }]} />
            )}
            <View style={styles.summaryText}>
              <Text style={styles.title}>{booking.title}</Text>
              <Text style={styles.meta}>
                {dateRangeLabel} • {tr.bookingDetail.daysFor(booking.totalDays)}
              </Text>
              <Text style={styles.meta}>
                {tr.product.pickupReturnTimes}: {booking.pickupTime} — {booking.dropoffTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.bookingDetail.priceBreakdown}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{tr.bookingDetail.daysFor(booking.totalDays)}</Text>
            <Text style={styles.priceValue}>{formatUZS(booking.rentalCost)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{tr.bookingDetail.serviceFee}</Text>
            <Text style={styles.priceValue}>{formatUZS(booking.serviceFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>{tr.bookingDetail.total}</Text>
            <Text style={styles.totalValue}>{formatUZS(booking.totalCost)}</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <View style={styles.balanceIcon}>
              <TransactionIcon name="card" color={t.colors.textInverse} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.meta}>{tr.payment.yourBalance}</Text>
              <Text style={styles.balanceValue}>{formatUZS(balance)}</Text>
            </View>
          </View>
        </View>

        {/* Insufficient funds alert */}
        {!sufficient && (
          <View style={styles.alert}>
            <View style={styles.alertHead}>
              <InfoCircle />
              <Text style={styles.alertTitle}>{tr.payment.insufficientTitle}</Text>
            </View>
            <Text style={styles.alertText}>
              {tr.payment.insufficientText}
              {'\n'}
              {tr.payment.yourBalanceShort}
              <Text style={styles.alertTextBold}>{formatUZS(balance)}</Text>
            </Text>
          </View>
        )}
      </PageScrollView>

      <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
        {sufficient ? (
          <Button
            title={tr.payment.pay}
            onPress={() => {
              setAccepted(false);
              setConfirmVisible(true);
            }}
          />
        ) : (
          <Button title={tr.topUp.title} onPress={() => router.push('/booking/top-up')} />
        )}
      </ActionBar>

      {/* Order confirmation sheet */}
      <BottomSheet
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title={tr.payment.confirmOrder}
        footer={
          <ActionBar>
            <Button
              title={tr.common.cancel}
              variant="secondary"
              onPress={() => setConfirmVisible(false)}
            />
            <Button
              title={tr.common.confirm}
              disabled={!accepted || submitting}
              onPress={confirmBooking}
            />
          </ActionBar>
        }
      >
        <View style={styles.confirmBody}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmCardTitle}>{tr.payment.bookingInfo}</Text>
            {confirmDetails.map((row, i) => (
              <View key={i} style={styles.confirmGridRow}>
                {row.map((cell) => (
                  <View key={cell.label} style={styles.confirmCell}>
                    <Text style={styles.confirmLabel}>{cell.label}</Text>
                    <Text style={styles.confirmValue}>{cell.value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Text style={styles.confirmSection}>{tr.payment.mainTerms}</Text>
          <View style={styles.terms}>
            {makeTermIcons(t).map((icon, i) => (
              <View key={i} style={styles.termRow}>
                {icon}
                <Text style={styles.termText}>{tr.payment.terms[i]}</Text>
              </View>
            ))}
          </View>

          <Button
            title={tr.payment.downloadContract}
            variant="outlined"
            leftIcon={<ContractIcon />}
            onPress={() => {}}
          />

          <Pressable style={styles.acceptRow} onPress={() => setAccepted(!accepted)}>
            <Checkbox checked={accepted} onChange={setAccepted} />
            <Text style={styles.acceptText}>{tr.payment.acceptContract}</Text>
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
  scrollArea: {
    flex: 1,
    backgroundColor: t.gray[0],
  },
  scroll: {
    padding : 14,
    gap: spacing.lg,
  },
  card: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  summaryText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  priceLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  priceValue: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
  },
  totalLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 26,
    color: t.colors.text,
  },
  alert: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.red[20],
    backgroundColor: t.red[0],
    padding: spacing.lg,
    gap: spacing.sm,
  },
  alertHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.critical,
  },
  alertText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  alertTextBold: {
    fontFamily: fonts.semiBold,
  },
  confirmBody: {
    gap: spacing.lg,
  },
  confirmCard: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirmCardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  confirmGridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmCell: {
    flex: 1,
    gap: spacing.xs,
  },
  confirmLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  confirmValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  confirmSection: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  terms: {
    gap: spacing.lg,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  termText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
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
});
