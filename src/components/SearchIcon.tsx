/**
 * Search screen icons — inlined from the SVGs exported from Figma
 * (src/assets/search: history, close, tuning).
 */
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SvgXml } from 'react-native-svg';

const ICONS = {
  history: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12L14.5 14.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.60414 5.60414L5.07381 5.07381V5.07381L5.60414 5.60414ZM4.33776 6.87052L3.58777 6.87429C3.58984 7.28556 3.92272 7.61844 4.33399 7.62051L4.33776 6.87052ZM6.87954 7.6333C7.29375 7.63539 7.63122 7.30129 7.6333 6.88708C7.63538 6.47287 7.30129 6.1354 6.88708 6.13332L6.88331 6.88331L6.87954 7.6333ZM5.07496 4.3212C5.07288 3.90699 4.73541 3.5729 4.3212 3.57498C3.90699 3.57706 3.5729 3.91453 3.57498 4.32874L4.32497 4.32497L5.07496 4.3212ZM3.82661 10.7849C3.88286 10.3745 3.59578 9.99627 3.1854 9.94002C2.77503 9.88377 2.39675 10.1708 2.3405 10.5812L3.08355 10.6831L3.82661 10.7849ZM18.3319 5.6681L18.8622 5.13777C15.042 1.31758 8.86873 1.27889 5.07381 5.07381L5.60414 5.60414L6.13447 6.13447C9.33358 2.93536 14.5571 2.95395 17.8016 6.19843L18.3319 5.6681ZM5.6681 18.3319L5.13777 18.8622C8.95796 22.6824 15.1313 22.7211 18.9262 18.9262L18.3959 18.3959L17.8655 17.8655C14.6664 21.0646 9.44291 21.0461 6.19843 17.8016L5.6681 18.3319ZM18.3959 18.3959L18.9262 18.9262C22.7211 15.1313 22.6824 8.95796 18.8622 5.13777L18.3319 5.6681L17.8016 6.19843C21.0461 9.44291 21.0646 14.6664 17.8655 17.8655L18.3959 18.3959ZM5.60414 5.60414L5.07381 5.07381L3.80743 6.34019L4.33776 6.87052L4.86809 7.40085L6.13447 6.13447L5.60414 5.60414ZM4.33776 6.87052L4.33399 7.62051L6.87954 7.6333L6.88331 6.88331L6.88708 6.13332L4.34153 6.12053L4.33776 6.87052ZM4.33776 6.87052L5.08775 6.86675L5.07496 4.3212L4.32497 4.32497L3.57498 4.32874L3.58777 6.87429L4.33776 6.87052ZM3.08355 10.6831L2.3405 10.5812C1.93907 13.5099 2.87392 16.5984 5.13777 18.8622L5.6681 18.3319L6.19843 17.8016C4.27785 15.881 3.48663 13.2652 3.82661 10.7849L3.08355 10.6831Z" fill="${color}"/></svg>`,
  close: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.75781 7.75732L16.2431 16.2426" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.75691 16.2426L16.2422 7.75732" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tuning: (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 14.5C14 12.8431 15.3431 11.5 17 11.5C18.6568 11.5 20 12.8431 20 14.5C20 16.1569 18.6568 17.5 17 17.5C15.3431 17.5 14 16.1569 14 14.5Z" stroke="${color}" stroke-width="1.5"/><path d="M3.99998 9.5C3.99998 11.1569 5.34312 12.5 6.99998 12.5C8.65683 12.5 9.99998 11.1569 9.99998 9.5C9.99998 7.84315 8.65683 6.5 6.99998 6.5C5.34312 6.5 3.99998 7.84315 3.99998 9.5Z" stroke="${color}" stroke-width="1.5"/><path d="M16.959 9L16.959 2" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M6.95898 15L6.95898 22" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M16.959 22L16.959 20" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M6.95898 2L6.95898 4" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

export type SearchIconName = keyof typeof ICONS;

export function SearchIcon({
  name,
  color,
  size = 24,
}: {
  name: SearchIconName;
  color?: string;
  size?: number;
}) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return <SvgXml xml={ICONS[name](color)} width={size} height={size} />;
}
