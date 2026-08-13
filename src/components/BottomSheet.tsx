/**
 * Figma: Design System / Drawer (293:32457) — modal sheet anchored to the
 * bottom: top corners r=24, light stroke, 20px padding, 16 gap, header row
 * with title (Onest 600 20/32) and a close affordance.
 *
 * Slides up from the bottom over a fading backdrop. Capped at 90% of the
 * screen; taller content scrolls inside the body instead of pushing the
 * header off-screen.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { fonts, press, radius, spacing } from '../theme';
import { CloseX } from './icons';
import { PageScrollView } from './PageScrollView';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Rendered flush at the bottom, e.g. an <ActionBar/>. */
  footer?: React.ReactNode;
  /** Attached to the body ScrollView, e.g. to scroll a focused input into view. */
  scrollRef?: React.RefObject<ScrollView | null>;
  /**
   * Stretch the card to the screen's bottom edge (up to maxHeight) instead of
   * hugging its content — for sheets with enough fields that hugging leaves
   * them scroll-only on short screens. Default sheets (confirm dialogs,
   * short pickers) should NOT set this — they're meant to hug their content.
   */
  fillHeight?: boolean;
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollRef,
  fillHeight = false,
  style,
}: BottomSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  // Kept mounted while the slide-out animation plays.
  const [mounted, setMounted] = useState(visible);

  // The Modal window never resizes for the keyboard (statusBarTranslucent
  // breaks adjustResize on Android; iOS never resizes), so inputs near the
  // sheet's bottom end up BEHIND the keyboard. Track its height and pad the
  // sheet by it: the shrinkable body scrolls and the footer stays visible.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            fillHeight && styles.sheetFill,
            {
              backgroundColor: t.colors.background,
              borderColor: t.colors.strokeLight,
              paddingBottom:
                keyboardHeight > 0
                  ? keyboardHeight + spacing.lg
                  : Math.max(insets.bottom, spacing.lg),
            },
            {
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [windowHeight, 0],
                  }),
                },
              ],
            },
            style,
          ]}
        >
          {title != null && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => pressed && press.dim}>
                <CloseX size={24} color={t.colors.text} />
              </Pressable>
            </View>
          )}
          <PageScrollView
            ref={scrollRef}
            style={[styles.body, fillHeight && styles.bodyFill]}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </PageScrollView>
          {footer}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTouch: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: '100%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenX,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
  },
  // minHeight: 0 is load-bearing: flex items default to minHeight "auto"
  // (their content size), which blocks flexShrink from ever shrinking this
  // ScrollView below its content height. Without it, the sheet's own
  // maxHeight cap gets exceeded and the overflow is clipped outright instead
  // of becoming scrollable — the actual cause of "cut off content, no
  // scroll" regardless of the keyboard. flexShrink (not flexGrow) keeps
  // short sheets hugging their content instead of always filling 90%.
  body: {
    flexShrink: 1,
    minHeight: 0,
  },
  bodyContent: { paddingHorizontal: spacing.screenX },
  // fillHeight=true styles below: sheetFill makes the card claim all
  // available height (still capped at maxHeight, still shrinkable); bodyFill
  // lets the scroll area absorb whatever's left over past the fields'
  // natural height, so the footer lands flush with the true bottom instead
  // of a gap of bare backdrop showing beneath a content-hugging card.
  sheetFill: { flexGrow: 1 },
  bodyFill: { flexGrow: 1 },
});
