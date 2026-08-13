/**
 * Figma: Booking flow (payment) / Product Detail (293:12289) — hero image
 * carousel with overlaid controls, details sheet (title, tag, description),
 * date picker card, owner card, map, cost, reviews, similar products, and
 * the price action bar.
 */
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BottomSheet, Button, MyIdLogo, PickupZoneMap, ProductCard, useToast } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { Check, Chevron, CloseX } from '../../../components/icons';
import { ProductIcon } from '../../../components/ProductIcon';
import { useLanguage, useT } from '../../../context/LanguageContext';
import { useProfile } from '../../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { useItem } from '../../../hooks/useItem';
import { useItemAvailability } from '../../../hooks/useItemAvailability';
import { recordItemView } from '../../../hooks/useRecentlyViewed';
import { useSignInPrompt } from '../../../hooks/useSignInPrompt';
import {
  billableDays,
  DAY_MS,
  inflate,
  isDropoffInstantBlocked,
  isPickupInstantBlocked,
  MIN_SPAN_HOURS,
  rangeConflicts,
  spanHours,
  TURNOVER_BUFFER_HOURS,
  wallMs,
  WallInterval,
} from '../../../lib/bookingTime';
import { formatDailyPrice, formatSum } from '../../../lib/format';
import { getMyIdError, verifyIdentity } from '../../../lib/myid';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

// Longer descriptions collapse behind the "read more" toggle.
const DESCRIPTION_LIMIT = 160;

// Selected pickup/return days as "yyyy-MM-dd" (lexicographic order works).
interface DateRange {
  start: string | null;
  end: string | null;
}

/** Monday-first week rows of "yyyy-MM-dd" (null = padding cell). */
function monthRows(year: number, month: number): (string | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

// Hourly slots 00:00–23:00. Which of them auto-confirm depends on the owner's
// available window, so "auto" is resolved per-item (see preferredTimes below)
// rather than baked in here.
const ALL_TIME_SLOTS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, '0')}:00`,
);

// Absolute safety floor (hours) applied even when an owner sets a 0-hour
// minimum. Mirrors the web BookingForm and the server's GREATEST(x, 0.5).
const MIN_NOTICE_FLOOR_HOURS = 0.5;

// Tashkent is UTC+5 (no DST).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Today in Asia/Tashkent as "yyyy-MM-dd". */
function tashkentTodayYmd(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Real UTC instant for a Tashkent wall-clock date + "HH:00". */
function tashkentWallToUtcMs(ymd: string, hhmm: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, 0, 0) - TASHKENT_OFFSET_MS;
}

/** Owner's preferred (auto-confirm) slots from their available window. */
function getPreferredTimes(from: string | null, to: string | null): string[] {
  if (!from || !to) return [];
  const fromHour = parseInt(from.split(':')[0], 10);
  const toHour = parseInt(to.split(':')[0], 10);
  return ALL_TIME_SLOTS.filter((time) => {
    const hour = parseInt(time.split(':')[0], 10);
    return hour >= fromHour && hour <= toHour;
  });
}

function TimeSelect({
  label,
  value,
  open,
  preferredTimes,
  willAutoConfirm,
  isSlotDisabled,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  open: boolean;
  /** Slots inside the owner's auto-confirm window; empty = no badge shown. */
  preferredTimes: string[];
  /**
   * Whether the booking as a whole will auto-confirm. The closed field's badge
   * follows this, not just its own slot — auto-confirm needs BOTH times inside
   * the window, so badging a good pickup next to an out-of-window return would
   * promise something the server then rejects.
   */
  willAutoConfirm: boolean;
  /** Blocked by turnover buffer, minimum span, or lead time. */
  isSlotDisabled: (time: string) => boolean;
  onToggle: () => void;
  onSelect: (time: string) => void;
}) {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const auto = willAutoConfirm && preferredTimes.includes(value);
  const { height: windowHeight } = useWindowDimensions();
  const boxRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);

  const toggle = () => {
    if (!open) {
      boxRef.current?.measureInWindow((x, y, w, h) => {
        setAnchor({ top: y + h + spacing.sm, left: x, width: w });
      });
    }
    onToggle();
  };

  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Pressable
        ref={boxRef}
        onPress={toggle}
        style={({ pressed }) => [styles.timeBox, pressed && press.dim]}
      >
        <Text style={styles.timeValue}>
          {value} {auto && <Text style={styles.timeAuto}>{tr.product.autoConfirm}</Text>}
        </Text>
        <Chevron direction={open ? 'up' : 'down'} size={20} color={t.colors.text} />
      </Pressable>
      {open && anchor != null && (
        <Modal transparent statusBarTranslucent visible onRequestClose={onToggle}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onToggle} />
          <View
            style={[
              styles.timeDropdown,
              {
                top: anchor.top,
                left: anchor.left,
                width: anchor.width,
                maxHeight: Math.min(340, windowHeight - anchor.top - spacing.xl),
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator>
              {ALL_TIME_SLOTS.map((time) => {
                const disabled = isSlotDisabled(time);
                return (
                  <Pressable
                    key={time}
                    disabled={disabled}
                    onPress={() => onSelect(time)}
                    style={({ pressed }) => [
                      styles.timeOption,
                      pressed && !disabled && { backgroundColor: t.gray[20] },
                    ]}
                  >
                    <Text style={[styles.timeValue, disabled && styles.timeValueDisabled]}>
                      {time}{' '}
                      {preferredTimes.includes(time) && !disabled && (
                        <Text style={styles.timeAuto}>{tr.product.autoConfirm}</Text>
                      )}
                    </Text>
                    {time === value && !disabled && <Check size={18} color={t.colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

function CalendarCard({
  range,
  blocked,
  onSelect,
}: {
  range: DateRange;
  blocked: Set<string>;
  onSelect: (ymd: string) => void;
}) {
  const t = useTheme();
  const tr = useT();
  const cal = useThemedStyles(makeCalStyles);

  const now = new Date();
  // Past days are judged against Tashkent's date, matching the booking math.
  const todayYmd = tashkentTodayYmd();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const atCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth();

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const inRange = (ymd: string) =>
    range.start != null && range.end != null && ymd > range.start && ymd < range.end;

  return (
    <View style={cal.card}>
      <View style={cal.monthRow}>
        <Pressable
          disabled={atCurrentMonth}
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          style={({ pressed }) => pressed && press.dim}
        >
          <Chevron
            direction="left"
            size={24}
            color={atCurrentMonth ? t.gray[30] : t.colors.text}
          />
        </Pressable>
        <Text style={cal.month}>{`${tr.product.months[view.month]} ${view.year}`}</Text>
        <Pressable
          onPress={() => shiftMonth(1)}
          hitSlop={8}
          style={({ pressed }) => pressed && press.dim}
        >
          <Chevron direction="right" size={24} color={t.colors.text} />
        </Pressable>
      </View>
      <View style={cal.weekRow}>
        {tr.product.weekdays.map((d) => (
          <Text key={d} style={cal.weekday}>
            {d}
          </Text>
        ))}
      </View>
      <View style={cal.divider} />
      {monthRows(view.year, view.month).map((row, ri) => (
        <View key={ri} style={cal.daysRow}>
          {row.map((ymd, ci) => {
            if (ymd == null) return <View key={ci} style={cal.cell} />;
            const disabled = ymd < todayYmd || blocked.has(ymd);
            const complete = range.start != null && range.end != null;
            const isStart = ymd === range.start;
            const isEnd = ymd === range.end;
            const isEndpoint = isStart || isEnd;
            const isToday = ymd === todayYmd;
            return (
              <View key={ci} style={cal.cell}>
                {complete && (inRange(ymd) || isEndpoint) && (
                  <View
                    style={[cal.band, isStart && cal.bandStart, isEnd && cal.bandEnd]}
                  />
                )}
                <Pressable
                  disabled={disabled}
                  onPress={() => onSelect(ymd)}
                  style={({ pressed }) => [
                    cal.day,
                    isToday && !isEndpoint && cal.dayToday,
                    isEndpoint && cal.dayEndpoint,
                    pressed && cal.dayPressed,
                  ]}
                >
                  <Text
                    style={[
                      cal.dayText,
                      disabled && cal.dayTextDisabled,
                      isEndpoint && cal.dayTextEndpoint,
                    ]}
                  >
                    {Number(ymd.slice(8))}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const THUMB_WIDTH = 64;
const THUMB_GAP = spacing.md;

/** Fullscreen gallery: black backdrop, close button, swipeable image, thumbnail strip. */
function ImageViewer({
  images,
  visible,
  initialIndex,
  onClose,
}: {
  images: ImageSourcePropType[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const thumbsRef = useRef<ScrollView>(null);

  const goTo = (i: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ x: i * width, animated });
  };

  // Keep the active thumbnail visible (centered) in the strip.
  const revealThumb = (i: number) => {
    const x = i * (THUMB_WIDTH + THUMB_GAP) - (width - THUMB_WIDTH) / 2;
    thumbsRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
  };

  const onPageChanged = (i: number) => {
    if (i !== page) {
      setPage(i);
      revealThumb(i);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar style="light" />
      <View style={viewer.container}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={() => goTo(initialIndex, false)}
          onScroll={(e) => onPageChanged(Math.round(e.nativeEvent.contentOffset.x / width))}
          scrollEventThrottle={16}
          style={viewer.pager}
        >
          {images.map((image, i) => (
            <View key={i} style={[viewer.slide, { width }]}>
              <Image
                source={image}
                style={viewer.image}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
          ))}
        </ScrollView>

        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [
            viewer.closeButton,
            { top: insets.top + spacing.lg },
            pressed && press.dim,
          ]}
        >
          <CloseX size={20} color="#FFFFFF" />
        </Pressable>

        <View style={{ paddingBottom: insets.bottom + spacing.xl }}>
          <ScrollView
            ref={thumbsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={viewer.thumbs}
          >
            {images.map((image, i) => (
              <Pressable key={i} onPress={() => goTo(i, true)}>
                <Image
                  source={image}
                  style={[viewer.thumb, i === page ? viewer.thumbActive : viewer.thumbInactive]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ProductDetailScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { item, loading } = useItem(id);
  const { availability } = useItemAvailability(id);
  const [saved, setSaved] = useState(false);
  const [heroPage, setHeroPage] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [myIdSheetVisible, setMyIdSheetVisible] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);
  const { myIdVerified, refresh: refreshProfile } = useProfile();
  const { requireAuth, prompt: signInPrompt } = useSignInPrompt();
  const toast = useToast();
  const [descExpanded, setDescExpanded] = useState(false);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  const startIdVerification = async () => {
    setVerifyingId(true);
    try {
      const result = await verifyIdentity();
      if (result.status === 'success') {
        await refreshProfile();
        setMyIdSheetVisible(false);
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

  // Recorded only once the item resolves, so a stale link never enters the rail.
  useEffect(() => {
    if (item?.id) recordItemView(item.id);
  }, [item?.id]);

  // Native share sheet with the web marketplace link for this item.
  const shareItem = async () => {
    if (!item) return;
    const url = `https://rentzor.uz/item/${item.id}`;
    try {
      await Share.share(
        // iOS treats `url` as a first-class share payload; Android only
        // forwards `message`, so the link rides along in the text there.
        Platform.OS === 'ios' ? { message: item.title, url } : { message: `${item.title}\n${url}` },
        { dialogTitle: item.title },
      );
    } catch {
      // Share sheet dismissed or unavailable — nothing to do.
    }
  };
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('19:00');
  const [openPicker, setOpenPicker] = useState<'pickup' | 'return' | null>(null);
  // Calendar phase: false = next tap starts a fresh 1-day selection, true =
  // next (later) tap sets the end date. Mirrors the web BookingForm.
  const [selectingEnd, setSelectingEnd] = useState(false);

  // Tashkent-time tick — re-renders every 60s so lead-time cutoffs activate
  // without leaving the screen.
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const occupiedIntervals: WallInterval[] = availability.occupiedIntervals;
  const manualBlockYmds = availability.manualBlockYmds;

  const preferredTimes = React.useMemo(
    () => getPreferredTimes(item?.owner?.available_from_time ?? null, item?.owner?.available_to_time ?? null),
    [item?.owner?.available_from_time, item?.owner?.available_to_time],
  );

  // Wall-clock span (Tashkent local) driving price, min-span and conflict
  // checks. Never compared against Date.now() — see lib/bookingTime.ts.
  const startMs = range.start != null ? wallMs(range.start, pickupTime) : null;
  const endMs = range.end != null ? wallMs(range.end, returnTime) : null;
  const isSingleDay = range.start != null && range.start === range.end;

  // Lead time: pickup must be at least the owner's minimum notice from now.
  const requiredHours = Math.max(
    item?.owner?.min_prebook_notice_hours ?? 2,
    MIN_NOTICE_FLOOR_HOURS,
  );
  const computeLeadOk = (pickup: string) => {
    if (range.start == null) return true;
    const leadHours = (tashkentWallToUtcMs(range.start, pickup) - Date.now()) / 3_600_000;
    return leadHours >= requiredHours;
  };
  const leadOk = computeLeadOk(pickupTime);

  // A completed range must not span a fully blocked day. Deliberately uses the
  // real availability set, not blockedYmds: today can be unbookable only
  // because its last pickup slot has passed, which says nothing about the item
  // being occupied — a range running through today is still fine.
  const rangeHasBlockedDay = (start: string, end: string) => {
    for (const ymd of availability.fullyBlockedYmds) {
      if (ymd > start && ymd < end) return true;
    }
    return false;
  };

  // First tap books a single day (start === end) — an immediately valid
  // hourly booking. A second, later tap extends the range. Tapping the same
  // or an earlier day restarts a fresh single-day selection, as does a tap
  // that would make the range cross a fully blocked day.
  const selectDay = (ymd: string) => {
    if (!selectingEnd || range.start == null) {
      setRange({ start: ymd, end: ymd });
      setSelectingEnd(true);
      return;
    }
    if (ymd > range.start) {
      if (rangeHasBlockedDay(range.start, ymd)) {
        setRange({ start: ymd, end: ymd });
        setSelectingEnd(true);
        return;
      }
      setRange({ start: range.start, end: ymd });
      setSelectingEnd(false);
      return;
    }
    setRange({ start: ymd, end: ymd });
    setSelectingEnd(true);
  };

  // A pickup less than 12h out is only accepted by the server when the whole
  // booking auto-confirms, which needs BOTH times inside the owner's window.
  // Below that horizon the window becomes a hard constraint on the slots, so
  // the pickers only offer times that can actually be booked.
  const autoConfirmPossible = item?.owner?.auto_confirm_enabled === true && preferredTimes.length > 0;
  const leadHoursFor = (pickup: string) =>
    range.start == null
      ? Infinity
      : (tashkentWallToUtcMs(range.start, pickup) - Date.now()) / 3_600_000;

  // Is `slot` a usable return for a booking picked up at `pickup`? Shared by
  // the return dropdown and the pickup check below, so a pickup is never
  // offered when nothing could close the booking.
  const returnSlotWorks = (slot: string, pickup: string): boolean => {
    if (range.end == null) return true;
    const slotMs = wallMs(range.end, slot);
    if (isDropoffInstantBlocked(slotMs, occupiedIntervals)) return false;
    const pickMs = range.start != null ? wallMs(range.start, pickup) : null;
    if (pickMs != null && spanHours(pickMs, slotMs) < MIN_SPAN_HOURS) return false;
    // The whole pickup→return span must clear existing bookings too — a
    // pickup before a booking and a return after it are each fine as
    // instants, but the pair swallows the booking whole.
    if (pickMs != null && rangeConflicts(pickMs, slotMs, occupiedIntervals, manualBlockYmds)) {
      return false;
    }
    // Inside the 12h horizon the booking must auto-confirm, which needs the
    // return inside the owner's window too.
    if (leadHoursFor(pickup) < 12 && !(autoConfirmPossible && preferredTimes.includes(slot))) {
      return false;
    }
    return true;
  };

  // Pickup slots: outside other bookings' buffers, leaving room for the
  // minimum span on a same-day booking, and far enough from now.
  const isPickupSlotDisabled = (slot: string): boolean => {
    if (isSingleDay && parseInt(slot, 10) + MIN_SPAN_HOURS > 23) return true;
    if (range.start == null) return false;
    if (isPickupInstantBlocked(wallMs(range.start, slot), occupiedIntervals)) return true;
    if (!computeLeadOk(slot)) return true;
    // Inside the 12h horizon this slot is only bookable if it can auto-confirm.
    if (leadHoursFor(slot) < 12 && !(autoConfirmPossible && preferredTimes.includes(slot))) {
      return true;
    }
    // ...and only if some return can actually close the booking. Without this
    // a late in-window pickup stays selectable while every return is blocked.
    return !ALL_TIME_SLOTS.some((ret) => returnSlotWorks(ret, slot));
  };

  // Return slots: outside other bookings' buffers, >= pickup + min span, and
  // inside the owner's window when the 12h horizon applies.
  const isDropoffSlotDisabled = (slot: string): boolean => !returnSlotWorks(slot, pickupTime);

  // Auto-correct invalid time combos so the user never lands on one: move a
  // stale or otherwise unusable pickup to the first slot that works, cap
  // same-day pickups so the minimum span still fits before 23:00, then push
  // the return later when the span is too short or falls outside the window.
  // Declared after the slot predicates above so it can reuse them.
  useEffect(() => {
    if (range.start == null || range.end == null || startMs == null || endMs == null) return;

    // Latest pickup that still leaves room for the minimum span before the
    // last 23:00 return slot — only binding on a same-day booking.
    const latestSameDayPickup = 23 - MIN_SPAN_HOURS;

    // The 09:00 default (or a slot that aged out while the screen sat open) can
    // already be in the past, or blocked by a buffer/horizon rule. Move to the
    // first slot that clears every pickup rule — this subsumes the old
    // turnover-buffer snap, since isPickupSlotDisabled already tests it. If the
    // day has no usable slot, leave things alone and let noSlotWorksToday explain.
    if (isPickupSlotDisabled(pickupTime)) {
      const usable = ALL_TIME_SLOTS.find((slot) => !isPickupSlotDisabled(slot));
      if (usable && usable !== pickupTime) {
        setPickupTime(usable);
        return; // re-runs with the corrected pickup
      }
      if (!usable) return;
    }

    if (isSingleDay && parseInt(pickupTime, 10) > latestSameDayPickup) {
      setPickupTime(`${String(latestSameDayPickup).padStart(2, '0')}:00`);
      return;
    }

    // Return too early (or unusable): take the first slot that works for the
    // current pickup. Runs last and only settles on a slot passing every rule
    // above, so it cannot ping-pong with the corrections before it.
    if (isDropoffSlotDisabled(returnTime)) {
      const fix = ALL_TIME_SLOTS.find((slot) => returnSlotWorks(slot, pickupTime));
      if (fix && fix !== returnTime) setReturnTime(fix);
    }
  }, [
    range.start,
    range.end,
    startMs,
    endMs,
    isSingleDay,
    pickupTime,
    returnTime,
    occupiedIntervals,
    manualBlockYmds,
    preferredTimes,
    autoConfirmPossible,
  ]);

  // Authoritative check for the whole span — also catches a range that fully
  // spans an existing booking whose edge days look free.
  const hasConflict =
    startMs != null &&
    endMs != null &&
    rangeConflicts(startMs, endMs, occupiedIntervals, manualBlockYmds);

  // Billable days = 24h periods pickup->return, rounded up, min 1. Times fold
  // in, so an hourly same-day rental bills as exactly 1 day.
  const totalDays = startMs != null && endMs != null && endMs > startMs
    ? billableDays(startMs, endMs)
    : 0;

  // Will the server auto-confirm this booking? Mirrors the predicate in
  // enforce_booking_money (20260703120000_time_aware_billable_days.sql):
  // auto-confirm on AND both times inside the owner's available window.
  const autoConfirmEnabled = item?.owner?.auto_confirm_enabled === true;
  const willAutoConfirm =
    autoConfirmEnabled &&
    preferredTimes.length > 0 &&
    preferredTimes.includes(pickupTime) &&
    preferredTimes.includes(returnTime);

  // Same warning web shows: auto-confirm is on, but the chosen times fall
  // outside the owner's hours, so the booking needs manual confirmation.
  const needsConfirmation = autoConfirmEnabled && preferredTimes.length > 0 && !willAutoConfirm;

  // The server's 12-hour gate: a pickup 2–12h out is rejected outright unless
  // the booking will auto-confirm. Web only discovers this from the trigger
  // error; block it here so the renter can fix the times before paying.
  const leadHoursNow =
    range.start != null
      ? (tashkentWallToUtcMs(range.start, pickupTime) - Date.now()) / 3_600_000
      : Infinity;
  const blockedByInstantOnlyWindow = leadHoursNow < 12 && !willAutoConfirm;

  // Every pickup slot on the selected start day can be unusable at once — the
  // day is late and the 12h horizon rules out an owner who never auto-confirms,
  // or their window is closing and no in-window return leaves room for the
  // minimum span. Naming a specific rule would be a dead end, so this takes
  // priority over the lead-time and horizon messages and points at a later day.
  const noSlotWorksToday =
    range.start != null && ALL_TIME_SLOTS.every((slot) => isPickupSlotDisabled(slot));

  // A day can be unbookable for this renter even when some hourly slots look
  // free: today burns out as the clock passes the last workable pickup, and a
  // day around an existing booking can have no pickup/return pair that both
  // fits the minimum span and clears the booking (e.g. booked 09:00–19:00 →
  // the turnover buffer leaves only edge slots no same-day combo can use once
  // the 12h auto-confirm horizon rules out the early morning). Grey such days
  // out in the calendar — otherwise they look selectable and the renter only
  // learns they are dead after tapping. Candidates: today plus every day an
  // inflated occupied interval touches; a fully free day always has a
  // workable midday combo, so nothing else needs scanning.
  const todayYmd = tashkentTodayYmd();
  const unbookableYmds = useMemo(() => {
    const candidates = new Set<string>([todayYmd]);
    for (const iv of occupiedIntervals) {
      const infl = inflate(iv, TURNOVER_BUFFER_HOURS);
      for (let ms = infl.start - (infl.start % DAY_MS); ms <= infl.end; ms += DAY_MS) {
        candidates.add(new Date(ms).toISOString().slice(0, 10));
      }
    }
    const dead = new Set<string>();
    for (const ymd of candidates) {
      if (ymd < todayYmd) continue;
      const leadOf = (slot: string) =>
        (tashkentWallToUtcMs(ymd, slot) - Date.now()) / 3_600_000;
      const retOk = (ret: string, pick: string) => {
        const retMs = wallMs(ymd, ret);
        const pickMs = wallMs(ymd, pick);
        if (isDropoffInstantBlocked(retMs, occupiedIntervals)) return false;
        if (spanHours(pickMs, retMs) < MIN_SPAN_HOURS) return false;
        if (rangeConflicts(pickMs, retMs, occupiedIntervals, manualBlockYmds)) return false;
        return !(leadOf(pick) < 12 && !(autoConfirmPossible && preferredTimes.includes(ret)));
      };
      const allSlotsDead = ALL_TIME_SLOTS.every((slot) => {
        if (parseInt(slot, 10) + MIN_SPAN_HOURS > 23) return true;
        if (isPickupInstantBlocked(wallMs(ymd, slot), occupiedIntervals)) return true;
        if (leadOf(slot) < requiredHours) return true;
        if (leadOf(slot) < 12 && !(autoConfirmPossible && preferredTimes.includes(slot))) return true;
        return !ALL_TIME_SLOTS.some((ret) => retOk(ret, slot));
      });
      if (allSlotsDead) dead.add(ymd);
    }
    return dead;
    // nowTick drives the 60s refresh so days grey out as their last slot expires.
  }, [todayYmd, occupiedIntervals, manualBlockYmds, preferredTimes, autoConfirmPossible, requiredHours, nowTick]);

  const blockedYmds = useMemo(() => {
    if (unbookableYmds.size === 0) return availability.fullyBlockedYmds;
    const next = new Set(availability.fullyBlockedYmds);
    unbookableYmds.forEach((ymd) => next.add(ymd));
    return next;
  }, [availability.fullyBlockedYmds, unbookableYmds]);

  const canBook =
    range.start != null &&
    range.end != null &&
    totalDays > 0 &&
    !hasConflict &&
    leadOk &&
    !blockedByInstantOnlyWindow &&
    !noSlotWorksToday;

  if (loading || !item) {
    return (
      <View style={[styles.container, styles.centered]}>
        {loading ? (
          <ActivityIndicator size="large" color={t.colors.primary} />
        ) : (
          <Text style={styles.description}>{tr.common.notFound}</Text>
        )}
      </View>
    );
  }

  const heroImages: ImageSourcePropType[] = item.images.map((img) => ({ uri: img.image_url }));
  const description = item.description ?? '';
  const descNeedsToggle = description.length > DESCRIPTION_LIMIT;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View>
          {heroImages.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) =>
                setHeroPage(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              scrollEventThrottle={16}
            >
              {heroImages.map((image, i) => (
                <Pressable key={i} onPress={() => setViewerIndex(i)}>
                  <Image
                    source={image}
                    style={[styles.hero, { width }]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority={i === 0 ? 'high' : 'low'}
                    transition={150}
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder, { width, backgroundColor: t.colors.surface }]}>
              <AppIcon name="imagePlaceholder" color={t.gray[30]} size={72} />
            </View>
          )}
          {heroImages.length > 1 && (
            <View style={styles.heroDots}>
              {heroImages.map((_, i) => (
                <View key={i} style={[styles.heroDot, i === heroPage && styles.heroDotActive]} />
              ))}
            </View>
          )}
          <View style={[styles.heroBar, { top: insets.top + spacing.sm }]}>
            <Pressable
              style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]}
              onPress={() => router.back()}
            >
              <Chevron direction="left" size={24} color={t.colors.text} />
            </Pressable>
            <View style={styles.heroActions}>
              <Pressable
                style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]}
                onPress={shareItem}
              >
                <ProductIcon name="share" color={t.colors.text} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]}
                onPress={() => setSaved(!saved)}
              >
                <AppIcon
                  name={saved ? 'bookmarkFilled' : 'bookmark'}
                  color={saved ? t.colors.primary : t.colors.text}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          {/* Title block */}
          <View style={styles.block}>
            <View style={styles.rowBetween}>
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location ?? tr.product.nearRadius}
              </Text>
              {item.rating != null && (
                <View style={styles.scoreRow}>
                  <ProductIcon name="star" color={t.colors.warning} />
                  <Text style={styles.scoreText}>{item.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
          </View>

          {/* Description */}
          {description.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.product.descriptionTitle}</Text>
              <Text style={styles.description}>
                {descExpanded || !descNeedsToggle
                  ? `${description} `
                  : `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}... `}
                {descNeedsToggle && (
                  <Text style={styles.readMore} onPress={() => setDescExpanded(!descExpanded)}>
                    {descExpanded ? tr.common.readLess : tr.common.readMore}
                  </Text>
                )}
              </Text>
            </View>
          )}

          {/* Date picker */}
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>{tr.product.selectDate}</Text>
            <CalendarCard
              range={range}
              blocked={blockedYmds}
              onSelect={selectDay}
            />

            {range.start != null && range.end != null && (
              <>
                <View style={styles.timesCard}>
                  <TimeSelect
                    label={tr.product.pickupTime}
                    value={pickupTime}
                    open={openPicker === 'pickup'}
                    preferredTimes={preferredTimes}
                    willAutoConfirm={willAutoConfirm}
                    isSlotDisabled={isPickupSlotDisabled}
                    onToggle={() => setOpenPicker(openPicker === 'pickup' ? null : 'pickup')}
                    onSelect={(t) => {
                      setPickupTime(t);
                      setOpenPicker(null);
                    }}
                  />
                  <TimeSelect
                    label={tr.product.returnTime}
                    value={returnTime}
                    open={openPicker === 'return'}
                    preferredTimes={preferredTimes}
                    willAutoConfirm={willAutoConfirm}
                    isSlotDisabled={isDropoffSlotDisabled}
                    onToggle={() => setOpenPicker(openPicker === 'return' ? null : 'return')}
                    onSelect={(t) => {
                      setReturnTime(t);
                      setOpenPicker(null);
                    }}
                  />
                </View>

                {/* Duration summary: days are what's billed, hours explain why. */}
                <Text style={styles.durationNote}>
                  {tr.bookingDetail.daysFor(totalDays)}
                  {' · '}
                  {tr.product.hoursTotal(Math.round(spanHours(startMs!, endMs!)))}
                </Text>

                {isSingleDay && selectingEnd && (
                  <Text style={styles.durationHint}>{tr.product.tapAgainForEnd}</Text>
                )}

                <Text style={styles.durationHint}>{tr.product.sameDayGapNote(MIN_SPAN_HOURS)}</Text>

                {/* One message, most actionable first: if nothing on this day
                    can work, say that rather than naming a rule the renter
                    cannot satisfy by changing times. */}
                {noSlotWorksToday ? (
                  <Text style={styles.bookingError}>{tr.product.noSlotsToday}</Text>
                ) : !leadOk ? (
                  <Text style={styles.bookingError}>{tr.product.leadTimeError(requiredHours)}</Text>
                ) : blockedByInstantOnlyWindow ? (
                  <Text style={styles.bookingError}>{tr.product.instantOnlyWindow}</Text>
                ) : null}

                {!noSlotWorksToday && !blockedByInstantOnlyWindow && needsConfirmation && (
                  <Text style={styles.durationHint}>{tr.product.outsidePreferredHours}</Text>
                )}

                {hasConflict && (
                  <Text style={styles.bookingError}>{tr.product.unavailableDatesError}</Text>
                )}

                <Pressable
                  onPress={() => {
                    setRange({ start: null, end: null });
                    setSelectingEnd(false);
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [styles.clearDates, pressed && press.dim]}
                >
                  <Text style={styles.clearDatesText}>{tr.product.clearDates}</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Owner */}
          {item.owner && (
            <View style={styles.ownerCard}>
              <View style={styles.ownerHeader}>
                {item.owner.avatar_url ? (
                  <Image
                    source={{ uri: item.owner.avatar_url }}
                    style={styles.avatarCircle}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {(item.owner.full_name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerLabel}>{tr.bookingDetail.ownerLabel}</Text>
                  <Text style={styles.ownerName}>{item.owner.full_name ?? '—'}</Text>
                  <View style={styles.ownerStars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <ProductIcon
                        key={i}
                        name="star"
                        color={i < Math.round(item.owner?.rating ?? 0) ? t.colors.warning : t.gray[20]}
                      />
                    ))}
                    {item.owner.rating != null && (
                      <Text style={styles.ownerRatingValue}>{item.owner.rating.toFixed(1)}/5</Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.ownerDivider} />
              <View style={styles.ownerFacts}>
                <View style={styles.fact}>
                  <ProductIcon name={item.owner.verified ? 'idVerification' : 'idUnverified'} />
                  <Text style={styles.factText}>
                    {item.owner.verified ? tr.bookingDetail.myIdVerified : tr.bookingDetail.myIdNotVerified}
                  </Text>
                </View>
                {item.owner.created_at != null && (
                  <View style={styles.fact}>
                    <ProductIcon name="responseTime" />
                    <Text style={styles.factText}>
                      {tr.bookingDetail.onPlatformSince(
                        new Date(item.owner.created_at).getMonth(),
                        new Date(item.owner.created_at).getFullYear(),
                      )}
                    </Text>
                  </View>
                )}
                <View style={styles.fact}>
                  <ProductIcon name="responseRate" />
                  <Text style={styles.factText}>{tr.bookingDetail.responseRate}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Location */}
          {item.latitude != null && item.longitude != null && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.bookingDetail.addressTitle}</Text>
              <View style={styles.mapWrap}>
                <PickupZoneMap
                  latitude={item.latitude}
                  longitude={item.longitude}
                  style={styles.map}
                />
                <Pressable
                  onPress={() => setMapExpanded(true)}
                  style={({ pressed }) => [styles.mapExpand, pressed && { backgroundColor: t.gray[20] }]}
                >
                  <ProductIcon name="expandMap" />
                </Pressable>
              </View>
              <Text style={styles.addressText}>{tr.bookingDetail.approxPickup}</Text>
            </View>
          )}

          {/* Cost */}
          <View style={styles.costCard}>
            <Text style={styles.costLabel}>{tr.product.itemValue}</Text>
            <Text style={styles.costValue}>{formatSum(item.equipment_value)}</Text>
          </View>

          {/* Reviews */}
          {item.review_count > 0 && (
            <View style={styles.block}>
              <View style={styles.rowBetween}>
                <View style={styles.scoreRow}>
                  <ProductIcon name="star" color={t.colors.warning} size={24} />
                  <Text style={styles.reviewsScore}>{item.rating?.toFixed(1)}</Text>
                  <Text style={styles.reviewsCount}>
                    {tr.bookingDetail.reviewsCount(item.review_count)}
                  </Text>
                </View>
                <Button
                  title={tr.common.all}
                  variant="ghostBlue"
                  size="medium"
                  onPress={() => router.push(`/product/${id}/reviews`)}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewsRail}
              >
                {item.reviews.slice(0, 5).map((r) => (
                  <View key={r.id} style={[styles.reviewCard, { width: width - 58 }]}>
                    <View style={styles.rowBetween}>
                      <View style={styles.reviewAuthorRow}>
                        {r.reviewer?.avatar_url ? (
                          <Image
                            source={{ uri: r.reviewer.avatar_url }}
                            style={styles.reviewAvatar}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
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

          {/* Similar products */}
          {item.similar.length > 0 && (
            <View style={styles.block}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>{tr.product.similar}</Text>
                <Chevron direction="right" size={24} color={t.colors.text} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarRail}
              >
                {item.similar.map((p) => (
                  <ProductCard
                    key={p.id}
                    width={140}
                    image={p.primary_image ? { uri: p.primary_image } : undefined}
                    title={p.title}
                    location={p.location ?? ''}
                    price={formatDailyPrice(p.price_per_day)}
                    onPress={() => router.push(`/product/${p.id}`)}
                    onToggleSaved={() => {}}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Price action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View>
          <Text style={styles.price}>{formatSum(item.price_per_day)}</Text>
          <Text style={styles.priceDuration}>{tr.product.perDay}</Text>
        </View>
        <Button
          title={tr.product.book}
          disabled={!canBook}
          onPress={() => requireAuth(() => {
            if (!canBook || !range.start || !range.end) return;
            if (!myIdVerified) {
              setMyIdSheetVisible(true);
              return;
            }
            router.push({
              pathname: '/booking/payment',
              params: {
                itemId: item.id,
                ownerId: item.owner_id ?? '',
                title: item.title,
                image: item.images[0]?.image_url ?? '',
                startDate: range.start,
                endDate: range.end,
                pickupTime,
                dropoffTime: returnTime,
                pricePerDay: String(item.price_per_day),
                willAutoConfirm: willAutoConfirm ? '1' : '0',
              },
            });
          })}
        />
      </View>

      {/* Figma: My ID drawer (293:11841) — booking requires MyID verification. */}
      <BottomSheet
        visible={myIdSheetVisible}
        onClose={() => setMyIdSheetVisible(false)}
        title={tr.product.myIdSheetTitle}
        footer={
          <ActionBar>
            <Button
              title={tr.product.myIdVerify}
              loading={verifyingId}
              onPress={startIdVerification}
            />
          </ActionBar>
        }
      >
        <View style={styles.myIdSheetBody}>
          <View style={styles.myIdLogoTile}>
            <MyIdLogo width={63} />
          </View>
          <Text style={styles.myIdSheetText}>{tr.product.myIdSheetBody}</Text>
        </View>
      </BottomSheet>

      {viewerIndex != null && heroImages.length > 0 && (
        <ImageViewer
          visible
          images={heroImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {mapExpanded && item.latitude != null && item.longitude != null && (
        <Modal
          visible
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setMapExpanded(false)}
        >
          <View style={styles.mapModal}>
            <PickupZoneMap
              latitude={item.latitude}
              longitude={item.longitude}
              interactive
              style={styles.mapModalMap}
            />
            <Pressable
              onPress={() => setMapExpanded(false)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.mapModalClose,
                { top: insets.top + spacing.lg },
                pressed && { backgroundColor: t.gray[20] },
              ]}
            >
              <CloseX size={20} color={t.colors.text} />
            </Pressable>
          </View>
        </Modal>
      )}

      {signInPrompt}
    </View>
  );
}

const viewer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pager: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: spacing.screenX,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbs: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: THUMB_GAP,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenX,
  },
  thumb: {
    width: THUMB_WIDTH,
    height: 52,
    borderRadius: radius.sm,
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  thumbInactive: { opacity: 0.45 },
});

const makeCalStyles = (t: Theme) =>
  StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
  },
  daysRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: t.colors.surface,
  },
  bandStart: { left: '50%' },
  bandEnd: { right: '50%' },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: t.colors.primary,
  },
  dayEndpoint: {
    backgroundColor: t.colors.primary,
  },
  dayPressed: { backgroundColor: t.colors.surfaceActive },
  dayTextEndpoint: { color: t.colors.textInverse },
  dayText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  dayTextDisabled: {
    color: t.gray[30],
    textDecorationLine: 'line-through',
  },
});

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: spacing.sm },
  hero: { height: 440 },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDots: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heroDotActive: {
    width: 24,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  heroBar: {
    position: 'absolute',
    left: spacing.screenX,
    right: spacing.screenX,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroActions: { flexDirection: 'row', gap: spacing.lg },
  heroButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonPressed: { backgroundColor: 'rgba(255,255,255,0.9)' },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: t.colors.background,
    padding: spacing.screenX,
    gap: spacing.xxl,
  },
  block: { gap: spacing.md },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
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
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
    color: t.colors.text,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.colors.primary,
  },
  tagText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    color: t.gray[70],
  },
  readMore: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
  timesCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  timeField: { gap: spacing.sm },
  timeLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  timeDropdown: {
    position: 'absolute',
    borderRadius: radius.lg,
    backgroundColor: t.colors.background,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
  },
  timeValue: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  timeValueDisabled: {
    color: t.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  timeAuto: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: t.colors.success,
  },
  durationNote: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  durationHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: t.colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  bookingError: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: t.colors.critical,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  clearDates: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  clearDatesText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
  ownerCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  ownerHeader: { flexDirection: 'row', gap: spacing.md },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: t.colors.textMuted,
  },
  ownerInfo: { flex: 1, gap: 4 },
  ownerLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  ownerName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  ownerStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerRatingValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
  ownerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
  },
  ownerFacts: { gap: 14 },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  factText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  mapWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  map: { width: '100%', height: 280 },
  mapModal: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  mapModalMap: { flex: 1 },
  mapModalClose: {
    position: 'absolute',
    right: spacing.screenX,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  mapExpand: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  costCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.xl,
    gap: 4,
  },
  costLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  costValue: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
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
  similarRail: { gap: spacing.lg },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.xl,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  priceDuration: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  myIdSheetBody: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  myIdLogoTile: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: t.violet[0],
  },
  myIdSheetText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: t.colors.text,
  },
});
