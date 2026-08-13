/**
 * Safe loader for react-native-yamap-plus. The library resolves its
 * TurboModule with TurboModuleRegistry.getEnforcing() at import time, so a
 * plain `import` throws ("'RTNYamapModule' could not be found") and crashes
 * the whole app when the MapKit native module isn't in the binary — i.e. in
 * Expo Go. Require it in a try/catch instead and let callers degrade
 * gracefully; development and production builds get the real map.
 */
type YamapLib = typeof import('react-native-yamap-plus');

let lib: YamapLib | null = null;
try {
  lib = require('react-native-yamap-plus');
} catch {
  lib = null;
  console.warn(
    'MapKit native module not found — maps will render as static images. ' +
      'You are likely in Expo Go or an outdated build; run `npx expo run:android` ' +
      'to build a development client with Yandex MapKit.',
  );
}

/** The library's exports, or null when MapKit isn't available (Expo Go). */
export const yamap = lib;

/** Initializes MapKit if both the native module and the API key exist. */
export function initYamap(apiKey: string | undefined) {
  if (lib && apiKey) {
    lib.YamapInstance.init(apiKey);
  }
}
