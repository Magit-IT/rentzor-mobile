/**
 * Figma: Filter / "Dan"/"Gacha" date inputs (293:12190;746:6626;747:10579,
 * 747:10580) — a tappable date box with the Calendar Search icon. Tapping it
 * opens a themed, in-app calendar in a BottomSheet (react-native-calendars),
 * styled with the app's blue accent, Onest font and radii so it matches the
 * Filter sheet instead of the stock OS date dialog. Pure JS — no native
 * module, so it renders identically on iOS and Android.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useLanguage, useT } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, press, radius, spacing } from '../theme';
import { ActionBar } from './ActionBar';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { CalendarSearchIcon } from './icons';

// Localized month/weekday names for the calendar. Registered once at module
// load; DateField switches LocaleConfig.defaultLocale to the app language on
// render. English is the library's built-in default, so only uz/ru are added.
LocaleConfig.locales.uz = {
  monthNames: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
  ],
  monthNamesShort: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  dayNames: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  dayNamesShort: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
};
LocaleConfig.locales.ru = {
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ],
  monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

export interface DateFieldProps {
  label: string;
  value: Date | null;
  placeholder: string;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

/** Date -> "DD.MM.YYYY" for the field, and -> "YYYY-MM-DD" for the calendar. */
const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Parse a "YYYY-MM-DD" calendar day into a local Date (no TZ drift). */
const fromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function DateField({ label, value, placeholder, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  // 'en' is the library's built-in default locale (empty string key).
  useEffect(() => {
    LocaleConfig.defaultLocale = language === 'en' ? '' : language;
  }, [language]);
  // Draft so Cancel discards and the field only updates on confirm.
  const [draft, setDraft] = useState<Date | null>(value);

  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };

  const confirm = () => {
    if (draft) onChange(draft);
    setOpen(false);
  };

  const calendarTheme = {
    calendarBackground: 'transparent',
    monthTextColor: t.colors.text,
    dayTextColor: t.colors.text,
    textDisabledColor: t.gray[30],
    textSectionTitleColor: t.gray[50],
    arrowColor: t.colors.text,
    selectedDayBackgroundColor: t.colors.primary,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: t.colors.primary,
    textDayFontFamily: fonts.medium,
    textMonthFontFamily: fonts.semiBold,
    textDayHeaderFontFamily: fonts.medium,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
  } as const;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: t.colors.text }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [styles.box, { borderColor: t.colors.strokeDark }, pressed && press.dim]}
      >
        <Text style={[styles.text, { color: value ? t.colors.text : t.colors.textMuted }]} numberOfLines={1}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <CalendarSearchIcon size={20} color={t.colors.textSecondary} />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={tr.filter.selectDate}
        footer={
          <ActionBar>
            <Button title={tr.common.cancel} variant="secondary" onPress={() => setOpen(false)} />
            <Button title={tr.filter.apply} onPress={confirm} disabled={!draft} />
          </ActionBar>
        }
      >
        <Calendar
          current={toISO(draft ?? value ?? new Date())}
          minDate={minimumDate ? toISO(minimumDate) : undefined}
          maxDate={maximumDate ? toISO(maximumDate) : undefined}
          onDayPress={(day) => setDraft(fromISO(day.dateString))}
          markedDates={
            draft ? { [toISO(draft)]: { selected: true, disableTouchEvent: true } } : undefined
          }
          enableSwipeMonths
          hideExtraDays
          theme={calendarTheme}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: spacing.xs },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
