/** Line icons drawn on a 24×24 grid (stroke-based, like the app's icon set). */
import React from 'react';

export type GlyphName =
  | 'search' | 'pin' | 'chevronDown' | 'chevronRight' | 'chevronLeft' | 'bell' | 'star' | 'bookmark'
  | 'home' | 'calendar' | 'user' | 'check' | 'shield' | 'camera' | 'wallet' | 'card' | 'lock'
  | 'plus' | 'doc' | 'id' | 'photo' | 'box' | 'arrowUp' | 'scan' | 'filter' | 'clock' | 'map';

const paths: Record<GlyphName, React.ReactNode> = {
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>),
  pin: (<><path d="M12 21s-6.5-5.8-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.3" /></>),
  chevronDown: <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  bell: (<><path d="M6.5 16.5v-5.5a5.5 5.5 0 1 1 11 0v5.5l1.8 1.8H4.7z" /><path d="M10 20.8a2.2 2.2 0 0 0 4 0" /></>),
  star: <path d="M12 3.2l2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.4-4.2 6-.9z" />,
  bookmark: <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" />,
  home: (<><path d="M3.5 10.5L12 4l8.5 6.5V20a.8.8 0 0 1-.8.8H15v-6H9v6H4.3a.8.8 0 0 1-.8-.8z" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  shield: (<><path d="M12 3l7.5 2.8v5.7c0 4.8-3.3 7.9-7.5 9.2-4.2-1.3-7.5-4.4-7.5-9.2V5.8z" /><path d="M8.6 12.2l2.4 2.4 4.4-4.6" /></>),
  camera: (<><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8.5 7l1.6-2.8h3.8L15.5 7" /><circle cx="12" cy="13.4" r="3.4" /></>),
  wallet: (<><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 14.8h1.5" /></>),
  card: (<><rect x="2.5" y="5" width="19" height="14" rx="2.8" /><path d="M2.5 9.6h19M6 15h4" /></>),
  lock: (<><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  doc: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M9.8 13h5.6M9.8 16.5h5.6" /></>),
  id: (<><rect x="3" y="5" width="18" height="14" rx="2.8" /><circle cx="8.6" cy="11" r="2.1" /><path d="M5.6 16.3a3 3 0 0 1 6 0M14 10h4.2M14 13.4h3" /></>),
  photo: (<><rect x="3" y="4.5" width="18" height="15" rx="3" /><circle cx="9" cy="9.6" r="1.7" /><path d="M4 17.5l4.6-4.4 3.4 3 3-2.6 5 4.4" /></>),
  box: (<><path d="M3.8 7.5L12 3.5l8.2 4v9L12 20.5l-8.2-4z" /><path d="M3.8 7.5L12 11.5l8.2-4M12 11.5v9" /></>),
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  scan: (<><path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" /><circle cx="12" cy="10.5" r="2.6" /><path d="M7.8 16.5a4.6 4.6 0 0 1 8.4 0" /></>),
  filter: (<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  map: (<><path d="M3.5 6.5l5.5-2.5 6 2.5 5.5-2.5v13.5l-5.5 2.5-6-2.5-5.5 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></>),
};

export const Icon: React.FC<{
  name: GlyphName;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  style?: React.CSSProperties;
}> = ({ name, size = 24, color = 'currentColor', stroke = 1.8, fill = 'none', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0, ...style }}
  >
    {paths[name]}
  </svg>
);
