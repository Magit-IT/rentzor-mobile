/**
 * Figma: Profile & Settings / Telegram ulanish (293:11378 flow) — header,
 * RentZor ↔ Telegram connection graphic (R circle, dots + link glyph,
 * Telegram circle), "Telegram ulanishi" title with the @RentZor_bot note,
 * the code-expiry countdown, and the "Botni ochish" button.
 *
 * Mirrors rentzor-marketplace's TelegramConnectDrawer: a 6-digit code from
 * the telegram-generate-code edge function (10-minute expiry, rate-limited
 * 3/min), deep link t.me/RentZor_bot?start=<code>, and a 5s profile poll
 * until the bot's webhook flips profiles.telegram_verified. Fallback for
 * when the deep link loses the payload: send "/connect <code>" manually
 * (tap the command to copy it).
 */
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { Button } from '../components/Button';
import { Chevron } from '../components/icons';
import { useT } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { supabase } from '../integrations/supabase/client';
import { fonts, press, radius, spacing, Theme } from '../theme';

const BOT_URL = 'https://t.me/RentZor_bot';
const POLL_MS = 5000;

const TELEGRAM_BADGE = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#2AABEE"/><path d="M45.4 19.9L40.1 44.4C39.8 45.7 38.3 46.3 37.2 45.5L30.6 40.7L27 44.2C26.4 44.8 25.4 44.6 25.1 43.8L22.9 36.5L15.9 34.3C14.7 33.9 14.7 32.3 15.9 31.9L43.4 18.3C44.5 17.8 45.7 18.7 45.4 19.9Z" fill="white"/><path d="M23 36.6L24.2 43.2L25 37.9L38.5 24.5C38.9 24.1 38.4 23.9 38 24.2L23 36.6Z" fill="#B0D9F0"/></svg>`;

const LINK_GLYPH = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.8 8.2C6.4 8.8 7.4 8.8 8 8.2L10.8 5.4C11.4 4.8 11.4 3.8 10.8 3.2C10.2 2.6 9.2 2.6 8.6 3.2L7.9 3.9" stroke="${color}" stroke-width="1.3" stroke-linecap="round"/><path d="M8.2 5.8C7.6 5.2 6.6 5.2 6 5.8L3.2 8.6C2.6 9.2 2.6 10.2 3.2 10.8C3.8 11.4 4.8 11.4 5.4 10.8L6.1 10.1" stroke="${color}" stroke-width="1.3" stroke-linecap="round"/></svg>`;

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TelegramConnectScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading: profileLoading, refresh } = useProfile();

  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestedOnce = useRef(false);

  const connected = profile?.telegram_verified === true;
  const expired = code !== null && secondsLeft <= 0;

  const generateCode = useCallback(async () => {
    setGenerating(true);
    setFailed(false);
    setCopied(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');
      const { data, error } = await supabase.functions.invoke('telegram-generate-code', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || !data?.code) throw error ?? new Error('empty response');
      setCode(data.code);
      setExpiresAt(new Date(data.expires_at).getTime());
    } catch {
      setFailed(true);
    } finally {
      setGenerating(false);
    }
  }, []);

  // One code on entry; more only via the explicit "new link" button, so the
  // function's 3/min rate limit is never hit by re-renders.
  useEffect(() => {
    if (profileLoading || connected || requestedOnce.current) return;
    requestedOnce.current = true;
    generateCode();
  }, [profileLoading, connected, generateCode]);

  // Countdown re-derived from the wall clock so backgrounding doesn't drift it.
  useEffect(() => {
    if (expiresAt === null) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // While a live code is out, watch for the bot's webhook confirming.
  useEffect(() => {
    if (!code || connected || expired) return;
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [code, connected, expired, refresh]);

  const openBot = () => {
    if (connected) {
      router.back();
      return;
    }
    if (failed || expired) {
      generateCode();
      return;
    }
    if (code) Linking.openURL(`${BOT_URL}?start=${code}`);
  };

  const copyCommand = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(`/connect ${code}`);
    setCopied(true);
  };

  const buttonTitle = connected
    ? tr.common.back
    : failed || expired
      ? tr.telegram.requestNew
      : tr.telegram.openBot;

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
          <Text style={styles.headerTitle}>{tr.telegram.headerTitle}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <View style={styles.body}>
        <View style={styles.graphic}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>R</Text>
          </View>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, { backgroundColor: connected ? t.colors.success : t.gray[30] }]} />
            <View style={[styles.dot, { backgroundColor: connected ? t.colors.success : t.gray[30] }]} />
            <SvgXml xml={LINK_GLYPH(connected ? t.colors.success : t.colors.textSecondary)} width={14} height={14} />
            <View style={[styles.dot, { backgroundColor: t.colors.success }]} />
            <View style={[styles.dot, { backgroundColor: t.colors.success }]} />
          </View>
          <SvgXml xml={TELEGRAM_BADGE} width={64} height={64} />
        </View>

        {connected ? (
          <View style={styles.message}>
            <Text style={styles.title}>{tr.telegram.connectedHeading}</Text>
            <Text style={styles.subtitle}>{tr.telegram.connectedNote}</Text>
          </View>
        ) : (
          <>
            <View style={styles.message}>
              <Text style={styles.title}>{tr.telegram.heading}</Text>
              <Text style={styles.subtitle}>
                {tr.telegram.subtitleBefore}
                <Text style={styles.subtitleBold}>@RentZor_bot</Text>
                {tr.telegram.subtitleAfter}
              </Text>
            </View>

            {generating ? (
              <ActivityIndicator color={t.colors.primary} />
            ) : failed ? (
              <Text style={styles.errorText}>{tr.telegram.generateFailed}</Text>
            ) : code && !expired ? (
              <View style={styles.manual}>
                <Text style={styles.manualHint}>{tr.telegram.manualHint}</Text>
                <Pressable
                  onPress={copyCommand}
                  style={({ pressed }) => [styles.codePill, pressed && press.dim]}
                >
                  <Text style={styles.codeText} selectable>
                    /connect {code}
                  </Text>
                </Pressable>
                {copied && <Text style={styles.copiedText}>{tr.telegram.copied}</Text>}
              </View>
            ) : null}
          </>
        )}
      </View>

      {!connected && code && !expired && !generating && (
        <View style={styles.countdownRow}>
          <Text style={styles.countdown}>
            <Text style={styles.countdownNumber}>{formatCountdown(secondsLeft)}</Text>
            {tr.telegram.countdownSuffix}
          </Text>
        </View>
      )}

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title={buttonTitle}
          fullWidth
          disabled={generating || (!connected && !failed && !code)}
          onPress={openBot}
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
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.screenX,
    paddingTop: 56,
    gap: 40,
  },
  graphic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: fonts.extraBold,
    fontSize: 30,
    color: t.colors.text,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  message: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    color: t.colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  subtitleBold: {
    fontFamily: fonts.medium,
    color: t.colors.text,
  },
  manual: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  codePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.surface,
  },
  codeText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  copiedText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.success,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.critical,
  },
  countdownRow: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.lg,
  },
  countdown: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  countdownNumber: {
    fontFamily: fonts.semiBold,
    color: t.colors.text,
  },
  actionBar: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.xs,
    backgroundColor: t.colors.background,
  },
  pillButton: { borderRadius: radius.pill },
});
