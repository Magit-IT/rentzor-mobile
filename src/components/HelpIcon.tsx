/**
 * Icons for the Help center screen (Figma: Settings / Yordam markazi,
 * 293:11378 flow): paperPlane (Telegram), envelope (email), copy,
 * docText (terms), shield (privacy), externalArrow (open link).
 */
import React from 'react';
import { SvgXml } from 'react-native-svg';

const ICONS = {
  paperPlane: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 3L14.5 21C14.4 21.3 14.1 21.5 13.8 21.5C13.5 21.5 13.2 21.3 13.1 21L10.5 13.5L3 10.9C2.7 10.8 2.5 10.5 2.5 10.2C2.5 9.9 2.7 9.6 3 9.5L21 3Z" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/><path d="M10.5 13.5L21 3" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  envelope: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="3" stroke="${color}" stroke-width="1.5"/><path d="M2.5 7L10.2 12.6C11.27 13.38 12.73 13.38 13.8 12.6L21.5 7" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  copy: (color: string) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" stroke="${color}" stroke-width="1.5"/><path d="M3.5 13.5C2.94772 13.5 2.5 13.0523 2.5 12.5V4.5C2.5 3.39543 3.39543 2.5 4.5 2.5H12.5C13.0523 2.5 13.5 2.94772 13.5 3.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  docText: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8V16C20 18.8284 20 20.2426 19.1213 21.1213C18.2426 22 16.8284 22 14 22H10C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8Z" stroke="${color}" stroke-width="1.5"/><path d="M8 7H16" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M8 12H16" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M8 17H12" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  shield: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.37752 5.08241C3 5.62028 3 7.21907 3 10.4167V11.9914C3 17.6294 7.23896 20.3655 9.89856 21.5273C10.62 21.8424 10.9807 22 12 22C13.0193 22 13.38 21.8424 14.1014 21.5273C16.761 20.3655 21 17.6294 21 11.9914V10.4167C21 7.21907 21 5.62028 20.6225 5.08241C20.245 4.54454 18.7417 4.02996 15.7351 3.00079L15.1623 2.80472C13.595 2.26824 12.8113 2 12 2C11.1887 2 10.405 2.26824 8.83772 2.80472L8.26491 3.00079C5.25832 4.02996 3.75503 4.54454 3.37752 5.08241Z" stroke="${color}" stroke-width="1.5"/><path d="M9.5 12.4L11 13.9L14.5 10.4" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  externalArrow: (color: string) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 14.5L14.5 5.5M14.5 5.5H7.5M14.5 5.5V12.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export type HelpIconName = keyof typeof ICONS;

export function HelpIcon({
  name,
  color,
  size = 24,
}: {
  name: HelpIconName;
  color: string;
  size?: number;
}) {
  return <SvgXml xml={ICONS[name](color)} width={size} height={size} />;
}
