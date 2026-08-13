/**
 * Figma: Settings / Yordam markazi (293:11378 flow) — "Yordam markazi"
 * header, "Biz bilan bog'lanish" contact cards (Telegram, email) with copy
 * buttons, "Tez-tez beriladigan savollar" FAQ accordion cards, and
 * "Foydali linklar" cards with external-link arrows.
 */
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelpIcon, HelpIconName } from '../../components/HelpIcon';
import { Check, Chevron } from '../../components/icons';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts, press, radius, spacing, Theme } from '../../theme';

const CONTACT_META: { icon: HelpIconName; value: string }[] = [
  { icon: 'paperPlane', value: '@rentzor' },
  { icon: 'envelope', value: 'info.rentzor@gmail.com' },
];

export default function HelpScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);

  const contacts = [
    { ...CONTACT_META[0], label: tr.help.telegramLabel },
    { ...CONTACT_META[1], label: tr.help.emailLabel },
  ];
  // Legal pages served by the web marketplace (rentzor.uz routes
  // /rental-agreement and /privacy) — the app links out rather than
  // duplicating the documents.
  const links: { icon: HelpIconName; label: string; url: string }[] = [
    { icon: 'docText', label: tr.help.terms, url: 'https://rentzor.uz/rental-agreement' },
    { icon: 'shield', label: tr.help.privacy, url: 'https://rentzor.uz/privacy' },
  ];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(0);
  const [copied, setCopied] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const copyToClipboard = async (value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(value);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(null), 2000);
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
            <Chevron direction="left" size={24} color="#18181B" />
          </Pressable>
          <Text style={styles.headerTitle}>{tr.help.title}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{tr.help.contactSection}</Text>
          {contacts.map((contact) => (
            <View key={contact.value} style={[styles.card, styles.contactRow]}>
              <View style={styles.iconCircle}>
                <HelpIcon name={contact.icon} color={t.colors.text} />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Text style={styles.contactValue}>{contact.value}</Text>
              </View>
              <Pressable
                onPress={() => copyToClipboard(contact.value)}
                hitSlop={8}
                style={({ pressed }) => pressed && press.dim}
              >
                {copied === contact.value ? (
                  <Check size={20} color={t.colors.success} />
                ) : (
                  <HelpIcon name="copy" color={t.colors.primary} size={20} />
                )}
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{tr.help.faqSection}</Text>
          {tr.help.faqs.map((faq, i) => {
            const open = expanded === i;
            return (
              <Pressable
                key={faq.question}
                onPress={() => setExpanded(open ? null : i)}
                style={({ pressed }) => [styles.card, styles.faqCard, pressed && styles.cardPressed]}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Chevron direction={open ? 'up' : 'down'} size={20} color={t.colors.text} />
                </View>
                {open && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{tr.help.linksSection}</Text>
          {links.map((link) => (
            <Pressable
              key={link.label}
              onPress={() => Linking.openURL(link.url).catch(() => {})}
              style={({ pressed }) => [styles.card, styles.contactRow, pressed && styles.cardPressed]}
            >
              <View style={styles.iconCircle}>
                <HelpIcon name={link.icon} color={t.colors.text} />
              </View>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <HelpIcon name="externalArrow" color={t.colors.primary} size={20} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
    paddingBottom : 20
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
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  cardPressed: { backgroundColor: t.gray[0] },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  contactValue: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  faqCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  faqAnswer: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  linkLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
});
