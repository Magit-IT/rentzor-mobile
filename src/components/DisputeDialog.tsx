/**
 * Figma: Dispute drawer (293:12606) — "Shikoyat qilish" bottom sheet shown
 * from the booking detail/list kebab menu once the owner has confirmed the
 * booking. Warns about the penalty for a false claim, collects a free-text
 * description and a required acknowledgement checkbox, then calls
 * renter_open_dispute (mirrors rentzor-marketplace's BookingActions dispute
 * dialog / useOpenDispute).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { openDispute } from '../hooks/useBookings';
import { fonts, radius, spacing, Theme } from '../theme';
import { ActionBar } from './ActionBar';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { useToast } from './Toast';

export interface DisputeDialogProps {
  visible: boolean;
  bookingId: string;
  onClose: () => void;
  /** Called after the dispute is opened (e.g. to refresh the booking/list). */
  onSubmitted?: () => void;
}

export function DisputeDialog({ visible, bookingId, onClose, onSubmitted }: DisputeDialogProps) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();

  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = reason.trim().length > 0 && acknowledged;

  const reset = () => {
    setReason('');
    setAcknowledged(false);
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const { error } = await openDispute(bookingId, reason.trim());
    setSubmitting(false);
    if (error) {
      toast.error(tr.disputeDialog.failed);
      return;
    }
    toast.success(tr.disputeDialog.submitted);
    reset();
    onSubmitted?.();
    onClose();
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={tr.disputeDialog.title}
      footer={
        <ActionBar>
          <Button title={tr.common.cancel} variant="secondary" onPress={close} />
          <Button
            title={tr.disputeDialog.submit}
            disabled={!canSubmit || submitting}
            loading={submitting}
            onPress={submit}
          />
        </ActionBar>
      }
    >
      <View style={styles.body}>
        <View style={styles.warnCard}>
          <View style={styles.warnBadge}>
            <Text style={styles.warnBadgeText} allowFontScaling={false}>
              !
            </Text>
          </View>
          <View style={styles.warnTexts}>
            <Text style={styles.warnTitle}>{tr.disputeDialog.important}</Text>
            <Text style={styles.warnText}>{tr.disputeDialog.importantText}</Text>
          </View>
        </View>

        <Text style={styles.description}>{tr.disputeDialog.description}</Text>

        <TextInput
          style={styles.textArea}
          multiline
          value={reason}
          onChangeText={setReason}
          placeholder={tr.disputeDialog.reasonPlaceholder}
          placeholderTextColor={t.colors.textMuted}
          maxLength={500}
        />

        <Pressable style={styles.acceptRow} onPress={() => setAcknowledged(!acknowledged)}>
          <Checkbox checked={acknowledged} onChange={setAcknowledged} />
          <Text style={styles.acceptText}>{tr.disputeDialog.acknowledge}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    body: {
      gap: spacing.xl,
      paddingBottom: spacing.xl,
    },
    warnCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
      padding: spacing.lg,
    },
    warnBadge: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: t.colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warnBadgeText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      lineHeight: 18,
      color: '#FFFFFF',
    },
    warnTexts: {
      flex: 1,
      gap: spacing.xs,
    },
    warnTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.orange,
    },
    warnText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    description: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.textMuted,
    },
    textArea: {
      height: 96,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeDark,
      backgroundColor: t.colors.background,
      fontFamily: fonts.medium,
      fontSize: 16,
      color: t.colors.text,
      textAlignVertical: 'top',
    },
    acceptRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    acceptText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
  });
