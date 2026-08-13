/**
 * Figma: Booking flow (payment) / Bookings — "Buyurtmalar" header, status
 * filter pills (Barchasi / Kutilayotgan / ...), and booking cards with
 * thumbnail, dates, price and a status chip.
 *
 * Mirrors rentzor-marketplace's useRenterBookings: mobile is the renter-facing
 * app (same as rz1), so this fetches bookings where the signed-in user is the
 * renter, joined to the item and enriched with the owner's public profile.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ConfirmDialog, EmptyState, PageHeader, Tabs, useToast } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { DisputeDialog } from '../../components/DisputeDialog';
import {
  BanIcon,
  BanknoteIcon,
  CalendarIcon,
  FileDownIcon,
  KebabIcon,
  WarningTriangleIcon,
} from '../../components/icons';
import { formatUZS } from '../../context/BalanceContext';
import { useT } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Booking, cancelBooking, useBookings } from '../../hooks/useBookings';
import {
  CANCELLABLE_STATUSES,
  DISPUTABLE_STATUSES,
  displayStatus,
  statusTone,
  tabForStatus,
} from '../../lib/bookingStatus';
import { groupDigits } from '../../lib/format';
import { fonts, press, radius, spacing, Theme } from '../../theme';

function BookingCard({
  booking,
  onPress,
  onCancel,
  onDispute,
}: {
  booking: Booking;
  onPress: () => void;
  onCancel: () => void;
  onDispute: () => void;
}) {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const { width: windowWidth } = useWindowDimensions();
  const kebabRef = useRef<View>(null);
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null);

  const status = displayStatus(booking.status, booking.dispute_status);
  const tone = statusTone(status);
  const toneColors: Record<string, { bg: string; fg: string }> = {
    success: { bg: t.green[10], fg: t.colors.success },
    warning: { bg: t.orange[10], fg: t.orange[50] },
    danger: { bg: t.red[10], fg: t.colors.critical },
    info: { bg: t.blue[0], fg: t.colors.primary },
    neutral: { bg: t.gray[10], fg: t.colors.textSecondary },
  };
  const cancellable = booking.status !== null && CANCELLABLE_STATUSES.has(booking.status);
  // renter_open_dispute only accepts these statuses — same as the detail screen.
  const disputable = booking.status !== null && DISPUTABLE_STATUSES.has(booking.status);

  /** "2026-05-08" -> "8 May" */
  const day = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${tr.product.months[d.getMonth()]}`;
  };

  const openMenu = () => {
    kebabRef.current?.measureInWindow((x, y, _w, h) => {
      // Below the kebab, right edge ending just left of it (per the design).
      setMenu({ top: y + h, right: windowWidth - x + spacing.xs });
    });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {booking.primary_image ? (
        <Image source={{ uri: booking.primary_image }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: t.colors.surface }]} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>
          {booking.item?.title ?? '—'}
        </Text>
        <View style={styles.metaRow}>
          <CalendarIcon />
          <Text style={styles.metaText}>
            {day(booking.start_date)} - {day(booking.end_date)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <BanknoteIcon />
          <Text style={styles.price}>{formatUZS(booking.total_cost ?? 0)}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: toneColors[tone].bg }]}>
          <Text style={[styles.statusText, { color: toneColors[tone].fg }]}>
            {tr.bookings.status[status] ?? tr.bookings.status.unknown}
          </Text>
        </View>
      </View>
      <Pressable
        ref={kebabRef}
        onPress={openMenu}
        hitSlop={8}
        style={({ pressed }) => [styles.kebabButton, pressed && press.dim]}
      >
        <KebabIcon color={menu != null ? t.colors.primary : t.colors.text} />
      </Pressable>

      {menu != null && (
        <Modal
          visible
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => setMenu(null)}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(null)} />
          <View style={[styles.menu, { top: menu.top, right: menu.right }]}>
            {cancellable && (
              <>
                <Pressable
                  onPress={() => {
                    setMenu(null);
                    onCancel();
                  }}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: t.gray[20] }]}
                >
                  <BanIcon size={22} />
                  <Text style={styles.menuText}>{tr.common.cancel}</Text>
                </Pressable>
                <View style={styles.menuDivider} />
              </>
            )}
            {disputable && (
              <>
                <Pressable
                  onPress={() => {
                    setMenu(null);
                    onDispute();
                  }}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: t.gray[20] }]}
                >
                  <AppIcon name="dangerTriangle" color={t.colors.text} />
                  <Text style={styles.menuText}>{tr.bookingDetail.complain}</Text>
                </Pressable>
                <View style={styles.menuDivider} />
              </>
            )}
            <Pressable
              onPress={() => setMenu(null)}
              style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: t.gray[20] }]}
            >
              <FileDownIcon size={22} />
              <Text style={styles.menuText}>{tr.common.downloadDocument}</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </Pressable>
  );
}

export default function BookingsScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const { userId } = useProfile();
  const { bookings, loading, error, refresh } = useBookings();
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  // Pull-to-refresh: keep the stale list on screen (no full-screen loader)
  // until the re-fetch lands, then drop the pull spinner.
  useEffect(() => {
    if (!loading) setPullRefreshing(false);
  }, [loading]);

  const visible = bookings.filter(
    (b) => activeTab === 0 || tabForStatus(displayStatus(b.status, b.dispute_status)) === activeTab,
  );

  const confirmCancel = async () => {
    const booking = pendingCancel;
    setPendingCancel(null);
    if (!booking) return;

    setCancelling(true);
    const { error: cancelError } = await cancelBooking(booking.id);
    setCancelling(false);
    if (cancelError) {
      toast.error(tr.bookings.cancelFailed);
      return;
    }
    refresh();
  };

  // Guest state (see the guard split in app/_layout.tsx): bookings are
  // account data, so signed-out browsers get a sign-in CTA instead of
  // the list. Same EmptyState + bottom Button pattern as saved.tsx.
  if (!userId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <PageHeader title={tr.bookings.title} />
        <View style={styles.guestContainer}>
          <EmptyState
            image={require('../../assets/empty-states/no-bookings.png')}
            title={tr.signInPrompt.bookingsTitle}
            subtitle={tr.signInPrompt.bookingsSubtitle}
          />
          <View style={[styles.guestCta, { bottom: insets.bottom + spacing.lg }]}>
            <Button
              title={tr.signInPrompt.signIn}
              onPress={() => router.push('/(auth)/phone')}
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={tr.bookings.title} />

      <Tabs
        tabs={tr.bookings.tabs}
        activeIndex={activeTab}
        onChange={setActiveTab}
        style={styles.tabs}
        contentStyle={styles.tabsContent}
      />

      <ScrollView
        // Fill the leftover column space instead of sizing to the cards —
        // otherwise a long list overflows the column and the flex layout
        // compresses the tab strip above (clipping the pills).
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => {
              setPullRefreshing(true);
              refresh();
            }}
            colors={[t.colors.primary]}
            tintColor={t.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.list,
          !loading && !error && visible.length === 0 && styles.listEmpty,
        ]}
      >
        {loading && !pullRefreshing ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{tr.bookings.loadError}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryButton, pressed && press.dim]}
            >
              <Text style={styles.retryText}>{tr.home.retry}</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            image={require('../../assets/empty-states/no-bookings.png')}
            title={tr.bookings.emptyTitle}
            subtitle={tr.bookings.emptySubtitle}
          />
        ) : (
          visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPress={() => router.push(`/booking/${booking.id}`)}
              onCancel={() => setPendingCancel(booking)}
              onDispute={() => setDisputeBookingId(booking.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Cancelling a confirmed booking withholds 50% of the rental cost —
          warn with the refund amount (per the Figma modal); pending is free. */}
      <ConfirmDialog
        visible={pendingCancel !== null}
        title={tr.bookings.cancelTitle}
        icon={pendingCancel?.status === 'confirmed' ? <WarningTriangleIcon /> : undefined}
        message={
          pendingCancel?.status === 'confirmed'
            ? tr.bookingDetail.cancelPenaltyMessage(
                groupDigits(Math.floor((pendingCancel.rental_cost ?? 0) * 0.5)),
              )
            : tr.bookings.cancelMessage
        }
        cancelLabel={tr.common.back}
        confirmLabel={tr.bookings.cancelConfirm}
        onCancel={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
      />

      {/* Report an issue — renter_open_dispute RPC (mirrors the detail screen). */}
      <DisputeDialog
        visible={disputeBookingId !== null}
        bookingId={disputeBookingId ?? ''}
        onClose={() => setDisputeBookingId(null)}
        onSubmitted={refresh}
      />
      {cancelling && (
        <View style={styles.cancellingOverlay}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  tabs: {
    // Margin, not padding — the Tabs wrapper has a fixed height and clips
    // anything inside it (see Tabs.tsx). A border would clip too: it draws
    // inside the fixed height, shaving the pills.
    marginVertical: spacing.xxl,
  },
  tabsContent: {
    paddingHorizontal: spacing.screenX,
  //  borderWidth : 1
  },
  listScroll: { flex: 1 },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
  },
  guestCta: {
    position: 'absolute',
    left: spacing.screenX,
    right: spacing.screenX,
  },
  list: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  emptyBox: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  retryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  cancellingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
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
  cardPressed: { backgroundColor: t.gray[0] },
  thumb: {
    width: 84,
    height: 96,
    borderRadius: radius.md,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  price: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  kebabButton: {
    alignSelf: 'flex-start',
  },
  menu: {
    position: 'absolute',
    minWidth: 210,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeLight,
  },
  menuText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
});
