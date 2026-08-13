/**
 * Figma: Owner — E'lon 1–5/5 (2144:10005, 2144:10065, 2145:10081,
 * 2145:10139, 2145:10200) — the 5-step listing wizard: Asosiy → Narxlash →
 * Rasmlar → Holat rasmlari → Tekshirish. Mirrors rentzor-owner's
 * ListItemPage flow: a draft item row is created after step 1, pricing is
 * synced after step 2, photos upload straight to the draft, and submitting
 * flips the item to status "pending" for admin review.
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, Button, Input, PageHeader } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { useToast } from '../../components/Toast';
import { Chevron } from '../../components/icons';
import { useT } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useCategories } from '../../hooks/useCategories';
import { useSubcategories } from '../../hooks/useSubcategories';
import { supabase } from '../../integrations/supabase/client';
import { PickedPhoto } from '../../lib/bookingPhotos';
import { formatDailyPrice, formatSum } from '../../lib/format';
import { uploadItemPhoto } from '../../lib/itemUpload';
import { consumePickedPickupLocation } from '../../lib/pickupLocation';
import { fonts, press, radius, spacing, Theme } from '../../theme';

const MAX_PHOTOS = 5;
// Same minimums the web wizard enforces (rentzor-owner ListItemPage zod schema).
const MIN_PRICE = 1_000;
const MIN_EQUIPMENT_VALUE = 10_000;

interface UploadedPhoto {
  rowId: string;
  url: string;
}

/** "150 000" -> 150000; keeps only digits. */
const parseSum = (s: string) => Number(s.replace(/\D/g, '') || 0);

export default function NewListingScreen() {
  const t = useTheme();
  const tr = useT();
  const w = tr.owner.wizard;
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useProfile();

  const toast = useToast();
  const { draftId: draftParam } = useLocalSearchParams<{ draftId?: string }>();
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(!!draftParam);
  const [busy, setBusy] = useState(false);
  // Set after a failed "Keyingi" press: invalid fields go red, the message
  // itself shows as a toast (no Alert dialogs — user request).
  const [showErrors, setShowErrors] = useState(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [subSlug, setSubSlug] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<'category' | 'subcategory' | null>(null);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [pickupInstructions, setPickupInstructions] = useState('');
  const { categories } = useCategories();
  const { subcategories } = useSubcategories(categorySlug ?? '');

  // Opened from a "Qoralama" row: load the draft and resume at the furthest
  // step the owner reached (photos > pricing > basics), like the web wizard.
  React.useEffect(() => {
    if (!draftParam) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: item, error }, { data: images }] = await Promise.all([
          supabase
            .from('items')
            .select(
              'id, title, description, category, subcategory, location, latitude, longitude, pickup_instructions, price_per_day, equipment_value',
            )
            .eq('id', draftParam)
            .single(),
          supabase
            .from('item_images')
            .select('id, image_url, image_type, image_order')
            .eq('item_id', draftParam)
            .order('image_order', { ascending: true }),
        ]);
        if (error || !item || cancelled) return;

        setDraftId(item.id);
        setTitle(item.title === 'Draft' ? '' : item.title);
        setDescription(item.description === 'Draft listing' ? '' : (item.description ?? ''));
        setCategorySlug(item.category || null);
        setSubSlug(item.subcategory);
        setLocation(item.location ?? '');
        if (item.latitude != null && item.longitude != null) {
          setCoords({ lat: item.latitude, lon: item.longitude });
        }
        setPickupInstructions(item.pickup_instructions ?? '');
        // The minimums are also the placeholder amounts ensureDraft writes
        // before the pricing step — treat them as "not entered yet".
        const pricingSet =
          item.price_per_day > MIN_PRICE || item.equipment_value > MIN_EQUIPMENT_VALUE;
        if (pricingSet) {
          setDailyPrice(String(item.price_per_day));
          setEquipmentValue(String(item.equipment_value));
        }
        const display = (images ?? [])
          .filter((img) => img.image_type === 'display')
          .map((img) => ({ rowId: img.id, url: img.image_url }));
        const condition = (images ?? [])
          .filter((img) => img.image_type === 'condition')
          .map((img) => ({ rowId: img.id, url: img.image_url }));
        setDisplayPhotos(display);
        setConditionPhotos(condition);

        if (condition.length > 0) setStep(5);
        else if (display.length > 0) setStep(4);
        else if (pricingSet) setStep(3);
        else setStep(2);
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftParam]);

  // Pick up the map screen's result when this screen regains focus.
  useFocusEffect(
    React.useCallback(() => {
      const place = consumePickedPickupLocation();
      if (place) {
        setLocation(place.city ? `${place.name}, ${place.city}` : place.name);
        setCoords({ lat: place.lat, lon: place.lon });
      }
    }, []),
  );
  // Step 2
  const [dailyPrice, setDailyPrice] = useState('');
  const [equipmentValue, setEquipmentValue] = useState('');
  // Steps 3–4
  const [displayPhotos, setDisplayPhotos] = useState<UploadedPhoto[]>([]);
  const [conditionPhotos, setConditionPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const categoryName = categorySlug ? (tr.categoryNames[categorySlug] ?? categorySlug) : '';
  const subName = subSlug ? (tr.subcategoryNames[subSlug] ?? subSlug) : '';

  /** Red border (no inline text — the message lives in the toast). */
  const fieldError = (invalid: boolean) => (showErrors && invalid ? '' : undefined);

  const stepValid = () => {
    switch (step) {
      case 1:
        return title.trim() !== '' && description.trim() !== '' && !!categorySlug && location.trim() !== '';
      case 2:
        return parseSum(dailyPrice) >= MIN_PRICE && parseSum(equipmentValue) >= MIN_EQUIPMENT_VALUE;
      case 3:
        return displayPhotos.length > 0;
      case 4:
        return conditionPhotos.length > 0;
      default:
        return true;
    }
  };

  /** Creates the draft items row when leaving step 1 (mirrors the web flow). */
  const ensureDraft = async (): Promise<string> => {
    if (draftId) return draftId;
    const { data, error } = await supabase
      .from('items')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category: categorySlug!,
        subcategory: subSlug,
        location: location.trim(),
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
        pickup_instructions: pickupInstructions.trim() || null,
        price_per_day: parseSum(dailyPrice) || MIN_PRICE,
        equipment_value: parseSum(equipmentValue) || MIN_EQUIPMENT_VALUE,
        slug: '',
        deposit_amount: 0,
        owner_id: userId,
        status: 'draft',
      })
      .select('id')
      .single();
    if (error) throw error;
    setDraftId(data.id);
    return data.id;
  };

  const invalidStepMessage = () => {
    if (step === 3 || step === 4) return w.minPhoto;
    if (step === 2) {
      return parseSum(dailyPrice) < MIN_PRICE ? w.minPriceError : w.minValueError;
    }
    return w.fillRequired;
  };

  const next = async () => {
    if (!stepValid()) {
      setShowErrors(true);
      toast.error(invalidStepMessage());
      return;
    }
    if (busy || uploadingCount > 0) return;
    setBusy(true);
    try {
      if (step === 1) await ensureDraft();
      if (step === 2 && draftId) {
        await supabase
          .from('items')
          .update({
            price_per_day: parseSum(dailyPrice),
            equipment_value: parseSum(equipmentValue),
            pickup_instructions: pickupInstructions.trim() || null,
          })
          .eq('id', draftId);
      }
      setShowErrors(false);
      setStep((s) => Math.min(s + 1, 5));
    } catch {
      toast.error(w.submitError);
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const pickPhotos = async (type: 'display' | 'condition') => {
    const photos = type === 'display' ? displayPhotos : conditionPhotos;
    const setPhotos = type === 'display' ? setDisplayPhotos : setConditionPhotos;
    if (photos.length >= MAX_PHOTOS + (type === 'condition' ? 1 : 0)) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (result.canceled) return;

    const itemId = draftId ?? (await ensureDraft());
    const picked: PickedPhoto[] = result.assets.map((a) => ({
      uri: a.uri,
      mimeType: a.mimeType,
      fileName: a.fileName,
    }));

    setUploadingCount((n) => n + picked.length);
    let order = photos.length;
    for (const photo of picked) {
      try {
        const url = await uploadItemPhoto(itemId, photo);
        const { data, error } = await supabase
          .from('item_images')
          .insert({
            item_id: itemId,
            image_url: url,
            image_type: type,
            is_primary: type === 'display' && order === 0,
            image_order: order,
          })
          .select('id')
          .single();
        if (error) throw error;
        order += 1;
        setPhotos((prev) => [...prev, { rowId: data.id, url }]);
      } catch {
        toast.error(w.uploadError);
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  };

  const removePhoto = async (type: 'display' | 'condition', photo: UploadedPhoto) => {
    const setPhotos = type === 'display' ? setDisplayPhotos : setConditionPhotos;
    setPhotos((prev) => prev.filter((p) => p.rowId !== photo.rowId));
    await supabase.from('item_images').delete().eq('id', photo.rowId);
  };

  const submit = async () => {
    if (busy || !draftId) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({
          title: title.trim(),
          description: description.trim(),
          category: categorySlug!,
          subcategory: subSlug,
          location: location.trim(),
          latitude: coords?.lat ?? null,
          longitude: coords?.lon ?? null,
          pickup_instructions: pickupInstructions.trim() || null,
          price_per_day: parseSum(dailyPrice),
          equipment_value: parseSum(equipmentValue),
          status: 'pending',
          // Resubmitting a rejected listing clears the old rejection note.
          rejection_reason: null,
        })
        .eq('id', draftId);
      if (error) throw error;
      toast.success(w.submittedTitle);
      router.back();
    } catch {
      toast.error(w.submitError);
    } finally {
      setBusy(false);
    }
  };

  // Fixed cell size (Figma ~111×95): 3 per row inside the screen padding.
  const { width: winW } = useWindowDimensions();
  const cellW = Math.floor((winW - spacing.screenX * 2 - spacing.md * 2) / 3);
  const cellSize = { width: cellW, height: Math.round(cellW * 0.86) };

  const photoGrid = (type: 'display' | 'condition') => {
    const photos = type === 'display' ? displayPhotos : conditionPhotos;
    const slots = Math.max(6, photos.length + 1);
    return (
      <View style={styles.photoGrid}>
        {Array.from({ length: slots }).map((_, i) => {
          const photo = photos[i];
          if (photo) {
            return (
              <Pressable
                key={photo.rowId}
                style={[styles.photoCell, cellSize]}
                onLongPress={() => removePhoto(type, photo)}
              >
                <Image source={{ uri: photo.url }} style={styles.photoImage} />
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(type, photo)}>
                  <Text style={styles.photoRemoveText}>×</Text>
                </Pressable>
              </Pressable>
            );
          }
          const isNext = i === photos.length;
          return (
            <Pressable
              key={`empty-${i}`}
              style={({ pressed }) => [
                styles.photoCell,
                cellSize,
                styles.photoEmpty,
                pressed && press.dim,
              ]}
              disabled={!isNext || photos.length >= MAX_PHOTOS}
              onPress={() => pickPhotos(type)}
            >
              {isNext && uploadingCount > 0 ? (
                <ActivityIndicator color={t.colors.primary} />
              ) : (
                <AppIcon name="plus" color={t.gray[40]} size={24} />
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const reviewRow = (label: string, value: string) => (
    <View style={styles.reviewRow} key={label}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PageHeader title={w.title} onBack={back} />

      {/* Step indicator — 5 segments, filled up to the current step. */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View key={s} style={[styles.stepSegment, s <= step && styles.stepSegmentActive]} />
        ))}
      </View>

      {loadingDraft ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <>
      {/* Keyboard-aware so the focused field scrolls above the keyboard. */}
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={spacing.xl}
      >
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>{w.step1Title}</Text>
            <Input
              label={w.nameLabel}
              placeholder={w.namePlaceholder}
              value={title}
              onChangeText={setTitle}
              error={fieldError(title.trim() === '')}
            />
            <Input
              label={w.descLabel}
              description={w.descHelp}
              placeholder={w.descPlaceholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.multiline}
              error={fieldError(description.trim() === '')}
            />
            <View>
              <Text style={styles.fieldLabel}>{w.categoryLabel}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.selectField,
                  showErrors && !categorySlug && styles.selectFieldError,
                  pressed && press.dim,
                ]}
                onPress={() => setOpenSheet('category')}
              >
                <Text style={categorySlug ? styles.selectValue : styles.selectPlaceholder}>
                  {categorySlug ? categoryName : w.categoryPlaceholder}
                </Text>
                <Chevron direction="down" size={20} color={t.gray[40]} />
              </Pressable>
            </View>
            {categorySlug && subcategories.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>{w.subcategoryLabel}</Text>
                <Pressable
                  style={({ pressed }) => [styles.selectField, pressed && press.dim]}
                  onPress={() => setOpenSheet('subcategory')}
                >
                  <Text style={subSlug ? styles.selectValue : styles.selectPlaceholder}>
                    {subSlug ? subName : w.subcategoryPlaceholder}
                  </Text>
                  <Chevron direction="down" size={20} color={t.gray[40]} />
                </Pressable>
              </View>
            )}
            <View>
              <Text style={styles.fieldLabel}>{w.locationLabel}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.selectField,
                  showErrors && location.trim() === '' && styles.selectFieldError,
                  pressed && press.dim,
                ]}
                onPress={() => router.push('/(owner)/pick-location')}
              >
                <Text
                  style={location ? styles.selectValue : styles.selectPlaceholder}
                  numberOfLines={1}
                >
                  {location || w.locationPlaceholder}
                </Text>
                <AppIcon name="locationPin" color={t.gray[40]} size={20} />
              </Pressable>
            </View>
            <Input
              label={w.pickupLabel}
              placeholder={w.pickupPlaceholder}
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
              multiline
              numberOfLines={4}
              style={styles.multiline}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>{w.step2Title}</Text>
            <View style={styles.warnCard}>
              <Text style={styles.warnTitle}>{w.priceWarnTitle}</Text>
              <Text style={styles.warnLine}>• {w.priceWarn1}</Text>
              <Text style={styles.warnLine}>• {w.priceWarn2}</Text>
            </View>
            <Input
              label={w.dailyPriceLabel}
              placeholder="150 000"
              value={dailyPrice}
              onChangeText={setDailyPrice}
              keyboardType="numeric"
              error={
                showErrors && parseSum(dailyPrice) < MIN_PRICE ? w.minPriceError : undefined
              }
            />
            <Input
              label={w.valueLabel}
              placeholder="5 000 000"
              value={equipmentValue}
              onChangeText={setEquipmentValue}
              keyboardType="numeric"
              error={
                showErrors && parseSum(equipmentValue) < MIN_EQUIPMENT_VALUE
                  ? w.minValueError
                  : undefined
              }
            />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{w.summaryTitle}</Text>
              {reviewRow(w.summaryDaily, formatSum(parseSum(dailyPrice)))}
              {reviewRow(w.summaryWeekly, formatSum(parseSum(dailyPrice) * 7))}
              {reviewRow(w.summaryValue, formatSum(parseSum(equipmentValue)))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>{w.step3Title}</Text>
            <Text style={styles.stepHelp}>{w.step3Help}</Text>
            {photoGrid('display')}
            <Text style={styles.photoNote}>{w.step3Note}</Text>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>{w.step4Title}</Text>
            <Text style={styles.stepHelp}>{w.step4Help}</Text>
            {photoGrid('condition')}
            <View style={styles.warnCard}>
              <Text style={styles.warnTitle}>{w.tipsTitle}</Text>
              {w.tips.map((tip) => (
                <Text key={tip} style={styles.warnLine}>
                  • {tip}
                </Text>
              ))}
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.stepTitle}>{w.step5Title}</Text>
            <View style={styles.previewCard}>
              {displayPhotos[0] && (
                <Image source={{ uri: displayPhotos[0].url }} style={styles.previewImage} />
              )}
              <Text style={styles.previewTitle}>{title}</Text>
              <Text style={styles.previewPrice}>{formatDailyPrice(parseSum(dailyPrice))}</Text>
            </View>
            <View style={styles.summaryCard}>
              {reviewRow(w.reviewCategory, subName ? `${categoryName} · ${subName}` : categoryName)}
              {reviewRow(w.reviewLocation, location)}
              {reviewRow(w.reviewValue, formatSum(parseSum(equipmentValue)))}
              {reviewRow(w.reviewDisplay, `${displayPhotos.length} ${w.countSuffix}`.trim())}
              {reviewRow(w.reviewCondition, `${conditionPhotos.length} ${w.countSuffix}`.trim())}
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Orqaga / Keyingi action bar pinned to the bottom (Figma bottom bar). */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && press.dim]} onPress={back}>
          <Text style={styles.backButtonText}>{w.back}</Text>
        </Pressable>
        <Button
          title={step === 5 ? w.submit : w.next}
          loading={busy}
          disabled={uploadingCount > 0}
          onPress={step === 5 ? submit : next}
          style={styles.nextButton}
        />
      </View>
        </>
      )}

      {/* Flat option pickers — one for the category, one for its subcategories. */}
      <BottomSheet
        visible={openSheet === 'category'}
        onClose={() => setOpenSheet(null)}
        title={w.categoryLabel}
      >
        {categories.map((c) => (
          <Pressable
            key={c.slug}
            style={({ pressed }) => [styles.optionRow, pressed && press.dim]}
            onPress={() => {
              if (c.slug !== categorySlug) setSubSlug(null);
              setCategorySlug(c.slug);
              setOpenSheet(null);
            }}
          >
            <Text
              style={[styles.optionLabel, c.slug === categorySlug && styles.optionLabelActive]}
              numberOfLines={1}
            >
              {tr.categoryNames[c.slug] ?? c.name}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'subcategory'}
        onClose={() => setOpenSheet(null)}
        title={w.subcategoryLabel}
      >
        {subcategories.map((s) => (
          <Pressable
            key={s.slug}
            style={({ pressed }) => [styles.optionRow, pressed && press.dim]}
            onPress={() => {
              setSubSlug(s.slug);
              setOpenSheet(null);
            }}
          >
            <Text
              style={[styles.optionLabel, s.slug === subSlug && styles.optionLabelActive]}
              numberOfLines={1}
            >
              {tr.subcategoryNames[s.slug] ?? s.name}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    stepIndicator: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.sm,
    },
    stepSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.gray[20],
    },
    stepSegmentActive: {
      backgroundColor: t.colors.primary,
    },
    content: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      paddingHorizontal: spacing.screenX,
      gap: spacing.lg,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepTitle: {
      fontFamily: fonts.bold,
      fontSize: 18,
      lineHeight: 28,
      color: t.colors.text,
    },
    stepHelp: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
      marginTop: -spacing.sm,
    },
    multiline: {
      height: 96,
      textAlignVertical: 'top',
    },
    fieldLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
      marginBottom: spacing.xs,
    },
    selectField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeDark,
      backgroundColor: t.colors.backgroundSecondary,
    },
    selectFieldError: {
      borderColor: t.colors.critical,
    },
    optionRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.strokeLight,
    },
    optionLabel: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    optionLabelActive: {
      fontFamily: fonts.semiBold,
      color: t.colors.primary,
    },
    selectValue: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    selectPlaceholder: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: t.gray[40],
    },
    warnCard: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.base,
      backgroundColor: t.colors.surfaceActive,
    },
    warnTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.orange,
    },
    warnLine: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
    },
    previewCard: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    previewImage: {
      width: '100%',
      height: 180,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      backgroundColor: t.gray[10],
    },
    previewTitle: {
      fontFamily: fonts.bold,
      fontSize: 18,
      lineHeight: 26,
      color: t.colors.text,
    },
    previewPrice: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.primary,
    },
    summaryCard: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
    },
    summaryTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      lineHeight: 22,
      color: t.colors.text,
    },
    reviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    reviewLabel: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    reviewValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    photoCell: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    photoEmpty: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.gray[30],
      backgroundColor: t.colors.backgroundSecondary,
    },
    photoImage: {
      width: '100%',
      height: '100%',
    },
    photoRemove: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    photoRemoveText: {
      color: '#FFFFFF',
      fontSize: 14,
      lineHeight: 16,
      fontFamily: fonts.semiBold,
    },
    photoNote: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textMuted,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
    },
    backButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
    },
    backButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    nextButton: {
      flex: 1,
    },
  });
