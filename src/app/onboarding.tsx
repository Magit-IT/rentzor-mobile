/**
 * Figma: Onboarding 4/5/6 (light 293:11091/11110/11130, dark 539:13902/
 * 13921/13941) — 3-slide carousel: language pill + skip on top, 3D
 * illustration, centered title/subtitle, page dots, bottom action bar.
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BottomSheet, Button, PageIndicator, RadioButton } from '../components';
import { Chevron } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n';
import { markOnboardingSeen } from '../lib/onboarding';
import { useTheme } from '../context/ThemeContext';
import { fonts, press, radius, spacing } from '../theme';

interface Slide {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
}

const SLIDE_IMAGES: ImageSourcePropType[] = [
  require('../assets/onboarding/premium-rental-app-illustration-1-2.png'),
  require('../assets/onboarding/premium-rental-app-illustration-1-3.png'),
  require('../assets/onboarding/illustration-2.png'),
];

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const { language: languageCode, setLanguage, t: tr } = useLanguage();
  const language = LANGUAGES.find((l) => l.code === languageCode) ?? LANGUAGES[0];
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  const slides: Slide[] = tr.onboarding.slides.map((slide, i) => ({
    image: SLIDE_IMAGES[i],
    ...slide,
  }));
  const isLast = index === slides.length - 1;

  // Both exits mark the carousel as seen so the splash routes straight to
  // the app next launch: Skip continues as a guest, Sign in enters auth.
  const skipToApp = () => {
    markOnboardingSeen();
    router.replace('/(tabs)/home');
  };
  const finish = () => {
    markOnboardingSeen();
    router.replace('/(auth)/phone');
  };

  const goTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <Pressable
          onPress={() => setLanguageSheetOpen(true)}
          style={({ pressed }) => [
            styles.languagePill,
            { backgroundColor: pressed ? t.gray[20] : t.colors.surface },
          ]}
        >
          {language.code === 'uz' ? (
            <Image
              source={require('../assets/onboarding/uzbekistan-1.png')}
              style={styles.flag}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.flagEmoji}>{language.flag}</Text>
          )}
          <Text style={[styles.languageLabel, { color: t.colors.text }]}>{language.short}</Text>
          <Chevron direction="down" size={24} color={t.colors.text} />
        </Pressable>
        <Pressable onPress={skipToApp} hitSlop={8} style={({ pressed }) => pressed && press.dim}>
          <Text style={[styles.skipLabel, { color: t.colors.text }]}>{tr.onboarding.skip}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={item.image} style={styles.illustration} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: t.colors.text }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: t.gray[70] }]}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <PageIndicator count={slides.length} activeIndex={index} style={styles.dots} />

      <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
        {index > 0 && !isLast && (
          <Button title={tr.onboarding.previous} variant="secondary" onPress={() => goTo(index - 1)} />
        )}
        <Button
          title={isLast ? tr.onboarding.signIn : tr.onboarding.next}
          onPress={() => (isLast ? finish() : goTo(index + 1))}
        />
      </ActionBar>

      <BottomSheet
        visible={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
        title={tr.onboarding.selectLanguage}
      >
        <View style={styles.languageList}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => {
                setLanguage(lang.code);
                setLanguageSheetOpen(false);
              }}
              style={({ pressed }) => [styles.languageRow, pressed && press.dim]}
            >
              <Text style={styles.flagEmoji}>{lang.flag}</Text>
              <Text style={[styles.languageName, { color: t.colors.text }]}>{lang.label}</Text>
              <RadioButton
                selected={lang.code === language.code}
                onPress={() => {
                  setLanguage(lang.code);
                  setLanguageSheetOpen(false);
                }}
              />
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.base,
  },
  flag: { width: 24, height: 24 },
  flagEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  languageList: {
    gap: spacing.xs,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  languageName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  languageLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  skipLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  slide: {
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
  },
  illustration: {
    width: '100%',
    height: 240,
  },
  textContainer: {
    marginTop: 40,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: {
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
});
