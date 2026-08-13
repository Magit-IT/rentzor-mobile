/**
 * Profile / Promocodes — no dedicated Figma screen; follows the settings
 * screens' header pattern (transactions.tsx) and mirrors the web app's
 * PromocodeTab states: redeem form, active code (code, benefits, expiry,
 * change action) and expired code (re-redeem form).
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { Chevron } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { daysLeft, mapRedeemErrorKey, usePromocode, UserPromocode } from '../../hooks/usePromocode';
import { fonts, press, radius, spacing, Theme } from '../../theme';

export default function PromocodesScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { promocode, state, loading, error, redeeming, redeem, refresh } = usePromocode();
  // "Change code" swaps the active view for the redeem form.
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState('');
  const toast = useToast();

  /** "2026-09-12T00:00:00Z" -> "12 sentabr 2026" (device-local time). */
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  };

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      const { days } = await redeem(trimmed);
      toast.success(tr.promocode.activated(days));
      setCode('');
      setEditing(false);
    } catch (e) {
      const key = mapRedeemErrorKey(e instanceof Error ? e.message : String(e));
      toast.error(tr.promocode[key]);
    }
  };

  const redeemForm = (
    <View style={styles.form}>
      <Text style={styles.subtitle}>{tr.promocode.subtitle}</Text>
      <Input
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder={tr.promocode.placeholder}
        maxLength={32}
        autoCapitalize="characters"
        autoCorrect={false}
        style={styles.codeInput}
      />
      <Button
        title={tr.promocode.apply}
        onPress={handleApply}
        loading={redeeming}
        disabled={!code.trim()}
        fullWidth
      />
    </View>
  );

  const activeView = (data: UserPromocode) => {
    const meta = data.promocodes;
    const renterPct = Math.round((meta?.renter_fee_discount ?? 0) * 100);
    const ownerPct = Math.round((meta?.owner_fee_discount ?? 0) * 100);
    const expIso = data.benefit_expires_at!;

    return (
      <View style={styles.form}>
        <View>
          <Text style={styles.code}>{meta?.code}</Text>
          {meta?.description != null && meta.description !== '' && (
            <Text style={styles.description}>"{meta.description}"</Text>
          )}
        </View>

        {(renterPct > 0 || ownerPct > 0) && (
          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>{tr.promocode.benefits}</Text>
            {renterPct > 0 && (
              <Text style={styles.benefitRow}>{'• '}{tr.promocode.renterDiscount(renterPct)}</Text>
            )}
            {ownerPct > 0 && (
              <Text style={styles.benefitRow}>{'• '}{tr.promocode.ownerDiscount(ownerPct)}</Text>
            )}
          </View>
        )}

        <Text style={styles.expiry}>
          {tr.promocode.expires(formatDate(expIso), daysLeft(expIso))}
        </Text>

        <Button
          title={tr.promocode.change}
          variant="outlined"
          onPress={() => setEditing(true)}
          fullWidth
        />
      </View>
    );
  };

  const expiredView = (data: UserPromocode) => (
    <View style={styles.form}>
      <Text style={styles.expiredLine}>
        <Text style={styles.expiredCode}>{data.promocodes?.code}</Text>
        {data.benefit_expires_at
          ? ` (${tr.promocode.expiredOn(formatDate(data.benefit_expires_at))})`
          : ''}
      </Text>
      {redeemForm}
    </View>
  );

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
          <Text style={styles.headerTitle}>{tr.promocode.title}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{tr.promocode.loadError}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryButton, pressed && press.dim]}
            >
              <Text style={styles.retryText}>{tr.home.retry}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <AppIcon name="ticket" color={t.colors.primary} size={24} />
                <Text style={styles.cardTitle}>{tr.promocode.title}</Text>
              </View>
              {state === 'active' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tr.promocode.active}</Text>
                </View>
              )}
              {state === 'expired' && (
                <View style={[styles.badge, styles.badgeExpired]}>
                  <Text style={[styles.badgeText, styles.badgeExpiredText]}>
                    {tr.promocode.expired}
                  </Text>
                </View>
              )}
            </View>

            {state === 'active' && promocode && !editing
              ? activeView(promocode)
              : state === 'expired' && promocode && !editing
                ? expiredView(promocode)
                : redeemForm}
          </View>
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
  content: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xl,
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
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.green[30],
    backgroundColor: t.green[0],
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.green[70],
  },
  badgeExpired: {
    borderColor: t.orange[30],
    backgroundColor: t.orange[0],
  },
  badgeExpiredText: {
    color: t.orange[50],
  },
  form: {
    gap: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  codeInput: {
    letterSpacing: 2,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 2,
    color: t.colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  benefits: {
    gap: spacing.xs,
  },
  benefitsTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  benefitRow: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  expiry: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  expiredLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  expiredCode: {
    fontFamily: fonts.semiBold,
    color: t.colors.text,
  },
});
