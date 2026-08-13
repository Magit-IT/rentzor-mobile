/**
 * Auto-dismissing banner for transient confirmations (e.g. "Balance topped
 * up"), replacing the plain system Alert.alert for success/info feedback
 * that doesn't need a blocking "OK" tap. Mounted once at the root
 * (ToastProvider in _layout.tsx) so any screen can call useToast() without
 * prop drilling.
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from './AppIcon';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, Theme } from '../theme';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
});

export const useToast = () => useContext(ToastContext);

const VISIBLE_MS = 2500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const hide = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [progress]);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const id = ++nextId.current;
      setToast({ id, message, tone });
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timeoutRef.current = setTimeout(() => {
        // Only auto-hide if this is still the toast we scheduled for
        // (a newer show() call already reset the timer otherwise).
        setToast((current) => (current?.id === id ? current : null));
        hide();
      }, VISIBLE_MS);
    },
    [hide, progress],
  );

  const value: ToastContextValue = {
    show,
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <ToastBanner toast={toast} progress={progress} onDismiss={hide} />}
    </ToastContext.Provider>
  );
}

function ToastBanner({
  toast,
  progress,
  onDismiss,
}: {
  toast: ToastState;
  progress: Animated.Value;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(t);

  const toneStyle = {
    success: { bg: t.colors.success, icon: 'shieldCheck' as const },
    error: { bg: t.colors.critical, icon: 'dangerTriangle' as const },
    info: { bg: t.colors.text, icon: 'bell' as const },
  }[toast.tone];

  // Rendered inside its own transparent Modal so the banner stacks above
  // native Modal windows too (BottomSheet, ConfirmDialog) — a plain absolute
  // view with zIndex can never outdraw those. A Modal window swallows every
  // touch while visible, so the full-screen Pressable turns any tap into an
  // immediate dismiss instead of a silently eaten press.
  return (
    <Modal transparent statusBarTranslucent animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.fill} onPress={onDismiss}>
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            {
              top: insets.top + spacing.sm,
              opacity: progress,
              transform: [
                {
                  translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={onDismiss}
            style={[styles.banner, { backgroundColor: toneStyle.bg }]}
          >
            <AppIcon name={toneStyle.icon} color="#FFFFFF" size={20} />
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    fill: {
      flex: 1,
    },
    container: {
      position: 'absolute',
      left: spacing.screenX,
      right: spacing.screenX,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.base,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    message: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: '#FFFFFF',
    },
  });
