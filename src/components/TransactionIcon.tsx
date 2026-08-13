/**
 * Icons for the Transaction history screen (Figma 293:11378):
 * card (card payment/charge), wallet (refund/credit to balance),
 * penalty (late-return fine), failed (withdrawal that didn't go through).
 */
import React from 'react';
import { SvgXml } from 'react-native-svg';

const ICONS = {
  card: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2.5" stroke="${color}" stroke-width="1.5"/><path d="M2 9.5H22" stroke="${color}" stroke-width="1.5"/><path d="M5.5 14.5H9.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  wallet: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5C3 6.567 4.567 5 6.5 5H16.5C18.433 5 20 6.567 20 8.5V16.5C20 18.433 18.433 20 16.5 20H6.5C4.567 20 3 18.433 3 16.5V8.5Z" stroke="${color}" stroke-width="1.5"/><path d="M15.5 13.25C15.9142 13.25 16.25 12.9142 16.25 12.5C16.25 12.0858 15.9142 11.75 15.5 11.75V13.25ZM15.5 11.75C15.0858 11.75 14.75 12.0858 14.75 12.5C14.75 12.9142 15.0858 13.25 15.5 13.25V11.75ZM15.5 13.25H18.5V11.75H15.5V13.25Z" fill="${color}"/><path d="M3 9.5H15C16.6569 9.5 18 10.8431 18 12.5V12.5C18 14.1569 16.6569 15.5 15 15.5H3" stroke="${color}" stroke-width="1.5"/></svg>`,
  penalty: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 7.5L20.5 8.3L16 12.4L17.2 18.5L12 15.4L6.8 18.5L8 12.4L3.5 8.3L9.5 7.5L12 2Z" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  failed: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="3" width="16" height="18" rx="2" stroke="${color}" stroke-width="1.5"/><path d="M8 8H16" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M8 12H13" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M9.5 16.5L12 19L14.5 16.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15.5V19" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

export type TransactionIconName = keyof typeof ICONS;

export function TransactionIcon({
  name,
  color,
  size = 24,
}: {
  name: TransactionIconName;
  color: string;
  size?: number;
}) {
  return <SvgXml xml={ICONS[name](color)} width={size} height={size} />;
}
