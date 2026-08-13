/**
 * Figma: Location & Notification / Notification (293:12117) —
 * "Bildirishnomalar" header with back arrow and mark-all-read icon,
 * followed by bordered notification cards (circular icon, bold title,
 * short message, inset label/value detail rows for dates/times/price/
 * phone, timestamp, chevron).
 *
 * Mirrors rentzor-marketplace's NotificationsDropdown: real rows from
 * public.notifications, per-type localized title/message/details via
 * lib/notificationText, tap-to-navigate + mark-read, realtime updates.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chevron } from '../components/icons';
import {
  NotificationIcon,
} from '../components/NotificationIcon';
import { useT } from '../context/LanguageContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { Notification, useNotifications } from '../hooks/useNotifications';
import { notificationIcon, notificationTone } from '../lib/notificationIcon';
import { notificationDetails, notificationLink, translateNotification } from '../lib/notificationText';
import { fonts, press, spacing, Theme } from '../theme';

// Inline tokens the design colors inside the message (293:12118): «item»
// references in primary blue, amounts in green/red, date-times in gray.
const TOKEN_RE =
  /(«[^»]*»)|([+−-]?\d[\d\s.,]*\sUZS)|(\d{4}-\d{2}-\d{2}(?:,\s?\d{1,2}:\d{2})?)|(\b\d{1,2}:\d{2}\b)/g;

function messageSegments(
  text: string,
  tone: ReturnType<typeof notificationTone>,
  colors: { primary: string; success: string; critical: string; muted: string },
): { text: string; color?: string }[] {
  const segments: { text: string; color?: string }[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ text: text.slice(last, index) });
    const [token, item, amount] = match;
    if (item) {
      segments.push({ text: token, color: colors.primary });
    } else if (amount) {
      // Explicit sign wins; otherwise tint by the notification's tone so
      // top-ups read green and penalty charges read red, like the design.
      const color = amount.startsWith('+')
        ? colors.success
        : /^[−-]/.test(amount)
          ? colors.critical
          : tone === 'success'
            ? colors.success
            : tone === 'danger'
              ? colors.critical
              : undefined;
      segments.push({ text: token, color });
    } else {
      segments.push({ text: token, color: colors.muted });
    }
    last = index + token.length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

export default function NotificationsScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const tokenColors = {
    primary: t.colors.primary,
    success: t.colors.success,
    critical: t.colors.critical,
    muted: t.colors.textSecondary,
  };

  /** ISO timestamp -> "8 may, 20:00" (per the design's card footer). */
  const cardDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()}, ${hhmm}`;
  };

  const onPress = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    const link = notificationLink(n);
    if (link) router.push(link as never);
  };

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
          <Text style={styles.headerTitle}>{tr.notifications.title}</Text>
          {unreadCount > 0 && (
            <Pressable
              onPress={() => markAllAsRead()}
              hitSlop={8}
              style={({ pressed }) => pressed && press.dim}
            >
              <NotificationIcon name="doubleCheck" color={t.colors.text} />
            </Pressable>
          )}
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{tr.notifications.loadError}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryButton, pressed && press.dim]}
            >
              <Text style={styles.retryText}>{tr.home.retry}</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <Text style={[styles.emptyText, styles.emptyBox]}>{tr.notifications.empty}</Text>
        ) : (
          notifications.map((n) => {
            const { title, message } = translateNotification(n, tr);
            const details = notificationDetails(n, tr);
            const tone = notificationTone(n.type);
            const hasLink = notificationLink(n) !== null;
            return (
              <Pressable
                key={n.id}
                onPress={() => onPress(n)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.iconCircle}>
                  <NotificationIcon name={notificationIcon(n.type)} color={t.colors.text} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.title}>{title}</Text>
                  {message !== '' && message !== title && (
                    <Text style={styles.message}>
                      {messageSegments(message, tone, tokenColors).map((segment, i) => (
                        <Text key={i} style={segment.color ? { color: segment.color } : null}>
                          {segment.text}
                        </Text>
                      ))}
                    </Text>
                  )}
                  {details.length > 0 && (
                    <View style={styles.details}>
                      {details.map((detail, i) => (
                        <View key={i} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{detail.label}</Text>
                          <Text
                            style={[
                              styles.detailValue,
                              detail.tone === 'success' && { color: t.colors.success },
                              detail.tone === 'critical' && { color: t.colors.critical },
                            ]}
                          >
                            {detail.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.date}>{cardDate(n.created_at)}</Text>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
                {hasLink && <Chevron direction="right" size={16} color={t.colors.text} />}
              </Pressable>
            );
          })
        )}
      </ScrollView>
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
  list: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
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
    borderRadius: 12,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: { backgroundColor: t.gray[0] },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  // Inset label/value panel for dates, times, price, owner phone.
  details: {
    marginVertical: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: t.colors.surface,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  detailValue: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    color: t.colors.text,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.primary,
  },
});
