/**
 * Figma: Booking flow (payment) / Booking view — hero image carousel with
 * back/menu buttons, booking summary rows (dates, times, price), booking
 * history timeline ("Band qilish tarixi"), owner card, and location map.
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { ActionBar, Button, PageScrollView, ReviewSheet } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DisputeDialog } from '../../components/DisputeDialog';
import {
  BanIcon,
  BanknoteIcon,
  CalendarIcon,
  Check,
  Chevron,
  ClockIcon,
  CloseX,
  FileDownIcon,
  KebabIcon,
  PhoneIcon,
  WarningTriangleIcon,
} from '../../components/icons';
import { PickupZoneMap } from '../../components/PickupZoneMap';
import { ProductIcon } from '../../components/ProductIcon';
import { useToast } from '../../components/Toast';
import { formatUZS } from '../../context/BalanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useBookingDetail } from '../../hooks/useBookingDetail';
import { cancelBooking } from '../../hooks/useBookings';
import { supabase } from '../../integrations/supabase/client';
import { CANCELLABLE_STATUSES, DISPUTABLE_STATUSES, displayStatus } from '../../lib/bookingStatus';
import { formatPhoneNumber, groupDigits } from '../../lib/format';
import { relativeTime } from '../../lib/relativeTime';
import { yamap } from '../../lib/yamap';
import { fonts, press, radius, spacing, Theme } from '../../theme';

export default function BookingDetailScreen() {
  const t = useTheme();
  const { language, t: tr } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { booking, loading, error, refresh } = useBookingDetail(id);
  const [heroPage, setHeroPage] = useState(0);

  const kebabRef = useRef<View>(null);
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [returnVisible, setReturnVisible] = useState(false);
  const [returning, setReturning] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [disputeVisible, setDisputeVisible] = useState(false);

  // Re-fetch when coming back from pickup-photos (status/photos changed).
  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const openMenu = () => {
    kebabRef.current?.measureInWindow((x, y, w, h) => {
      // Below the kebab, right edge ending just left of it (per the design).
      setMenu({ top: y + h + spacing.xs, right: width - x + spacing.xs });
    });
  };

  if (loading || !booking) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        {loading ? (
          <ActivityIndicator color={t.colors.primary} />
        ) : (
          <>
            <Text style={styles.loadErrorText}>{error ?? tr.bookings.loadError}</Text>
            <Button title={tr.common.back} variant="secondary" onPress={() => router.back()} />
          </>
        )}
      </View>
    );
  }

  const status = displayStatus(booking.status, booking.dispute_status);
  // Owner contact, exact address and condition photos unlock once the owner
  // has confirmed — same information gating as web's booking details page.
  const confirmed = booking.confirmed_at != null;
  const cancellable = booking.status !== null && CANCELLABLE_STATUSES.has(booking.status);
  // renter_open_dispute only accepts these statuses — hide the action once a
  // dispute can no longer be opened (e.g. already disputed or completed).
  const disputable = booking.status !== null && DISPUTABLE_STATUSES.has(booking.status);
  const ownerPhone = booking.owner?.phone ?? null;
  // The return flow flips the status BEFORE the review sheet opens, so a
  // reload can strand the booking past that step unreviewed — offer the
  // review again until it's written.
  const needsReview =
    !booking.hasMyReview &&
    (booking.status === 'returning' ||
      booking.status === 'pending_owner_confirmation' ||
      booking.status === 'completed');

  // Rendered either inside a native <Marker> (anchored to the real
  // coordinate, stays put while panning/zooming) or, when MapKit isn't
  // available, inside a screen-space overlay over the static fallback image.
  const pickupPin = (
    <View style={styles.mapPinContent} pointerEvents="none">
      <View style={styles.mapPinChip}>
        <Text style={styles.mapPinChipText}>{tr.bookingDetail.pickupPoint}</Text>
      </View>
      <Svg width={36} height={44} viewBox="0 0 36 44" fill="none">
        <Path
          d="M18 2C9.7 2 3 8.7 3 17C3 27.5 18 42 18 42C18 42 33 27.5 33 17C33 8.7 26.3 2 18 2Z"
          fill={t.colors.critical}
        />
        <Circle cx={18} cy={17} r={6} fill="#FFFFFF" />
      </Svg>
    </View>
  );
  // Anchors the pin's SVG tip (bottom-center of the 36x44 art) to the marker's
  // coordinate, instead of the marker's own center.
  const pinAnchor = { x: 0.5, y: 42 / 44 };

  /** "2026-05-08" -> "8 May" */
  const day = (ymd: string) => {
    const d = new Date(ymd);
    return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${tr.product.months[d.getMonth()]}`;
  };
  /** ISO timestamp -> "7 may, 2026, 16:22" (timeline rows). */
  const timelineDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()}, ${d.getFullYear()}, ${hhmm}`;
  };
  const hhmm = (time: string | null, fallback: string) => (time ? time.slice(0, 5) : fallback);

  const datesLabel = `${day(booking.start_date)} - ${day(booking.end_date)}, ${new Date(booking.end_date).getFullYear()}`;
  const timesLabel = `${hhmm(booking.pickup_time, '09:00')} - ${hhmm(booking.dropoff_time, '19:00')}`;

  // Newest first; 'done' renders the green check dot on superseded steps,
  // 'danger' the red X dot on terminal cancelled/rejected events. Cancelled
  // and rejected have no timestamp column, so those rows are undated (the
  // rejected row shows the owner's reason instead, when present).
  const pickedUp = booking.actual_pickup_date != null;
  const ended =
    booking.status === 'completed' ||
    booking.status === 'cancelled' ||
    booking.status === 'rejected';
  const history: { label: string; date: string; done: boolean; danger?: boolean }[] = [
    ...(booking.status === 'completed'
      ? [{
          label: tr.bookingDetail.completed,
          date: booking.actual_return_date ? timelineDate(booking.actual_return_date) : '',
          done: true,
        }]
      : []),
    ...(booking.status === 'cancelled'
      ? [{ label: tr.bookingDetail.cancelled, date: '', done: false, danger: true }]
      : []),
    ...(booking.status === 'rejected'
      ? [{
          label: tr.bookingDetail.rejected,
          date: booking.rejection_reason ?? '',
          done: false,
          danger: true,
        }]
      : []),
    ...(booking.actual_pickup_date
      ? [{ label: tr.bookingDetail.pickedUp, date: timelineDate(booking.actual_pickup_date), done: ended }]
      : []),
    ...(booking.confirmed_at
      ? [{ label: tr.bookingDetail.confirmed, date: timelineDate(booking.confirmed_at), done: pickedUp || ended }]
      : []),
    ...(booking.created_at
      ? [{ label: tr.bookingDetail.booked, date: timelineDate(booking.created_at), done: confirmed || ended }]
      : []),
  ];

  const heroImages = booking.images;
  const conditionPhotos = booking.condition_images;
  const pickupPhotos = booking.pickup_photos ?? [];
  const returnPhotos = booking.return_photos ?? [];
  const ownerStars = Math.round(booking.owner?.rating ?? 0);
  const ownerSince = booking.owner?.created_at ? new Date(booking.owner.created_at) : null;

  return (
    <View style={styles.container}>
      <PageScrollView contentContainerStyle={styles.scroll}>
        {/* Hero carousel */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setHeroPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}
          >
            {heroImages.length > 0 ? (
              heroImages.map((uri, i) => (
                <Image key={i} source={{ uri }} style={[styles.hero, { width }]} resizeMode="cover" />
              ))
            ) : (
              <View style={[styles.hero, { width, backgroundColor: t.colors.surface }]} />
            )}
          </ScrollView>
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
            <Pressable
              ref={kebabRef}
              onPress={openMenu}
              style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]}
            >
              <KebabIcon color={menu != null ? t.colors.primary : t.colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sheet}>
          {/* Summary */}
          <View style={styles.block}>
            <Text style={styles.title}>{booking.item?.title ?? '—'}</Text>
            <View style={styles.infoRow}>
              <CalendarIcon size={18} />
              <Text style={styles.infoText}>{datesLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <ClockIcon size={18} />
              <Text style={styles.infoText}>{timesLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <BanknoteIcon size={18} />
              <Text style={styles.infoPrice}>{formatUZS(booking.total_cost ?? 0)}</Text>
            </View>
          </View>

          {/* Booking history */}
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>{tr.bookingDetail.historyTitle}</Text>
            {history.map((event) => (
              <View key={event.label} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDash} />
                  <View
                    style={[
                      styles.timelineDot,
                      event.done && styles.timelineDotDone,
                      event.danger && styles.timelineDotDanger,
                    ]}
                  >
                    {event.danger ? (
                      <CloseX size={10} color="#FFFFFF" />
                    ) : event.done ? (
                      <Check size={10} />
                    ) : (
                      <View style={styles.timelineDotInner} />
                    )}
                  </View>
                </View>
                <View style={styles.timelineTexts}>
                  <Text style={styles.timelineLabel}>{event.label}</Text>
                  {!!event.date && <Text style={styles.timelineDate}>{event.date}</Text>}
                </View>
              </View>
            ))}
          </View>

          {needsReview && (
            <Button
              title={tr.bookingDetail.rateAction}
              variant="secondary"
              onPress={() => setReviewVisible(true)}
            />
          )}

          {/* Condition photos — uploaded by the owner when listing the item. */}
          {conditionPhotos.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.bookingDetail.conditionTitle}</Text>
              <Text style={styles.photosSubtitle}>{tr.bookingDetail.conditionSubtitle}</Text>
              <View style={styles.photoGrid}>
                {conditionPhotos.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[
                      styles.photoTile,
                      { width: (width - spacing.screenX * 2 - spacing.sm * 3) / 4 },
                    ]}
                    resizeMode="cover"
                  />
                ))}
              </View>
              {/* Compare reminder only matters until the pickup happened. */}
              {!pickedUp && (
                <View style={styles.photosWarning}>
                  <AppIcon name="dangerTriangle" color={t.orange[50]} />
                  <Text style={styles.photosWarningText}>
                    {tr.bookingDetail.compareWarning}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Pickup photos — uploaded by the renter when taking the item. */}
          {pickupPhotos.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.bookingDetail.pickupTitle}</Text>
              <Text style={styles.photosSubtitle}>{tr.bookingDetail.pickupSubtitle}</Text>
              <View style={styles.photoGrid}>
                {pickupPhotos.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[
                      styles.photoTile,
                      { width: (width - spacing.screenX * 2 - spacing.sm * 3) / 4 },
                    ]}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          )}

          {/* Return photos — uploaded by the renter when handing the item back. */}
          {returnPhotos.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.bookingDetail.returnTitle}</Text>
              <Text style={styles.photosSubtitle}>{tr.bookingDetail.returnSubtitle}</Text>
              <View style={styles.photoGrid}>
                {returnPhotos.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[
                      styles.photoTile,
                      { width: (width - spacing.screenX * 2 - spacing.sm * 3) / 4 },
                    ]}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          )}

          {/* Owner */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerHeader}>
              {booking.owner?.avatar_url ? (
                <Image source={{ uri: booking.owner.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(booking.owner?.full_name ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerLabel}>{tr.bookingDetail.ownerLabel}</Text>
                <Text style={styles.ownerName}>{booking.owner?.full_name ?? '—'}</Text>
                <View style={styles.ownerStars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <ProductIcon
                      key={i}
                      name="star"
                      color={i < ownerStars ? t.colors.warning : t.gray[20]}
                    />
                  ))}
                  <Text style={styles.ownerRatingValue}>{ownerStars}/5</Text>
                </View>
              </View>
            </View>
            <View style={styles.ownerDivider} />
            <View style={styles.ownerFacts}>
              {confirmed && ownerPhone && (
                <View style={styles.fact}>
                  <PhoneIcon size={24} color={t.colors.primary} />
                  <Text style={styles.factText}>{formatPhoneNumber(ownerPhone)}</Text>
                </View>
              )}
              <View style={styles.fact}>
                <ProductIcon name="idVerification" />
                <Text style={styles.factText}>
                  {booking.owner?.verified
                    ? tr.bookingDetail.myIdVerified
                    : tr.bookingDetail.myIdNotVerified}
                </Text>
              </View>
              {ownerSince && (
                <View style={styles.fact}>
                  <ProductIcon name="responseTime" />
                  <Text style={styles.factText}>
                    {tr.bookingDetail.onPlatformSince(ownerSince.getMonth(), ownerSince.getFullYear())}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location — approximate 1km zone until confirmed, exact pin after. */}
          {booking.item?.latitude != null && booking.item?.longitude != null && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.bookingDetail.addressTitle}</Text>
              <View style={styles.mapWrap}>
                <PickupZoneMap
                  latitude={booking.item.latitude}
                  longitude={booking.item.longitude}
                  showExactLocation={confirmed}
                  style={styles.map}
                >
                  {confirmed && yamap && (
                    <yamap.Marker point={{ lat: booking.item.latitude, lon: booking.item.longitude }} anchor={pinAnchor}>
                      {pickupPin}
                    </yamap.Marker>
                  )}
                </PickupZoneMap>
                {confirmed && !yamap && (
                  <View style={styles.mapPinWrap} pointerEvents="none">
                    {pickupPin}
                  </View>
                )}
                <Pressable
                  onPress={() => setMapExpanded(true)}
                  style={({ pressed }) => [styles.mapExpand, pressed && { backgroundColor: t.gray[20] }]}
                >
                  <ProductIcon name="expandMap" />
                </Pressable>
              </View>
              <Text style={styles.addressText}>
                {confirmed && booking.item.location
                  ? booking.item.location
                  : tr.bookingDetail.approxPickup}
              </Text>
            </View>
          )}

          {mapExpanded && booking.item?.latitude != null && booking.item?.longitude != null && (
            <Modal
              visible
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setMapExpanded(false)}
            >
              <View style={styles.mapModal}>
                <PickupZoneMap
                  latitude={booking.item.latitude}
                  longitude={booking.item.longitude}
                  showExactLocation={confirmed}
                  interactive
                  style={styles.mapModalMap}
                >
                  {confirmed && yamap && (
                    <yamap.Marker point={{ lat: booking.item.latitude, lon: booking.item.longitude }} anchor={pinAnchor}>
                      {pickupPin}
                    </yamap.Marker>
                  )}
                </PickupZoneMap>
                {confirmed && !yamap && (
                  <View style={styles.mapPinWrap} pointerEvents="none">
                    {pickupPin}
                  </View>
                )}
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

          {/* Description */}
          {!!booking.item?.description && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>{tr.bookingDetail.descriptionTitle}</Text>
              <Text style={styles.description}>{booking.item.description}</Text>
            </View>
          )}

          {/* Price breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.priceCardTitle}>{tr.bookingDetail.priceBreakdown}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{tr.bookingDetail.daysFor(booking.total_days ?? 0)}</Text>
              <Text style={styles.priceValue}>{formatUZS(booking.rental_cost ?? 0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{tr.bookingDetail.serviceFee}</Text>
              <Text style={styles.priceValue}>{formatUZS(booking.service_fee ?? 0)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>{tr.bookingDetail.total}</Text>
              <Text style={styles.totalValue}>{formatUZS(booking.total_cost ?? 0)}</Text>
            </View>
          </View>

          {/* Reviews */}
          {booking.reviews.length > 0 && (
            <View style={styles.block}>
              <View style={styles.rowBetween}>
                <View style={styles.scoreRow}>
                  <ProductIcon name="star" color={t.colors.warning} size={24} />
                  <Text style={styles.reviewsScore}>{(booking.rating ?? 0).toFixed(1)}</Text>
                  <Text style={styles.reviewsCount}>
                    {tr.bookingDetail.reviewsCount(booking.reviews.length)}
                  </Text>
                </View>
                <Button
                  title={tr.common.all}
                  variant="ghostBlue"
                  size="medium"
                  onPress={() => booking.item_id && router.push(`/product/${booking.item_id}/reviews`)}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewsRail}
              >
                {booking.reviews.map((r) => (
                  <View key={r.id} style={[styles.reviewCard, { width: width - 58 }]}>
                    <View style={styles.rowBetween}>
                      <View style={styles.reviewAuthorRow}>
                        {r.reviewer?.avatar_url ? (
                          <Image source={{ uri: r.reviewer.avatar_url }} style={styles.reviewAvatar} />
                        ) : (
                          <View style={[styles.reviewAvatar, { backgroundColor: t.colors.surface }]} />
                        )}
                        <View style={styles.reviewAuthorTexts}>
                          <Text style={styles.reviewAuthor} numberOfLines={1}>
                            {r.reviewer?.full_name ?? '—'}
                          </Text>
                          <Text style={styles.reviewDate}>{relativeTime(r.created_at, language)}</Text>
                        </View>
                      </View>
                      <View style={styles.scoreRow}>
                        <ProductIcon name="star" color={t.colors.warning} />
                        <Text style={styles.scoreText}>{(r.rating ?? 0).toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewText} numberOfLines={3}>
                      {r.comment ?? ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </PageScrollView>

      {/* Confirmed bookings can call the owner or start the pickup;
          in-progress ones can call or start the return; returning ones
          confirm the physical handover through the return-photos screen
          (photos + confirm → pending_owner_confirmation, the owner then
          verifies and completes — the DB RPC only allows this from
          `returning`, not `overdue`). */}
      {(status === 'confirmed' || status === 'in_progress' || status === 'returning') && (
        <ActionBar
          style={{ paddingBottom: insets.bottom + spacing.lg }}
        >
          {ownerPhone != null && (
            <Button
              title={tr.bookingDetail.call}
              variant="secondary"
              onPress={() => Linking.openURL(`tel:${ownerPhone.replace(/\s/g, '')}`)}
            />
          )}
          {status === 'confirmed' && (
            <Button
              title={tr.bookingDetail.pickupAction}
              onPress={() =>
                router.push({
                  pathname: '/booking/pickup-photos',
                  params: { bookingId: booking.id },
                })
              }
            />
          )}
          {status === 'in_progress' && (
            <Button
              title={tr.bookingDetail.returnAction}
              loading={returning}
              onPress={() => setReturnVisible(true)}
            />
          )}
          {status === 'returning' && (
            <Button
              title={tr.bookingDetail.handoverAction}
              onPress={() =>
                router.push({
                  pathname: '/booking/pickup-photos',
                  params: { bookingId: booking.id, subtype: 'return' },
                })
              }
            />
          )}
        </ActionBar>
      )}

      {/* Kebab menu */}
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
                    // Showing a Modal while another is still dismissing gets
                    // silently dropped on Android — wait for the menu to close.
                    setTimeout(() => setCancelVisible(true), 300);
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
                    // Showing a Modal while another is still dismissing gets
                    // silently dropped on Android — wait for the menu to close.
                    setTimeout(() => setDisputeVisible(true), 300);
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

      {/* Return confirmation — in_progress -> returning (mirrors web's
          "Start Return"), then the rate-the-rental sheet. */}
      <ConfirmDialog
        visible={returnVisible}
        title={tr.bookingDetail.returnAction}
        message={tr.bookingDetail.returnConfirmMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={tr.bookingDetail.yesReturn}
        confirmVariant="primary"
        onCancel={() => setReturnVisible(false)}
        onConfirm={async () => {
          if (returning) return;
          setReturnVisible(false);
          setReturning(true);
          const { error: returnError } = await supabase.rpc('renter_update_booking_status', {
            p_booking_id: booking.id,
            p_new_status: 'returning',
          });
          setReturning(false);
          if (returnError) {
            console.error('[booking] start return failed:', returnError);
            toast.error(tr.bookingDetail.returnFailed);
            return;
          }
          refresh();
          setReviewVisible(true);
        }}
      />

      {/* Rate-the-rental sheet, shown right after the return starts. */}
      <ReviewSheet
        visible={reviewVisible}
        bookingId={booking.id}
        itemId={booking.item_id}
        ownerId={booking.owner_id}
        onClose={() => setReviewVisible(false)}
        onSubmitted={refresh}
      />

      {/* Cancel confirmation — renter_cancel_booking RPC. Free while pending;
          after the owner confirmed, 50% of the rental cost is withheld and
          only the other half is refunded (per the Figma warning modal). */}
      <ConfirmDialog
        visible={cancelVisible}
        title={tr.bookingDetail.cancelTitle}
        icon={confirmed ? <WarningTriangleIcon /> : undefined}
        message={
          confirmed
            ? tr.bookingDetail.cancelPenaltyMessage(
                groupDigits(Math.floor((booking.rental_cost ?? 0) * 0.5)),
              )
            : tr.bookingDetail.cancelSimpleMessage
        }
        cancelLabel={tr.common.back}
        confirmLabel={tr.bookingDetail.yesCancel}
        onCancel={() => setCancelVisible(false)}
        onConfirm={async () => {
          if (cancelling) return;
          setCancelVisible(false);
          setCancelling(true);
          const { error: cancelError } = await cancelBooking(booking.id);
          setCancelling(false);
          if (cancelError) {
            console.error('[booking] cancel failed:', cancelError);
            toast.error(tr.bookings.cancelFailed);
            return;
          }
          refresh();
        }}
      />

      {/* Report an issue — renter_open_dispute RPC. Puts the booking on hold
          ("disputed") for admin review; false claims risk a fine per the
          acknowledgement checkbox. */}
      <DisputeDialog
        visible={disputeVisible}
        bookingId={booking.id}
        onClose={() => setDisputeVisible(false)}
        onSubmitted={refresh}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.screenX,
  },
  loadErrorText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.textSecondary,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  hero: { height: 440 },
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
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonPressed: { backgroundColor: t.gray[20] },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: t.colors.background,
    padding: spacing.screenX,
    gap: spacing.xxl,
  },
  block: { gap: spacing.md },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    lineHeight: 32,
    color: t.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  infoPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  historyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.xl,
    gap: spacing.md,
  },
  historyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  timelineRail: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  timelineDash: {
    height: 24,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: t.colors.primary,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: t.colors.success },
  timelineDotDanger: { backgroundColor: t.colors.critical },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  photosSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoTile: {
    height: 72,
    borderRadius: radius.sm,
  },
  photosWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: t.orange[0],
  },
  photosWarningText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: t.orange[70],
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  mapPinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mapPinContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapPinChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: t.colors.background,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  mapPinChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.text,
  },
  timelineTexts: {
    gap: 2,
  },
  timelineLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  timelineDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
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
  ownerInfo: { gap: 4 },
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
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  mapWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  map: { width: '100%', height: 280 },
  mapRadius: {
    position: 'absolute',
    top: 67,
    alignSelf: 'center',
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: 'rgba(140,98,255,0.2)',
    borderWidth: 1,
    borderColor: t.violet[60],
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
  addressText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    color: t.gray[70],
  },
  priceCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  priceCardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
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
  priceDivider: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // Shrink (ellipsize the name) instead of pushing the score off-card.
    flex: 1,
  },
  reviewAuthorTexts: { flex: 1 },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  readMore: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
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
