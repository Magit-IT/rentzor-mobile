# Rentzor — Instagram Reels

Two vertical (9:16, 1080×1920, 30 fps) Reels for Rentzor, built in code with
[Remotion](https://www.remotion.dev) (React → MP4). This folder is a standalone
project: it doesn't touch the Expo app, but it reuses the app's **design tokens**
(`../src/theme.ts`), **logo vectors** (`../src/assets/logoPaths.ts`), **artwork**
(`../src/assets/**`) and **copy** (labels mirror `../src/i18n/ru.ts`), so the
videos always match the product.

| Composition | Length | What it is |
|---|---|---|
| `Promo-ru` | 25 s | Hook → «Не покупайте — арендуйте!» → distance on every card → exact address only after booking → MyID for everyone → owner earnings → CTA with store badges |
| `Explainer-ru` | 87 s | MyID first → how to rent (5 steps) + how to rent out & earn (3 steps) + why it's safe + CTA |
| `PromoCover-ru`, `ExplainerCover-ru` | still | Reel covers (key content inside the 3:4 profile-grid crop) |

## Quick start

```bash
cd video
npm install
pip install numpy scipy        # audio generator (also needs ffmpeg)
npm run audio                  # writes public/audio/*.wav (music + SFX)
npm run studio                 # live preview / scrubbing in the browser
npm run render:ru              # out/rentzor-{promo,explainer}-ru.mp4 + covers
```

Without internet access to download Chrome, point Remotion at a local
Chromium / Chrome Headless Shell: `REMOTION_BROWSER=/path/to/headless_shell npm run render:ru`.

## Structure

```
audio/build_audio.py    cuts the music to the 120 BPM grid + synthesises UI sound effects and the sound logo
music/                  «Catchy Upbeat Pop» (CC BY 4.0) — see music/CREDITS.md for the required caption credit
public/maps/            map views cropped from app screenshots (approximate radius / exact pin)
public/badges/          official App Store / Google Play badges
public/fonts/           Onest woff2 (latin, latin-ext for Uzbek ʻ, cyrillic) — SIL OFL
public/icons/           3D icons cut from the app's icon sheets (scripts/cut_icons.py)
src/copy/               every on-screen string, per language (ru.ts; add uz.ts)
src/components/Real.tsx app screens rebuilt from real screenshots (demo data only)
src/components/         phone mockup, kinetic text, logo reveal, transitions
src/promo/Promo.tsx     the 25 s promo
src/explainer/…         the 87 s explainer
src/Covers.tsx          cover stills
scripts/stills.mjs      render chosen frames for quick visual QA (scripts/sheet.py tiles them into a contact sheet)
```

The music is cut to 120 BPM (one bar = 60 frames), and every cut lands on a bar line.
The logo animation is a frame-accurate port of the app's splash
(`../src/components/AnimatedLogo.tsx`).

## Instagram notes

* Text stays inside the Reels safe area (top ~230 px, bottom ~380 px and the right-hand
  button column are covered by Instagram's UI). In the explainer, the phone "camera" pans up
  before bottom-of-screen taps so they stay above the caption.
* Exports are H.264 + AAC, BT.709, ~−14 LUFS (Instagram's loudness target).
* Upload the matching `*-cover.png` as the Reel cover.
* **Credit the music in every caption:** `Music: «Catchy Upbeat Pop» — Music for Creators (CC BY 4.0)`.

## Adding Uzbek

1. Copy `src/copy/ru.ts` to `src/copy/uz.ts` and translate the values (UI labels exist in `../src/i18n/uz.ts`).
2. Register it in `src/copy/index.ts` (`{ ru, uz }`).
3. Add `Promo-uz`, `Explainer-uz` and the cover stills in `src/Root.tsx` with `defaultProps={{ lang: 'uz' }}`.
4. Check the longer lines: `npm run stills -- Promo-uz 30,130,270,400,510,620,745`.

## License note

Remotion is free for individuals and companies with up to 3 employees; larger
companies need a [Remotion company license](https://www.remotion.dev/license).
