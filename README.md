# Rentzor — Mobile App

Rentzor ([rentzor.uz](https://rentzor.uz)) is a peer-to-peer rental marketplace for Uzbekistan: people list items they own (tools, electronics, sports gear, etc.), and others rent them for a daily price. This repository contains the **mobile app** (iOS & Android), one part of a larger platform.

## The platform at a glance

Rentzor consists of several clients talking to one shared backend:

| Part | Stack | What it does |
|------|-------|--------------|
| **Marketplace web app** | Vite + React + shadcn/ui | Public storefront at rentzor.uz — browse, search, book items |
| **Owner web app** | Vite + React + shadcn/ui | Dashboard for item owners — listings, bookings, earnings, payouts |
| **Admin web app** | Vite + React + shadcn/ui | Internal moderation & operations panel |
| **Mobile app (this repo)** | Expo / React Native | Marketplace + owner mode in one app |
| **Backend** | Self-hosted Supabase | Postgres, Auth, Storage, Realtime, and ~24 Deno edge functions behind Caddy |

The backend is a single self-hosted Supabase instance. All business logic that must not be trusted to clients lives server-side:

- **Postgres** holds the core schema (profiles, items, bookings, reviews, wallet ledger, notifications, …). Money integrity is enforced with database triggers — balance changes only happen through an append-only transactions ledger. Row Level Security keeps each user scoped to their own data while listings stay publicly readable.
- **Edge functions** implement the sensitive flows: phone-OTP registration and password reset (SMS via Eskiz), payments and card top-ups (Paylov), identity verification (MyID — government ID + face match, required before listing items), push notifications (FCM), Telegram notifications, and rental-contract PDF generation.
- **Auth** is unified across web and mobile: sign-up verifies the phone number with an SMS code, then the account gets an email + password; sign-in is phone + password.

## How the mobile app works

Built with **Expo SDK 54** (React Native 0.81, TypeScript) using:

- **expo-router** — file-based navigation under `src/app/`. Guests can browse everything public (home, categories, product pages, search); account-only screens (bookings, wallet, settings, owner mode) sit behind an auth guard (`Stack.Protected` in `src/app/_layout.tsx`).
- **Supabase JS client** (`src/integrations/supabase/`) — direct Postgres queries under RLS for reads, edge-function calls for sensitive writes. Session tokens are stored in the device keychain (expo-secure-store).
- **Yandex MapKit** (`react-native-yamap-plus`) — maps for pickup locations and address search/geocoding.
- **i18n** (`src/i18n/`) — full Uzbek / Russian / English translations, plus light & dark themes (`src/theme.ts`, design tokens from the Figma design system).

### Main user flows

1. **Browse & book (renter):** pick a location → browse categories or search → open an item → choose rental dates on a calendar → pay from the in-app wallet (topped up by card via Paylov) → meet the owner, take pickup photos → use the item → return it (owner confirms, optionally with return photos). Booking status is tracked through the whole lifecycle (pending → confirmed → in progress → returned/completed) with push + in-app notifications at each step.
2. **List & earn (owner):** verify identity with MyID → switch to owner mode (separate tab group under `src/app/(owner)/`) → create listings with photos, price, and a pickup zone → accept/decline booking requests → confirm handovers and returns → withdraw earnings to a card.
3. **Account:** profile, saved items, transaction history, linked cards, complaints/support, language & theme settings, account deletion.

### Project structure

```
src/
  app/            # expo-router screens: (tabs), (auth), (owner), booking/, product/, settings/, …
  components/     # design-system components (Button, Input, Checkbox, BottomSheet, …)
  context/        # providers: theme, language, profile/session, location, favorites, toasts
  hooks/          # data hooks (items, bookings, notifications, sign-in prompt, …)
  i18n/           # uz / ru / en dictionaries
  integrations/   # supabase client + generated DB types
  lib/            # domain helpers: auth, booking status/time, payments, geocoding, MyID, …
  theme.ts        # colors, spacing, typography tokens
plugins/          # Expo config plugins (MyID native SDK)
```

## Running it

```bash
npm install
npx expo start          # Expo Go (maps & MyID unavailable — native modules)
npx expo run:android    # full dev build
```

Configuration comes from environment variables (an `.env` file locally, EAS environment variables for release builds) — none are committed:

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — backend endpoint + anon key
- `EXPO_PUBLIC_YANDEX_MAPKIT_KEY`, `EXPO_PUBLIC_YANDEX_GEOCODER_KEY` — maps & geocoding
- `EXPO_PUBLIC_MYID_CLIENT_HASH`, `EXPO_PUBLIC_MYID_CLIENT_HASH_ID`, `EXPO_PUBLIC_MYID_ENVIRONMENT` — identity verification SDK

Release builds are produced with **EAS Build** (`eas.json`: `preview` for internal APK/IPA, `production` for App Store / Play Market submission).

## Note

This repository is a read-only snapshot of the mobile app source, shared for code review. The backend, web apps, and all credentials live elsewhere.
# rentzor-mobile
