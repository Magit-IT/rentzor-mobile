/**
 * Figma: Settings / Shikoyat detail (293:11378 flow) — dispute ID as the
 * header title, product summary card (photo, name, dates • duration, price,
 * status badge), "Shikoyat tarixi" timeline card (dashed line + orange dot),
 * "Shikoyat sababi" card, and a bottom "Ishonch telefon raqami" button.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { Button } from '../../../components/Button';
import { Check, Chevron } from '../../../components/icons';
import { formatUZS } from '../../../context/BalanceContext';
import { useT } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { disputeCode, useDispute } from '../../../hooks/useDisputes';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

// Same support line the web app's DisputesTab shows.
const HOTLINE = '+998910884404';

const PHONE_ICON = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.05 3.15C4.6 2.6 5.5 2.55 6.05 3.1L7.75 4.8C8.3 5.35 8.35 6.2 7.85 6.8L7.15 7.65C6.95 7.9 6.9 8.25 7.05 8.55C7.9 10.15 9.85 12.1 11.45 12.95C11.75 13.1 12.1 13.05 12.35 12.85L13.2 12.15C13.8 11.65 14.65 11.7 15.2 12.25L16.9 13.95C17.45 14.5 17.4 15.4 16.85 15.95L15.95 16.85C15.35 17.45 14.45 17.65 13.65 17.35C10.95 16.3 8.4 14.45 6.35 12.4C4.3 10.35 2.7 8.05 1.65 5.35C1.35 4.55 2.55 4.65 3.15 4.05L4.05 3.15Z" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const makeToneColors = (t: Theme) =>
  ({ success: t.colors.success, open: t.orange[50] }) as const;

export default function ComplaintDetailScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { dispute, loading } = useDispute(id);

  const resolved = dispute !== null && dispute.dispute_status !== 'open';

  /** "2026-05-07T14:44:00Z" -> "7 may, 2026, 14:44" */
  const formatDateTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()}, ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /** "2026-05-08" -> "8 May" */
  const day = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${tr.product.months[d.getMonth()]}`;
  };

  // Newest-first; the resolved entry has no timestamp of its own in the schema.
  const history: { label: string; date: string; tone: 'success' | 'open' }[] = dispute
    ? [
        ...(resolved
          ? [{
              label: tr.complaints.statuses[dispute.dispute_status] ?? tr.complaints.statusOpen,
              date: '',
              tone: 'success' as const,
            }]
          : []),
        { label: tr.complaints.statusOpen, date: formatDateTime(dispute.disputed_at), tone: 'open' as const },
      ]
    : [];

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
          <Text style={styles.headerTitle}>{id ? disputeCode(id) : ''}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : !dispute ? (
          <Text style={styles.notFound}>{tr.complaints.loadError}</Text>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.productRow}>
                {dispute.item_image ? (
                  <Image source={{ uri: dispute.item_image }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: t.colors.surface }]} />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{dispute.item_title ?? '—'}</Text>
                  <Text style={styles.productDates}>
                    {day(dispute.start_date)} - {day(dispute.end_date)}
                    {dispute.total_days ? ` • ${tr.bookingDetail.daysFor(dispute.total_days)}` : ''}
                  </Text>
                  <Text style={styles.productAmount}>{formatUZS(dispute.total_cost ?? 0)}</Text>
                  <View style={[styles.badge, resolved && { backgroundColor: t.green[0] }]}>
                    <Text style={[styles.badgeText, resolved && { color: t.colors.success }]}>
                      {tr.complaints.statuses[dispute.dispute_status] ?? tr.complaints.statusOpen}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{tr.complaints.historyTitle}</Text>
              {history.map((event, i) => {
                const last = i === history.length - 1;
                return (
                  <View key={event.label} style={styles.timelineItem}>
                    <View style={styles.timelineIndicator}>
                      <View style={[styles.timelineDot, { backgroundColor: makeToneColors(t)[event.tone] }]}>
                        <Check size={12} color="#FFFFFF" />
                      </View>
                      {!last && <View style={styles.timelineConnector} />}
                    </View>
                    <View style={[styles.timelineText, !last && styles.timelineTextSpacing]}>
                      <Text style={styles.timelineLabel}>{event.label}</Text>
                      {event.date !== '' && <Text style={styles.timelineDate}>{event.date}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            {dispute.dispute_reason && (
              <View style={styles.card}>
                <Text style={styles.reasonLabel}>{tr.complaints.reasonLabel}</Text>
                <Text style={styles.reasonText}>{dispute.dispute_reason}</Text>
              </View>
            )}

            {resolved && (
              <View style={styles.card}>
                <Text style={styles.reasonLabel}>{tr.complaints.decisionLabel}</Text>
                <Text style={styles.reasonText}>{tr.complaints.decisionResolved}</Text>
                {dispute.resolution_notes && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>{tr.complaints.noteLabel}</Text>
                    <Text style={styles.noteText}>{dispute.resolution_notes}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title={tr.complaints.hotline}
          variant="secondary"
          fullWidth
          leftIcon={<SvgXml xml={PHONE_ICON(t.colors.text)} width={20} height={20} />}
          onPress={() => Linking.openURL(`tel:${HOTLINE}`)}
          style={styles.pillButton}
        />
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  notFound: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
    color: t.colors.textSecondary,
  },
  header: {
    gap: spacing.lg,
    backgroundColor: t.colors.background,
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
    gap: spacing.lg,
  },
  card: {
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
  productRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  productImage: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
  },
  productInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  productName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: t.colors.text,
  },
  productDates: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  productAmount: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: t.orange[10],
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.orange[60],
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    backgroundColor: t.orange[40],
  },
  timelineText: {
    gap: 2,
  },
  timelineTextSpacing: {
    paddingBottom: spacing.lg,
  },
  timelineLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  timelineDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  reasonLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  reasonText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  noteBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: t.colors.surface,
  },
  noteLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  actionBar: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
    backgroundColor: t.colors.background,
  },
  pillButton: { borderRadius: radius.pill },
});
