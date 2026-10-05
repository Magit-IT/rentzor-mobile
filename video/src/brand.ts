/**
 * Video-side brand constants. Colours come straight from the app's design
 * tokens (../../src/theme.ts) so the Reels always match the product.
 */
import { colors, palette } from '../../src/theme';

export { colors, palette };

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Music is 120 BPM: one beat = 15 frames, one bar = 60 frames. */
export const BEAT = 15;
export const BAR = 60;

/** Brand gradient (colors.gradientPrimary) and the balance-card gradient. */
export const GRADIENT = `linear-gradient(135deg, ${colors.gradientPrimary[0]} 0%, ${colors.gradientPrimary[1]} 100%)`;
export const CARD_GRADIENT = `linear-gradient(21.3deg, ${palette.primary[70]} 0%, ${palette.primary[40]} 100%)`;
export const NAVY_GRADIENT = `linear-gradient(160deg, ${palette.primary[100]} 0%, ${palette.primary[80]} 55%, ${palette.primary[60]} 100%)`;

export const FONT = 'Onest';

/**
 * Instagram Reels overlays its own UI: ~220px of header at the top, caption +
 * buttons over the bottom ~380px and the action column on the right. Keep
 * text inside this box.
 */
export const SAFE = { top: 230, bottom: 1540, left: 80, right: 1000 } as const;

export const ink = palette.gray[100];
export const muted = palette.gray[50];
export const blue = colors.primary;
export const yellow = palette.yellow[60];
export const green = palette.green[60];
export const orange = palette.orange[60];
export const violet = palette.violet[60];
