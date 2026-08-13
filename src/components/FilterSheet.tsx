/**
 * Figma: Filter (293:12159) — bottom drawer over the search screen: category
 * row, "Narx" price range slider, "Dan"/"Gacha" date fields, "Masofa"
 * distance input, "Reyting" star rating, Tozalash/Qo'llash action bar.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useT } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PRICE_MAX, PRICE_MIN, FilterState } from '../hooks/useFilters';
import { groupDigits } from '../lib/format';
import { fonts, press, radius, spacing } from '../theme';
import { ActionBar } from './ActionBar';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { CategoryPickerSheet } from './CategoryPickerSheet';
import { DateField } from './DateField';
import { Chevron, StarOutlineIcon } from './icons';
import { PriceRangeSlider } from './PriceRangeSlider';

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  onApply: () => void;
}

export function FilterSheet({
  visible,
  onClose,
  value,
  onChange,
  onReset,
  onApply,
}: FilterSheetProps) {
  const t = useTheme();
  const tr = useT();
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  // The sheet has no KeyboardAvoidingView, so when the Masofa number input is
  // focused we grow a spacer at the bottom of the body (= keyboard height) and
  // scroll to it, lifting the input above the keyboard. Collapsed otherwise.
  const [distanceFocused, setDistanceFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const distanceBoxRef = useRef<View>(null);
  const { height: windowHeight } = useWindowDimensions();

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

  // Closing the sheet mid-focus unmounts the input without firing onBlur,
  // which would leave a stale spacer on the next open — reset on every
  // visibility change so the spacer only ever exists for a live keyboard.
  useEffect(() => {
    setDistanceFocused(false);
    setKeyboardHeight(0);
  }, [visible]);

  // Scroll by exactly the amount the keyboard overlaps the Masofa box — not
  // scrollToEnd, which overshoots by the spacer's unused remainder and hides
  // the top of the sheet. The content fits its viewport before the keyboard
  // opens (PageScrollView pins the offset at 0 then), so the measured overlap
  // IS the absolute target offset.
  useEffect(() => {
    if (!distanceFocused || keyboardHeight === 0) return;
    const id = setTimeout(() => {
      distanceBoxRef.current?.measureInWindow((_x, y, _w, h) => {
        const overlap = y + h + spacing.xl - (windowHeight - keyboardHeight);
        if (overlap > 0) scrollRef.current?.scrollTo({ y: overlap, animated: true });
      });
    }, 80);
    return () => clearTimeout(id);
  }, [distanceFocused, keyboardHeight, windowHeight]);

  const patch = (partial: Partial<FilterState>) => onChange({ ...value, ...partial });

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={tr.filter.title}
      scrollRef={scrollRef}
      footer={
        <ActionBar>
          <Button title={tr.filter.reset} variant="secondary" onPress={onReset} />
          <Button
            title={tr.filter.apply}
            onPress={() => {
              onApply();
              onClose();
            }}
          />
        </ActionBar>
      }
    >
      <View style={styles.body}>
        <Pressable
          onPress={() => setCategoryPickerOpen(true)}
          style={({ pressed }) => [styles.row, pressed && press.dim]}
        >
          <Text style={[styles.rowLabel, { color: t.colors.text }]} numberOfLines={1}>
            {tr.filter.categories}
          </Text>
          {value.category != null && (
            <Text style={[styles.rowValue, { color: t.gray[50] }]} numberOfLines={1}>
              {value.category.name}
            </Text>
          )}
          <Chevron direction="right" size={24} color={t.colors.text} />
        </Pressable>

        <CategoryPickerSheet
          visible={categoryPickerOpen}
          onClose={() => setCategoryPickerOpen(false)}
          title={tr.filter.title}
          resetLabel={tr.filter.reset}
          applyLabel={tr.filter.apply}
          onSelect={(category) => patch({ category })}
          onReset={() => patch({ category: null })}
        />

        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: t.gray[70] }]}>{tr.filter.price}</Text>
          <PriceRangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            valueMin={value.priceMin}
            valueMax={value.priceMax}
            step={5000}
            formatLabel={(v) => `${groupDigits(v)} so‘m`}
            onChange={(priceMin, priceMax) => patch({ priceMin, priceMax })}
          />
        </View>

        <View style={styles.dateRow}>
          <DateField
            label={tr.filter.from}
            placeholder={tr.filter.datePlaceholder}
            value={value.dateFrom}
            maximumDate={value.dateTo ?? undefined}
            onChange={(dateFrom) => patch({ dateFrom })}
          />
          <DateField
            label={tr.filter.to}
            placeholder={tr.filter.datePlaceholder}
            value={value.dateTo}
            minimumDate={value.dateFrom ?? undefined}
            onChange={(dateTo) => patch({ dateTo })}
          />
        </View>

        <View style={styles.block}>
          <Text style={[styles.fieldLabel, { color: t.colors.text }]}>{tr.filter.distance}</Text>
          <View ref={distanceBoxRef} style={[styles.distanceBox, { borderColor: t.colors.strokeDark }]}>
            <TextInput
              style={[styles.distanceInput, { color: t.colors.text }]}
              value={value.distanceKm > 0 ? String(value.distanceKm) : ''}
              onChangeText={(text) => {
                const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
                patch({ distanceKm: digits === '' ? 0 : Number(digits) });
              }}
              onFocus={() => setDistanceFocused(true)}
              onBlur={() => setDistanceFocused(false)}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={t.colors.textMuted}
              maxLength={4}
            />
            <Text style={{ color: t.colors.primary, fontFamily: fonts.semiBold, fontSize: 16 }}>
              Km
            </Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: t.gray[90] }]}>{tr.filter.rating}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => patch({ rating: value.rating === star ? 0 : star })}
                hitSlop={4}
                style={({ pressed }) => pressed && press.dim}
              >
                <StarOutlineIcon
                  size={40}
                  filled={star <= value.rating}
                  color={star <= value.rating ? t.colors.warning : t.gray[20]}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Grows to the keyboard's height only while the distance input is
            focused, so the sheet can scroll it clear of the keyboard. */}
        <View style={{ height: distanceFocused ? keyboardHeight : 0 }} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.xxl, paddingBottom: spacing.sm  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  rowValue: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  block: { gap: spacing.md },
  blockLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  distanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  distanceInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    padding: 0, // strip the TextInput's default padding so box height matches the date fields
  },
  starsRow: { flexDirection: 'row', gap: spacing.md },
});
