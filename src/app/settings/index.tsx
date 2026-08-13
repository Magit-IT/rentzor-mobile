/**
 * Figma: Settings / Sozlamalar (light 293:11378 flow, dark 539:14273) —
 * "Sozlamalar" header, "Bildirishnomalar sozlamasi" card with three
 * notification toggles, "Qo'shimcha sozlamalar" card with the language row
 * and the dark-mode ("Tungi rejim") toggle, red "Chiqish" row, and the
 * "Tilni o'zgartirish" bottom sheet with a language radio list.
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/AppIcon';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Chevron } from '../../components/icons';
import { RadioButton } from '../../components/RadioButton';
import { Toggle } from '../../components/Toggle';
import { useLanguage } from '../../context/LanguageContext';
import { signOut } from '../../lib/auth';
import { LANGUAGES } from '../../i18n';
import { useTheme, useThemePreference } from '../../context/ThemeContext';
import { fonts, press, radius, spacing } from '../../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const t = useTheme();
  const { language, setLanguage, t: tr } = useLanguage();
  const { isDark, setPreference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [appUpdates, setAppUpdates] = useState(true);
  const [accountChanges, setAccountChanges] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const languageLabel = LANGUAGES.find((l) => l.code === language)?.label ?? '';

  // Section labels follow the design's Primary/Text token in dark; light
  // keeps the reviewed gray look.
  const sectionLabelColor = isDark ? t.colors.text : t.colors.textSecondary;
  const cardTheme = {
    backgroundColor: t.colors.backgroundSecondary,
    borderColor: t.colors.strokeLight,
  };

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
          <Text style={[styles.headerTitle, { color: t.colors.text }]}>{tr.settings.title}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.strokeDark }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
            {tr.settings.notificationsSection}
          </Text>
          <View style={[styles.card, cardTheme]}>
            <View style={styles.toggleRow}>
              <Text style={[styles.rowLabel, { color: t.colors.text }]}>
                {tr.settings.orderUpdates}
              </Text>
              <Toggle value={orderUpdates} onChange={setOrderUpdates} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.rowLabel, { color: t.colors.text }]}>
                {tr.settings.appUpdates}
              </Text>
              <Toggle value={appUpdates} onChange={setAppUpdates} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.rowLabel, { color: t.colors.text }]}>
                {tr.settings.accountChanges}
              </Text>
              <Toggle value={accountChanges} onChange={setAccountChanges} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
            {tr.settings.additionalSection}
          </Text>
          <View style={[styles.card, cardTheme]}>
            <Pressable
              onPress={() => setLanguageSheetOpen(true)}
              style={({ pressed }) => [styles.languageRow, pressed && press.dim]}
            >
              <AppIcon name="globe" color={t.colors.text} size={24} />
              <Text style={[styles.rowLabel, { color: t.colors.text }]}>
                {tr.settings.language}
              </Text>
              <Text style={[styles.languageValue, { color: t.colors.primary }]}>
                {languageLabel}
              </Text>
            </Pressable>
            <View style={styles.languageRow}>
              <AppIcon name="moon" color={t.colors.text} size={24} />
              <Text style={[styles.rowLabel, { color: t.colors.text }]}>
                {tr.settings.darkMode}
              </Text>
              <Toggle value={isDark} onChange={(v) => setPreference(v ? 'dark' : 'light')} />
            </View>
            <Pressable
              onPress={() => router.push('/settings/delete-account')}
              style={({ pressed }) => [styles.languageRow, pressed && press.dim]}
            >
              <AppIcon name="dangerTriangle" color={t.colors.critical} size={24} />
              <Text style={[styles.rowLabel, { color: t.colors.critical }]}>
                {tr.settings.deleteAccount}
              </Text>
              <AppIcon name="trash" color={t.colors.critical} size={24} />
            </Pressable>
          </View>
        </View>

        {/* marginTop auto + flexGrow on the scroll content pins this to the
         * bottom of the screen when the content is shorter than the view. */}
        <Pressable
          onPress={() => setLogoutDialogOpen(true)}
          style={({ pressed }) => [
            styles.logoutRow,
            styles.logoutRowBottom,
            { backgroundColor: pressed ? t.colors.criticalSurfacePressed : t.colors.criticalSurface },
          ]}
        >
          <AppIcon name="logout" color={t.colors.critical} size={24} />
          <Text style={[styles.logoutLabel, { color: t.colors.critical }]}>
            {tr.settings.logout}
          </Text>
        </Pressable>
      </ScrollView>

      <BottomSheet
        visible={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
        title={tr.settings.changeLanguage}
      >
        <View>
          {LANGUAGES.map((lang, i) => (
            <Pressable
              key={lang.code}
              onPress={() => {
                setLanguage(lang.code);
                setLanguageSheetOpen(false);
              }}
              style={({ pressed }) => [
                styles.languageOption,
                i > 0 && [styles.languageOptionBorder, { borderTopColor: t.colors.strokeDark }],
                pressed && press.dim,
              ]}
            >
              <Text
                style={[
                  styles.languageOptionLabel,
                  { color: language === lang.code ? t.colors.primary : t.colors.text },
                ]}
              >
                {lang.label}
              </Text>
              <RadioButton
                selected={language === lang.code}
                onPress={() => {
                  setLanguage(lang.code);
                  setLanguageSheetOpen(false);
                }}
              />
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={logoutDialogOpen}
        title={tr.settings.logoutTitle}
        message={tr.settings.logoutMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={tr.settings.logout}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={async () => {
          setLogoutDialogOpen(false);
          await signOut();
          // Land on the public home tab as a guest; the guard flip in
          // _layout.tsx removes the protected history entries.
          router.replace('/(tabs)/home');
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
    flexGrow: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.xxl,
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
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  languageValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  logoutRowBottom: {
    marginTop: 'auto',
  },
  logoutLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  languageOptionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  languageOptionLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
