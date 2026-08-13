/**
 * Figma: Filter kategoriya (293:12223 collapsed, 293:12255 expanded) — an
 * accordion category picker opened from the Filter sheet's "Kategoriyalar"
 * row. Each top-level category is a row with a chevron that only expands
 * or collapses it in place to show its subcategories (indented, gray text,
 * no chevron) — the category itself is never a selectable filter value,
 * only its subcategories are. Selecting a subcategory closes the picker and
 * returns to the Filter sheet, which then shows the picked name inline
 * (293:12191).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Category, useCategories } from '../hooks/useCategories';
import { SelectedCategory } from '../hooks/useFilters';
import { Subcategory, useSubcategories } from '../hooks/useSubcategories';
import { fonts, press, radius, spacing } from '../theme';
import { ActionBar } from './ActionBar';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Chevron } from './icons';

export interface CategoryPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  resetLabel: string;
  applyLabel: string;
  onSelect: (category: SelectedCategory) => void;
  onReset: () => void;
}

function CategoryRow({
  category,
  expanded,
  onToggle,
  onSelect,
}: {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (item: SelectedCategory) => void;
}) {
  const t = useTheme();
  const tr = useT();
  // Only fetched once the row is expanded — mirrors the category screen's
  // useSubcategories usage, scoped per-row instead of one shared fetch.
  const { subcategories } = useSubcategories(expanded ? category.slug : '');

  return (
    <View style={styles.rowGroup}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.row, pressed && press.dim]}
      >
        <Text style={[styles.rowLabel, { color: t.colors.text }]} numberOfLines={1}>
          {tr.categoryNames[category.slug] ?? category.name}
        </Text>
        <Chevron direction={expanded ? 'up' : 'down'} size={24} color={t.colors.text} />
      </Pressable>
      {expanded &&
        subcategories.map((sub: Subcategory) => {
          const name = tr.subcategoryNames[sub.slug] ?? sub.name;
          return (
            <Pressable
              key={sub.id}
              onPress={() => onSelect({ parentSlug: category.slug, slug: sub.slug, name })}
              style={({ pressed }) => [styles.subRow, pressed && press.dim]}
            >
              <Text style={[styles.subRowLabel, { color: t.gray[50] }]} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}

export function CategoryPickerSheet({
  visible,
  onClose,
  title,
  resetLabel,
  applyLabel,
  onSelect,
  onReset,
}: CategoryPickerSheetProps) {
  const { categories } = useCategories();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const select = (category: SelectedCategory) => {
    onSelect(category);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      fillHeight
      footer={
        <ActionBar>
          <Button
            title={resetLabel}
            variant="secondary"
            onPress={() => {
              onReset();
              onClose();
            }}
          />
          <Button title={applyLabel} onPress={onClose} />
        </ActionBar>
      }
    >
      <View style={styles.body}>
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            expanded={expandedId === category.id}
            onToggle={() => setExpandedId((id) => (id === category.id ? null : category.id))}
            onSelect={select}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 0, paddingBottom: spacing.sm },
  rowGroup: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  subRow: {
    paddingLeft: spacing.lg,
    paddingVertical: spacing.md,
  },
  subRowLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
