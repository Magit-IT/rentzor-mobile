/**
 * RentZor design tokens — extracted from Figma "RentZor (Final)" Design System page.
 * Color scales: 0 (lightest) → 90/100 (darkest). The scale's primary shade is
 * exposed as `colors.<name>` (marked "P" in Figma).
 */

export const palette = {
  primary: {
    0: '#EFF6FF', 10: '#DBEAFE', 20: '#BFDBFE', 30: '#93C5FD', 40: '#60A5FA',
    50: '#3C83F6', 60: '#2563EB', 70: '#1D4ED8', 80: '#1E40AF', 90: '#1E3A8A', 100: '#172554',
  },
  gray: {
    0: '#FAFAFA', 10: '#F4F4F5', 20: '#E4E4E7', 30: '#D4D4D8', 40: '#A1A1AA',
    50: '#66666E', 60: '#52525B', 70: '#3F3F46', 80: '#27272A', 90: '#18181B', 100: '#09090B',
  },
  red: {
    0: '#FCEAEB', 10: '#F9D6D7', 20: '#F6C1C3', 30: '#F3ADAF', 40: '#EC8387',
    50: '#E65A5F', 60: '#E03137', 70: '#B3272C', 80: '#70161A', 90: '#5A1416',
  },
  yellow: {
    0: '#FFFAE9', 10: '#FFF6D3', 20: '#FFF1BD', 30: '#FFECA7', 40: '#FFE37B',
    50: '#FFD94F', 60: '#FFD023', 70: '#CCA61C', 80: '#997D15', 90: '#66530E',
  },
  violet: {
    0: '#F4EFFF', 10: '#E8E0FF', 20: '#DDD0FF', 30: '#D1C0FF', 40: '#BAA1FF',
    50: '#A381FF', 60: '#8C62FF', 70: '#734ED7', 80: '#412788', 90: '#3B2479',
  },
  green: {
    0: '#E6FDF2', 10: '#D0F5E3', 20: '#BAEDD5', 30: '#A5E6C6', 40: '#8FDEB8',
    50: '#63CE9A', 60: '#0CAF60', 70: '#0A8C4D', 80: '#07693A', 90: '#054626',
  },
  orange: {
    0: '#FFFAEC', 10: '#FFF4D3', 20: '#FFE5A5', 30: '#FFD16D', 40: '#FFB232',
    50: '#FF980A', 60: '#F77F00', 70: '#CC6002', 80: '#A14A0B', 90: '#823E0C', 100: '#461E04',
  },
} as const;

export interface AppColors {
  primary: string;
  critical: string;
  success: string;
  warning: string;
  accent: string;
  orange: string;

  /** Soft critical background (logout row, critical buttons). */
  criticalSurface: string;
  criticalSurfacePressed: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceActive: string;

  strokeLight: string;
  strokeDark: string;

  gradientPrimary: readonly [string, string];
}

export const colors = {
  primary: palette.primary[50],
  critical: palette.red[60],
  success: palette.green[60],
  warning: palette.yellow[60],
  accent: palette.violet[60],
  orange: palette.orange[60],

  criticalSurface: palette.red[0],
  criticalSurfacePressed: palette.red[10],

  text: palette.gray[100],
  textSecondary: palette.gray[50],
  textMuted: palette.gray[40],
  textInverse: '#FFFFFF',

  background: '#FFFFFF',
  backgroundSecondary: '#FFFFFF',
  surface: palette.gray[10],
  surfaceActive: palette.primary[0],

  strokeLight: '#F1F0F0',
  strokeDark: '#EAE8E7',

  gradientPrimary: ['#2F78EE', '#35CCFF'],
} as const satisfies AppColors;

/**
 * Dark mode (Figma dark sections, 539:*): the gray and primary (blue) ramps
 * flip around 50 — dark[N] = light[100 − N] — so "gray 10" stays the subtle
 * surface tint and "gray 100" stays the strongest text color in both schemes.
 * Accent ramps (red/green/violet/orange) have no dark variants in the design.
 */
export const paletteDark = {
  primary: {
    0: '#172554', 10: '#1E3A8A', 20: '#1E40AF', 30: '#1D4ED8', 40: '#2563EB',
    50: '#3C83F6', 60: '#60A5FA', 70: '#93C5FD', 80: '#BFDBFE', 90: '#DBEAFE', 100: '#EFF6FF',
  },
  gray: {
    0: '#09090B', 10: '#18181B', 20: '#27272A', 30: '#3F3F46', 40: '#52525B',
    50: '#66666E', 60: '#A1A1AA', 70: '#D4D4D8', 80: '#E4E4E7', 90: '#F4F4F5', 100: '#FAFAFA',
  },
} as const;

/**
 * Accent ramps in dark mode. Sampled from the dark sections: the main "60 P"
 * shades brighten one step to the light ramp's [50] (Red #E65A5F, Green
 * #63CE9A, Yellow #FFD94F), and pale tint steps become deep tints (Red/0
 * #3E1F20, Red/10 #381E21). Orange and violet follow the same two rules —
 * their exact dark variables weren't sampled, so tints are derived.
 */
export const accentsDark = {
  red: { ...palette.red, 0: '#3E1F20', 10: '#381E21', 20: '#4E2A2D', 60: '#E65A5F' },
  orange: { ...palette.orange, 0: '#38270F', 10: '#3E2A12', 60: '#FF980A', 70: '#FF980A' },
  violet: { ...palette.violet, 0: '#2D2544', 60: '#A381FF' },
  green: { ...palette.green, 0: '#12331F', 60: '#63CE9A' },
  yellow: { ...palette.yellow, 60: '#FFD94F' },
} as const;

export const darkColors: AppColors = {
  primary: paletteDark.primary[50],
  critical: accentsDark.red[60],
  success: accentsDark.green[60],
  warning: accentsDark.yellow[60],
  accent: accentsDark.violet[60],
  orange: accentsDark.orange[60],

  criticalSurface: accentsDark.red[0],
  criticalSurfacePressed: accentsDark.red[10],

  text: '#FAFAFA', // Colors/Primary/Text
  textSecondary: paletteDark.gray[50],
  textMuted: paletteDark.gray[40],
  textInverse: '#FFFFFF',

  background: '#0A0A0A', // Colors/Background/Primary
  backgroundSecondary: '#111111', // Colors/Background/Secondary
  surface: paletteDark.gray[10],
  surfaceActive: paletteDark.primary[0],

  strokeLight: '#212121', // Colors/Stroke/Light
  strokeDark: '#2C2C2B', // Colors/Stroke/Dark

  gradientPrimary: ['#2F78EE', '#35CCFF'],
};

export interface Theme {
  scheme: 'light' | 'dark';
  colors: AppColors;
  /** Theme-aware gray ramp (mirrored in dark) — use instead of palette.gray. */
  gray: Record<keyof typeof palette.gray, string>;
  /** Theme-aware blue ramp (mirrored in dark) — use instead of palette.primary. */
  blue: Record<keyof typeof palette.primary, string>;
  /** Theme-aware accent ramps — use instead of palette.red/orange/violet/green/yellow. */
  red: Record<keyof typeof palette.red, string>;
  orange: Record<keyof typeof palette.orange, string>;
  violet: Record<keyof typeof palette.violet, string>;
  green: Record<keyof typeof palette.green, string>;
  yellow: Record<keyof typeof palette.yellow, string>;
}

export const themes: Record<'light' | 'dark', Theme> = {
  light: {
    scheme: 'light',
    colors,
    gray: palette.gray,
    blue: palette.primary,
    red: palette.red,
    orange: palette.orange,
    violet: palette.violet,
    green: palette.green,
    yellow: palette.yellow,
  },
  dark: {
    scheme: 'dark',
    colors: darkColors,
    gray: paletteDark.gray,
    blue: paletteDark.primary,
    red: accentsDark.red,
    orange: accentsDark.orange,
    violet: accentsDark.violet,
    green: accentsDark.green,
    yellow: accentsDark.yellow,
  },
};

/**
 * App typeface is Onest (Google Fonts). Load it with expo-font /
 * @expo-google-fonts/onest; until loaded, RN falls back to the system font.
 */
export const fonts = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semiBold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
  extraBold: 'Onest_800ExtraBold',
} as const;

export const typography = {
  h1: { fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 40 },
  h2: { fontFamily: fonts.semiBold, fontSize: 24, lineHeight: 32 },
  h3: { fontFamily: fonts.semiBold, fontSize: 20, lineHeight: 32 },
  h4: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 28 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyLgMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  bodyLgSemiBold: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  bodySemiBold: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  captionMedium: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screenX: 20,
} as const;

/**
 * Pressed-state feedback for Pressables — use with the style-function form:
 * `style={({ pressed }) => [styles.x, pressed && press.dim]}`.
 * `dim` fades the whole element; `surface` darkens light-surface buttons.
 */
export const press = {
  dim: { opacity: 0.6 },
  surface: { backgroundColor: palette.gray[20] },
} as const;

export const radius = {
  sm: 10,
  md: 12,
  base: 16,
  lg: 24,
  pill: 100,
} as const;
