/**
 * Wraps app.json so local dev builds can deviate from the release config.
 * app.json stays the source of truth; each override below is opt-in via an
 * env var that EAS never sets, so production/preview builds are untouched.
 *
 * EXPO_EMULATOR=1 — adds x86_64 so `npx expo run:android` can target the
 * emulator. app.json keeps buildArchs at arm64-v8a, the release ABI and the
 * reason the APK is as small as it is (each extra ABI duplicates every native
 * .so: Yandex MapKit, Hermes, Reanimated, ~94MB of lib/ at last measure).
 * Note MyID's capture SDK ships arm64-v8a/armeabi-v7a only (no x86_64), so
 * its flow still needs a physical device even with this enabled.
 *
 * IOS_DEV_SIGNING=1 — makes the app signable with a free Apple ID (no paid
 * Developer Program membership) for `npx expo run:ios --device` on a Mac:
 *   - suffixes the bundle ID, since free accounts can't claim an arbitrary
 *     one and uz.rentzor.app is reserved for the real App Store listing;
 *   - drops associatedDomains, a paid-only entitlement that fails to
 *     provision on a free account and blocks the build outright.
 * Universal links (applinks:rentzor.uz) therefore don't work under this flag —
 * the rentzor:// scheme still does. Free-account provisioning profiles also
 * expire after 7 days, after which the app needs rebuilding from Xcode.
 */
const config = require('./app.json');

const withEmulatorArchs = (expo) => ({
  ...expo,
  plugins: expo.plugins.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
    const [name, props] = plugin;
    return [
      name,
      { ...props, android: { ...props.android, buildArchs: ['arm64-v8a', 'x86_64'] } },
    ];
  }),
});

const withDevSigning = (expo) => {
  const { associatedDomains, ...ios } = expo.ios;
  return {
    ...expo,
    ios: { ...ios, bundleIdentifier: `${ios.bundleIdentifier}.dev` },
  };
};

module.exports = () => {
  let expo = config.expo;
  if (process.env.EXPO_EMULATOR) expo = withEmulatorArchs(expo);
  if (process.env.IOS_DEV_SIGNING) expo = withDevSigning(expo);
  return { ...config, expo };
};
