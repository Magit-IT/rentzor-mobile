/**
 * Figma: Settings / Hisobdan chiqish dialog (293:11378 flow) — centered
 * modal card: title row with a small circular close button, centered
 * message, and a cancel / confirm button pair (confirm styled critical).
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing } from '../theme';
import { Button, ButtonVariant } from './Button';
import { CloseX } from './icons';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Confirm button styling; destructive (red) unless overridden. */
  confirmVariant?: ButtonVariant;
  /** Optional large icon rendered centered above the message. */
  icon?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  confirmVariant = 'critical',
  icon,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTheme();
  // Half-width pills fit ~12 characters at full type size. Longer labels
  // would wrap into egg-shaped multi-line pills, so switch to a stacked
  // column (confirm on top) like a native alert — text never shrinks.
  const stacked = cancelLabel.length > 12 || confirmLabel.length > 12;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, { backgroundColor: t.colors.backgroundSecondary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.colors.text }]} allowFontScaling={false}>
              {title}
            </Text>
            <Pressable
              onPress={onCancel}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? t.gray[20] : t.colors.surface },
              ]}
            >
              <CloseX size={16} color={t.colors.text} />
            </Pressable>
          </View>
          {icon != null && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.message, { color: t.colors.text }]} allowFontScaling={false}>
            {message}
          </Text>
          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {stacked ? (
              <>
                <Button
                  title={confirmLabel}
                  variant={confirmVariant}
                  size="large"
                  onPress={onConfirm}
                  style={styles.stackButton}
                />
                <Button
                  title={cancelLabel}
                  variant="outlined"
                  size="large"
                  onPress={onCancel}
                  style={styles.stackButton}
                />
              </>
            ) : (
              <>
                <Button
                  title={cancelLabel}
                  variant="outlined"
                  size="large"
                  onPress={onCancel}
                  style={styles.pillButton}
                />
                <Button
                  title={confirmLabel}
                  variant={confirmVariant}
                  size="large"
                  onPress={onConfirm}
                  style={styles.pillButton}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
  },
  card: {
    width: '100%',
    // Compact centered dialog per the design — don't stretch on wide screens.
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 28,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { alignItems: 'center' },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Side-by-side halves (cancel left, confirm right) for short labels;
  // stacked full-width rows (confirm first) when a label is too long.
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonsStacked: { flexDirection: 'column' },
  // Button's default 24px side padding eats too much of a half-width pill and
  // wraps even short labels — the pills are width-driven (flex), so trim it.
  pillButton: { flex: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md },
  stackButton: { borderRadius: radius.pill },
});
