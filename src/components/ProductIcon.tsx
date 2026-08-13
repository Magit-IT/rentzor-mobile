/**
 * Product-detail icons — inlined from the SVGs exported from Figma
 * (id-verification, response-time, response-rate, expand-map, rating star)
 * plus the header share glyph.
 */
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SvgXml } from 'react-native-svg';

const ICONS = {
  idVerification: (_color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z" stroke="#0CAF60" stroke-width="1.5"/><path d="M9.5 12.4L10.9286 14L14.5 10" stroke="#0CAF60" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  idUnverified: (_color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z" stroke="#A1A1AA" stroke-width="1.5"/><path d="M10 10L14 14M14 10L10 14" stroke="#A1A1AA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  responseTime: (_color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2" stroke="#3C83F6" stroke-width="1.5" stroke-linecap="round"/><path d="M12 9V13H16" stroke="#3C83F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="#3C83F6" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0.5 3.5"/></svg>`,
  responseRate: (_color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 22C14.4183 22 18 18.4183 18 14C18 9.58172 14.4183 6 10 6C5.58172 6 2 9.58172 2 14C2 15.2355 2.28008 16.4056 2.7802 17.4502C2.95209 17.8093 3.01245 18.2161 2.90955 18.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L5.39939 21.0904C5.78393 20.9876 6.19071 21.0479 6.54976 21.2198C7.5944 21.7199 8.76449 22 10 22Z" stroke="#8C62FF" stroke-width="1.5"/><path d="M18 14.5018C18.0665 14.4741 18.1324 14.4453 18.1977 14.4155C18.5598 14.2501 18.9661 14.1882 19.3506 14.2911L19.8267 14.4185C20.793 14.677 21.677 13.793 21.4185 12.8267L21.2911 12.3506C21.1882 11.9661 21.2501 11.5598 21.4155 11.1977C21.7908 10.376 22 9.46242 22 8.5C22 4.91015 19.0899 2 15.5 2C12.7977 2 10.4806 3.64899 9.5 5.9956" stroke="#8C62FF" stroke-width="1.5"/><path d="M6.51828 14H6.52728M10.009 14H10.018M13.5 14H13.509" stroke="#8C62FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  expandMap: (_color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 15L2 22M2 16.1429V22H7.85714" stroke="#18181B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 9L22 2M22 7.85714V2H16.1429" stroke="#18181B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star: (color: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_293_11729)"><path d="M7.9974 0.833008C8.69691 0.833008 9.24792 1.36136 9.59969 2.07428L10.7744 4.44311C10.81 4.51643 10.8944 4.61966 11.0214 4.7141C11.1482 4.80844 11.2724 4.86048 11.3541 4.87421L13.4805 5.23042C14.2486 5.3595 14.8924 5.736 15.1014 6.39161C15.3102 7.04667 15.0042 7.72741 14.4519 8.28077L14.4514 8.28131L12.7994 9.94691C12.7339 10.0129 12.6606 10.1373 12.6146 10.2993C12.5689 10.4602 12.5649 10.6068 12.5856 10.7015L12.5859 10.7028L13.0585 12.7633C13.2545 13.6208 13.1896 14.4712 12.5847 14.9158C11.9778 15.3619 11.1485 15.1642 10.395 14.7154L8.4017 13.5257C8.318 13.4757 8.17424 13.4352 8.00073 13.4352C7.82849 13.4352 7.68171 13.4751 7.59256 13.527L7.5913 13.5277L5.60192 14.7151C4.84937 15.1654 4.02103 15.3597 3.41407 14.9131C2.80966 14.4685 2.74143 13.6197 2.93807 12.7628L3.4106 10.7028L3.41089 10.7015C3.43161 10.6068 3.42755 10.4602 3.38187 10.2993C3.33587 10.1373 3.26252 10.0129 3.19705 9.94691L1.5439 8.2801C0.995098 7.72676 0.690138 7.04661 0.897298 6.39251C1.10506 5.7365 1.74762 5.35954 2.51622 5.23038L4.64088 4.87447L4.64156 4.87435C4.71945 4.86084 4.8418 4.80938 4.96832 4.7148C5.09507 4.62004 5.17973 4.51658 5.21541 4.44311L5.21721 4.43945L6.39041 2.07366L6.39088 2.07272C6.74597 1.36039 7.29869 0.833008 7.9974 0.833008Z" fill="${color}"/></g><defs><clipPath id="clip0_293_11729"><rect width="16" height="16" fill="white"/></clipPath></defs></svg>`,
  share: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="5.5" r="2.75" stroke="${color}" stroke-width="1.5"/><circle cx="6" cy="12" r="2.75" stroke="${color}" stroke-width="1.5"/><circle cx="18" cy="18.5" r="2.75" stroke="${color}" stroke-width="1.5"/><path d="M8.5 10.7L15.5 6.9M8.5 13.3L15.5 17.1" stroke="${color}" stroke-width="1.5"/></svg>`,
};

export type ProductIconName = keyof typeof ICONS;

export function ProductIcon({
  name,
  color,
  size,
}: {
  name: ProductIconName;
  color?: string;
  size?: number;
}) {
  const t = useTheme();
  color = color ?? t.colors.text;
  const dimension = size ?? (name === 'star' ? 16 : 24);
  return <SvgXml xml={ICONS[name](color)} width={dimension} height={dimension} />;
}
