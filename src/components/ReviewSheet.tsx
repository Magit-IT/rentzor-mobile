/**
 * Figma: Comment drawer (293:13550) — "Ijarani baholang" bottom sheet shown
 * after the renter starts the return: public review (required star rating +
 * optional comment, visible to everyone) and a hidden comment only the owner
 * sees. Mirrors web's ReviewForm: one public `reviews` row, plus a private
 * row when the hidden comment is filled in.
 */
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { supabase } from '../integrations/supabase/client';
import { fonts, radius, spacing, Theme } from '../theme';
import { ActionBar } from './ActionBar';
import { AppIcon } from './AppIcon';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { RatingStars } from './RatingStars';
import { useToast } from './Toast';

export interface ReviewSheetProps {
  visible: boolean;
  bookingId: string;
  itemId: string | null;
  ownerId: string | null;
  onClose: () => void;
  /** Called after the review rows are saved. */
  onSubmitted?: () => void;
}

export function ReviewSheet({
  visible,
  bookingId,
  itemId,
  ownerId,
  onClose,
  onSubmitted,
}: ReviewSheetProps) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [privateComment, setPrivateComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // The private input sits at the bottom of the sheet; once the keyboard has
  // shrunk the sheet, scroll it into view (twice — the second pass lands
  // after the keyboard-driven relayout settles).
  const revealPrivateInput = () => {
    const toEnd = () => scrollRef.current?.scrollToEnd({ animated: true });
    setTimeout(toEnd, 250);
    setTimeout(toEnd, 650);
  };

  const submit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const reviewerId = userData.user?.id;
      if (!reviewerId) throw new Error('Not signed in');

      const base = {
        booking_id: bookingId,
        item_id: itemId,
        reviewee_id: ownerId,
        reviewer_id: reviewerId,
        review_type: 'renter_to_owner',
        rating,
      };
      const { error: publicError } = await supabase.from('reviews').insert({
        ...base,
        comment: comment.trim().slice(0, 1000),
        visibility: 'public',
      });
      if (publicError) throw publicError;

      if (privateComment.trim()) {
        const { error: privateError } = await supabase.from('reviews').insert({
          ...base,
          comment: privateComment.trim().slice(0, 1000),
          visibility: 'private',
        });
        if (privateError) throw privateError;
      }

      toast.success(tr.reviewSheet.submitted);
      onSubmitted?.();
      onClose();
    } catch (e) {
      console.error('[review] submit failed:', e);
      toast.error(tr.reviewSheet.failed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={tr.reviewSheet.title}
      scrollRef={scrollRef}
      footer={
        <ActionBar>
          <Button
            title={tr.reviewSheet.submit}
            disabled={rating === 0}
            loading={submitting}
            onPress={submit}
          />
        </ActionBar>
      }
    >
      <View style={styles.body}>
        <View style={styles.sectionRow}>
          <AppIcon name="eye" color={t.colors.primary} />
          <Text style={styles.sectionText}>{tr.reviewSheet.publicLabel}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            {tr.reviewSheet.ratingLabel}
            <Text style={styles.required}>*</Text>
          </Text>
          <RatingStars rating={rating} size={40} onChange={setRating} style={styles.stars} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{tr.reviewSheet.commentLabel}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder={tr.reviewSheet.commentPlaceholder}
            placeholderTextColor={t.colors.textMuted}
            maxLength={1000}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionRow}>
          <AppIcon name="eyeOff" color={t.colors.text} />
          <Text style={styles.sectionText}>{tr.reviewSheet.privateSection}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{tr.reviewSheet.privateLabel}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={privateComment}
            onChangeText={setPrivateComment}
            onFocus={revealPrivateInput}
            placeholder={tr.reviewSheet.privatePlaceholder}
            placeholderTextColor={t.colors.textMuted}
            maxLength={1000}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    body: {
      gap: spacing.xxl,
      paddingBottom: spacing.xl,
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionText: {
      fontFamily: fonts.medium,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.textMuted,
    },
    field: { gap: spacing.xs },
    fieldLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    required: { color: t.colors.critical },
    stars: { gap: 20, marginTop: spacing.sm },
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
    divider: {
      height: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: t.colors.strokeDark,
    },
  });
