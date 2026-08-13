# RentZor shared components

Reusable UI components extracted from the Figma file **RentZor (Final)**
(`70FUOaXksil0S4CTTiXX8d`), Design System page. Design tokens live in
`src/theme.ts`. Only components used repeatedly across flows are here.

| Component | Figma source | Notes |
|---|---|---|
| `Button` | Button set `293:30545` | 8 variants x 3 sizes x active/disabled; icon slots |
| `Input` | Input `293:31673` / Text Box `293:31309` | label, description, error, focus border |
| `Checkbox` | `293:31709` | 20x20 r6, primary when checked |
| `RadioButton` | `293:31750` | 20x20 circle, primary + white dot |
| `Toggle` | `293:31775` | 44x24 animated switch |
| `Tabs` | Tab `293:33114` | pill filter tabs (booking statuses etc.) |
| `SegmentedControl` | Segment `293:31819` | white active segment on gray track |
| `PageHeader` | Header `293:31850` | title / back + title, hairline divider |
| `ActionBar` | `293:32414` | bottom bar, 1–2 buttons, home indicator |
| `NavBar` | Navigation bar `293:31923`, Navbar item `293:31916` | bottom tabs, tint-aware icons |
| `ProductCard` | Product `293:32580` | image r24, rating badge, bookmark, price |
| `Card` | Card `293:32124` | generic row card, default/active |
| `BottomSheet` | Drawer `293:32457` | modal sheet, title + close, footer slot |
| `PageIndicator` | Indicator instances | onboarding/carousel dots |
| `RatingStars` | Owner/Review rating star instances | display or tappable input |

## Fonts

The app typeface is **Onest** (weights 400/500/600/700). Install and load it:

```bash
npx expo install expo-font @expo-google-fonts/onest
```

```tsx
import { useFonts, Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
```

Until loaded, components fall back to the system font.

## Icons

Components take `icon`/`leftIcon`/`rightIcon` props (`React.ReactNode`).
`icons.tsx` provides dependency-free placeholder glyphs (Chevron, Check, Star,
CloseX). The real design icons are exported as SVG in `src/assets/` — to use
them directly, add `react-native-svg` + `react-native-svg-transformer` and pass
them into the icon props.
