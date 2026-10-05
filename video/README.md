# Rentzor — Instagram Reels

Two vertical (9:16, 1080×1920, 30 fps) Reels for Rentzor, built in code with
[Remotion](https://www.remotion.dev) (React → MP4). This folder is a standalone
project: it doesn't touch the Expo app, but it reuses the app's **design tokens**
(`../src/theme.ts`), **logo vectors** (`../src/assets/logoPaths.ts`), **artwork**
(`../src/assets/**`) and **copy** (labels mirror `../src/i18n/ru.ts`), so the
videos always match the product.

| Composition | Length | What it is |
|---|---|---|
| `Promo-ru` | 25 s | Hook → «Не покупайте — арендуйте!» → home screen → map → trust → owner earnings → CTA |
| `Explainer-ru` | 83 s | How to rent (4 steps) + how to rent out & earn (4 steps) + why it's safe + CTA |
| `PromoCover-ru`, `ExplainerCover-ru` | still | Reel covers (key content inside the 3:4 profile-grid crop) |

## Quick start

```bash
cd video
npm install
pip install numpy scipy        # only for the audio generator
npm run audio                  # writes public/audio/*.wav (music + SFX)
npm run studio                 # live preview / scrubbing in the browser
npm run render:ru              # out/rentzor-{promo,explainer}-ru.mp4 + covers
```

Without internet access to download Chrome, point Remotion at a local
Chromium / Chrome Headless Shell: `REMOTION_BROWSER=/path/to/headless_shell npm run render:ru`.

## Structure

```
audio/build_audio.py    procedural 120 BPM music beds + UI sound effects (royalty-free, deterministic)
public/fonts/           Onest woff2 (latin, latin-ext for Uzbek ʻ, cyrillic) — SIL OFL
public/icons/           3D icons cut from the app's icon sheets (scripts/cut_icons.py)
src/copy/               every on-screen string, per language (ru.ts; add uz.ts)
src/components/         phone mockup, recreated app screens, kinetic text, logo reveal, transitions
src/promo/Promo.tsx     the 25 s promo
src/explainer/…         the 83 s explainer
src/Covers.tsx          cover stills
scripts/stills.mjs      render chosen frames for quick visual QA (scripts/sheet.py tiles them into a contact sheet)
```

The music is 120 BPM (one bar = 60 frames), and every cut lands on a bar line.
The logo animation is a frame-accurate port of the app's splash
(`../src/components/AnimatedLogo.tsx`).

## Instagram notes

* Text stays inside the Reels safe area (top ~230 px, bottom ~380 px and the right-hand
  button column are covered by Instagram's UI). In the explainer, the phone "camera" pans up
  before bottom-of-screen taps so they stay above the caption.
* Exports are H.264 + AAC, BT.709, ~−14 LUFS (Instagram's loudness target).
* Upload the matching `*-cover.png` as the Reel cover.

## Adding Uzbek

1. Copy `src/copy/ru.ts` to `src/copy/uz.ts` and translate the values (UI labels exist in `../src/i18n/uz.ts`).
2. Register it in `src/copy/index.ts` (`{ ru, uz }`).
3. Add `Promo-uz`, `Explainer-uz` and the cover stills in `src/Root.tsx` with `defaultProps={{ lang: 'uz' }}`.
4. Check the longer lines: `npm run stills -- Promo-uz 30,130,270,400,510,620,745`.

## License note

Remotion is free for individuals and companies with up to 3 employees; larger
companies need a [Remotion company license](https://www.remotion.dev/license).
