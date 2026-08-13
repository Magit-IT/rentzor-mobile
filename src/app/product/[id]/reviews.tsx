/**
 * Figma: Booking flow (payment) / Barcha izohlar — reviews page for a
 * product: back header, rating summary card (5 stars + score + count),
 * and the full list of review cards.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, PageScrollView } from '../../../components';
import { ProductIcon } from '../../../components/ProductIcon';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { supabase } from '../../../integrations/supabase/client';
import type { ItemReview } from '../../../hooks/useItem';
import { relativeTime } from '../../../lib/relativeTime';
import { fonts, radius, spacing, Theme } from '../../../theme';

/** Comments longer than this collapse behind "Ko‘proq o‘qish". */
const PREVIEW_LENGTH = 140;

function ReviewCard({ review }: { review: ItemReview }) {
  const t = useTheme();
  const { language, t: tr } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const [expanded, setExpanded] = useState(false);

  const comment = review.comment ?? '';
  const collapsible = comment.length > PREVIEW_LENGTH;
  const shownText =
    collapsible && !expanded ? `${comment.slice(0, PREVIEW_LENGTH).trimEnd()}... ` : comment;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthorRow}>
          {review.reviewer?.avatar_url ? (
            <Image source={{ uri: review.reviewer.avatar_url }} style={styles.reviewAvatar} />
          ) : (
            <View style={[styles.reviewAvatar, styles.reviewAvatarFallback]}>
              <Text style={styles.reviewAvatarInitial}>
                {(review.reviewer?.full_name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.reviewAuthorTexts}>
            <Text style={styles.reviewAuthor} numberOfLines={1}>
              {review.reviewer?.full_name ?? '—'}
            </Text>
            <Text style={styles.reviewDate}>{relativeTime(review.created_at, language)}</Text>
          </View>
        </View>
        {review.rating != null && (
          <View style={styles.scoreRow}>
            <ProductIcon name="star" color={t.colors.warning} />
            <Text style={styles.scoreText}>{review.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {comment !== '' && (
        <Text style={styles.reviewText}>
          {shownText}
          {collapsible && (
            <Text style={styles.readMore} onPress={() => setExpanded(!expanded)}>
              {expanded ? tr.common.readLess : tr.common.readMore}
            </Text>
          )}
        </Text>
      )}
    </View>
  );
}

export default function ProductReviewsScreen() {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [reviews, setReviews] = useState<ItemReview[] | null>(null);

  // Same public renter_to_owner review query the product screen uses.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer:public_profiles!reviewer_id(full_name, avatar_url)')
        .eq('item_id', id)
        .eq('visibility', 'public')
        .eq('review_type', 'renter_to_owner')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) console.error('[reviews] load failed:', error);
      setReviews((data ?? []) as unknown as ItemReview[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rated = (reviews ?? []).filter((r) => r.rating != null);
  const average = rated.length
    ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={tr.reviews.title} onBack={() => router.back()} />

      {reviews == null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <PageScrollView style={styles.scrollArea} contentContainerStyle={styles.scroll}>
          {/* Rating summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <ProductIcon
                    key={i}
                    name="star"
                    color={i < Math.round(average ?? 0) ? t.colors.warning : t.gray[20]}
                    size={32}
                  />
                ))}
              </View>
              <Text style={styles.summaryScore}>{average != null ? average.toFixed(1) : '—'}</Text>
            </View>
            <Text style={styles.summaryCount}>{tr.reviews.countLabel(reviews.length)}</Text>
          </View>

          {/* Reviews */}
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </PageScrollView>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: t.gray[0],
  },
  scroll: {
    padding: spacing.screenX,
    gap: spacing.md,
  },
  summaryCard: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryStars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryScore: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: t.colors.text,
  },
  summaryCount: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  reviewCard: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    padding: spacing.lg,
    gap: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // Shrink (ellipsize the name) instead of pushing the score off-card.
    flex: 1,
  },
  reviewAuthorTexts: { flex: 1 },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reviewAvatarFallback: {
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarInitial: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: t.colors.textMuted,
  },
  reviewAuthor: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  reviewDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  reviewText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: t.gray[70],
  },
  readMore: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
});
