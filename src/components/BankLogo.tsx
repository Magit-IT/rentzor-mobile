/**
 * 40px bank tile on a saved-card row (Figma: My cards 293:11430) — the brand
 * mark centered on the gray container. Vendor strings come from Paylov via
 * user_cards.vendor ("Uzcard" / "Humo"); anything else gets the generic
 * card glyph so an unknown vendor still renders.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  HUMO_LOGO,
  MASTERCARD_LOGO,
  UNIONPAY_LOGO,
  UZCARD_LOGO,
  VISA_LOGO,
} from '../assets/bank-logos';
import { useTheme } from '../context/ThemeContext';
import { AppIcon } from './AppIcon';
import { radius } from '../theme';

/** Marks with their viewBox aspect ratio (width / height). */
const MARKS: Record<string, { xml: string; ratio: number }> = {
  uzcard: { xml: UZCARD_LOGO, ratio: 19.675 / 28 },
  // Paylov reports Uzcard–MIR co-badged cards as "MIR"; show the Uzcard mark.
  mir: { xml: UZCARD_LOGO, ratio: 19.675 / 28 },
  humo: { xml: HUMO_LOGO, ratio: 27.2865 / 28.0001 },
  visa: { xml: VISA_LOGO, ratio: 1000 / 324.68 },
  mastercard: { xml: MASTERCARD_LOGO, ratio: 999.2 / 776 },
  unionpay: { xml: UNIONPAY_LOGO, ratio: 256 / 160 },
};

// Tall marks (Uzcard/Humo) render at the design's 28px height; wide marks
// (Visa is ~3:1) are instead capped at 32px so they stay inside the tile.
const MAX_H = 28;
const MAX_W = 32;

export function BankLogo({ vendor }: { vendor: string }) {
  const t = useTheme();
  const mark = MARKS[vendor.trim().toLowerCase()];
  const height = mark ? Math.min(MAX_H, MAX_W / mark.ratio) : 0;

  return (
    <View style={[styles.tile, { backgroundColor: t.colors.surface }]}>
      {mark ? (
        <SvgXml xml={mark.xml} width={height * mark.ratio} height={height} />
      ) : (
        <AppIcon name="creditCard" color={t.colors.textSecondary} size={24} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
