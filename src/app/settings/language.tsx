/**
 * Language selection screen — same options as the settings "Til" sheet,
 * as a standalone page: back header + radio list bound to LanguageContext.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadioButton } from '../../components/RadioButton';
import { Chevron } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';
import { fonts, press, spacing } from '../../theme';

export default function LanguageScreen() {
  const t = useTheme();
  const { language, setLanguage, t: tr } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.colors.background, paddingTop: insets.top + spacing.sm },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => pressed && press.dim}
          >
            <Chevron direction="left" size={24} color={t.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.colors.text }]}>
            {tr.settings.language}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.strokeDark }]} />
      </View>

      <View style={styles.list}>
        {LANGUAGES.map((lang, i) => (
          <Pressable
            key={lang.code}
            onPress={() => setLanguage(lang.code)}
            style={({ pressed }) => [
              styles.row,
              i > 0 && [styles.rowBorder, { borderTopColor: t.colors.strokeDark }],
              pressed && press.dim,
            ]}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[
                styles.rowLabel,
                { color: language === lang.code ? t.colors.primary : t.colors.text },
              ]}
            >
              {lang.label}
            </Text>
            <RadioButton
              selected={language === lang.code}
              onPress={() => setLanguage(lang.code)}
            />
          </Pressable>
        ))}
      </View>
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
  list: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
