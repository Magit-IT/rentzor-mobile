/**
 * Account deletion (Apple 5.1.1(v) / Play data-deletion requirement).
 * Explains the anonymize-in-place contract (PII erased, rental/payment
 * history kept anonymously), then calls the delete-account edge function.
 * Blockers (active bookings, balance, holds, pending payouts) come back as
 * { error_code } and map to localized toast messages.
 */
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/AppIcon';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Chevron } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, useThemePreference } from '../../context/ThemeContext';
import { supabase } from '../../integrations/supabase/client';
import { fonts, press, radius, spacing } from '../../theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const t = useTheme();
  const { isDark } = useThemePreference();
  const { t: tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const d = tr.deleteAccount;

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { source: 'mobile' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        let code = 'server_error';
        if (error instanceof FunctionsHttpError) {
          try {
            code = String((await error.context.json())?.error_code ?? 'server_error');
          } catch {
            // Non-JSON error body; fall through to the generic message.
          }
        }
        const messages: Record<string, string> = {
          active_bookings: d.errActiveBookings,
          balance_not_empty: d.errBalanceNotEmpty,
          balance_negative: d.errBalanceNegative,
          funds_on_hold: d.errFundsOnHold,
          pending_payouts: d.errPendingPayouts,
        };
        toast.error(messages[code] ?? d.errServer);
        return;
      }
      toast.success(d.successMessage);
      // The server already revoked every session, so a global signOut() would
      // just fail against it — clear the local session only.
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/(tabs)/home');
    } catch {
      toast.error(d.errServer);
    } finally {
      setDeleting(false);
    }
  };

  const cardTheme = {
    backgroundColor: t.colors.backgroundSecondary,
    borderColor: t.colors.strokeLight,
  };
  const sectionLabelColor = isDark ? t.colors.text : t.colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.colors.background, paddingTop: insets.top + spacing.sm },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => pressed && press.dim}
          >
            <Chevron direction="left" size={24} color={t.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.colors.text }]}>{d.title}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.strokeDark }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <View style={[styles.warningCard, cardTheme]}>
          <View style={styles.warningHeader}>
            <AppIcon name="dangerTriangle" color={t.colors.critical} size={24} />
            <Text style={[styles.warningTitle, { color: t.colors.critical }]}>
              {d.warningTitle}
            </Text>
          </View>
          {[d.point1, d.point2, d.point3].map((point, i) => (
            <View key={i} style={styles.pointRow}>
              <Text style={[styles.pointBullet, { color: t.colors.textSecondary }]}>•</Text>
              <Text style={[styles.pointText, { color: t.colors.text }]}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
            {d.requirementsTitle}
          </Text>
          <View style={[styles.warningCard, cardTheme]}>
            <View style={styles.pointRow}>
              <Text style={[styles.pointBullet, { color: t.colors.textSecondary }]}>•</Text>
              <Text style={[styles.pointText, { color: t.colors.text }]}>{d.requirement1}</Text>
            </View>
          </View>
        </View>

        <Button
          title={d.button}
          variant="critical"
          fullWidth
          loading={deleting}
          onPress={() => setConfirmOpen(true)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirmOpen}
        title={d.confirmTitle}
        message={d.confirmMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={d.confirmAction}
        icon={<AppIcon name="dangerTriangle" color={t.colors.critical} size={48} />}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteAccount();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: spacing.lg,
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
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.screenX,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xxl,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  warningCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  warningTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  pointRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pointBullet: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    width: 16,
  },
  pointText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});
