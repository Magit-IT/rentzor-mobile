/**
 * Location flow icons — red map pin (shared/map-location-icon export),
 * GPS target (map locate button), edit pencil and trash (Manzillar drawer
 * and Manzil tafsilotlari header).
 */
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SvgXml } from 'react-native-svg';

const ICONS = {
  pin: (color: string) => `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2.08301C28.7925 2.08301 36.25 9.34958 36.25 18.21C36.2499 22.7322 34.3338 26.5343 31.6445 29.6729C28.9656 32.7993 25.4756 35.3211 22.1973 37.3271L22.1787 37.3389L22.1592 37.3496C21.5005 37.7214 20.7565 37.917 20 37.917C19.2435 37.917 18.4995 37.7214 17.8408 37.3496L17.8184 37.3369L17.7969 37.3242C14.5304 35.3021 11.0414 32.788 8.36133 29.6709C5.6697 26.5404 3.7501 22.7472 3.75 18.21C3.75 9.34958 11.2075 2.08301 20 2.08301ZM20 11.667C16.3182 11.667 13.3332 14.6513 13.333 18.333C13.333 22.0149 16.3181 25 20 25C23.6819 25 26.667 22.0149 26.667 18.333C26.6668 14.6513 23.6818 11.667 20 11.667Z" fill="${color}"/></svg>`,
  /** Solid rounded pin used inside the address rows (white on a circle). */
  pinSolid: (color: string) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1.04199C14.3963 1.04199 18.125 4.67527 18.125 9.10498C18.125 11.3661 17.1669 13.2672 15.8223 14.8364C14.4828 16.3996 12.7378 17.6605 11.0986 18.6636L11.0894 18.6694L11.0796 18.6748C10.7503 18.8607 10.3783 18.9585 10 18.9585C9.62172 18.9585 9.24975 18.8607 8.92041 18.6748L8.90918 18.6685L8.89844 18.6621C7.26517 17.6511 5.5207 16.394 4.18066 14.8354C2.83485 13.2702 1.87505 11.3736 1.875 9.10498C1.875 4.67527 5.60375 1.04199 10 1.04199ZM10 5.83349C8.15905 5.83349 6.66661 7.32564 6.6665 9.16649C6.6665 11.0074 8.15898 12.5 10 12.5C11.841 12.5 13.3335 11.0074 13.3335 9.16649C13.3334 7.32564 11.8409 5.83349 10 5.83349Z" fill="${color}"/></svg>`,
  gps: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="7.25" stroke="${color}" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="${color}"/><path d="M12 2V4.75" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M12 19.25V22" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M22 12L19.25 12" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M4.75 12L2 12" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  pencil: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.36 4.07866L15.2963 3.14229C16.8196 1.61899 19.2894 1.61899 20.8127 3.14229C22.336 4.66559 22.336 7.13544 20.8127 8.65874L19.8763 9.59511M14.36 4.07866C14.36 4.07866 14.4771 6.06864 16.2332 7.82177C17.9893 9.5749 19.8763 9.59511 19.8763 9.59511M14.36 4.07866L5.75201 12.6867C5.16891 13.2698 4.87736 13.5613 4.62663 13.8828C4.33087 14.2619 4.07731 14.6722 3.87055 15.1064C3.69526 15.4745 3.56488 15.8657 3.30413 16.6479L2.19908 19.9631M19.8763 9.59511L11.2683 18.2031C10.6852 18.7862 10.3937 19.0778 10.0722 19.3285C9.69308 19.6242 9.28282 19.8778 8.84864 20.0846C8.48053 20.2598 8.08942 20.3902 7.30719 20.651L3.99202 21.756M3.99202 21.756L3.18168 22.0261C2.79683 22.1544 2.37244 22.0542 2.08558 21.7674C1.79872 21.4805 1.69857 21.0561 1.82685 20.6713L2.09692 19.8609M3.99202 21.756L2.19908 19.9631" stroke="${color}" stroke-width="1.5"/></svg>`,
  trash: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.88 15.52C18.72 18.09 18.64 19.38 18 20.3C17.68 20.76 17.26 21.15 16.78 21.44C15.79 22 14.5 22 11.92 22C9.34 22 8.05 22 7.06 21.44C6.57 21.15 6.16 20.76 5.84 20.3C5.19 19.38 5.11 18.09 4.95 15.52L4.33 5.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.06 5.5L15.37 4.09C14.92 3.15 14.7 2.68 14.3 2.39C14.21 2.32 14.12 2.26 14.03 2.21C13.6 2 13.08 2 12.05 2C10.98 2 10.45 2 10.01 2.22C9.91 2.27 9.82 2.33 9.74 2.4C9.35 2.7 9.13 3.18 8.71 4.14L8.11 5.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M9.5 16.5V10.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M14.5 16.5V10.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

export type LocationIconName = keyof typeof ICONS;

export function LocationIcon({
  name,
  color,
  size,
}: {
  name: LocationIconName;
  color?: string;
  size?: number;
}) {
  const t = useTheme();
  color = color ?? t.colors.text;
  const dimension = size ?? (name === 'pin' ? 40 : name === 'pinSolid' ? 20 : 24);
  return <SvgXml xml={ICONS[name](color)} width={dimension} height={dimension} />;
}
