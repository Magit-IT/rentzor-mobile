/**
 * Native Yandex map (MapKit via react-native-yamap-plus) with the item's
 * pickup location. Similar to rentzor-marketplace's PickupZoneMap.tsx, but
 * zoomed out one level further (13 instead of 14) since the 1km circle at
 * zoom 14 fills the whole 280px-tall thumbnail edge-to-edge on mobile —
 * zoom 13 leaves visible map context around it, matching the Figma design.
 * Zoom 16 with no zone circle once `showExactLocation` is set (owner has
 * confirmed the booking). The exact-location pin is NOT drawn here — it must
 * be passed in as `children` (a <Marker
 * point={{lat, lon}}>) so it's anchored to the real coordinate and stays put
 * while panning/zooming, instead of a screen-space overlay glued to the
 * viewport center (see booking/[id].tsx for the pin markup). `interactive`
 * enables pan/zoom for the fullscreen viewer; the inline thumbnail keeps
 * gestures off so the page scroll isn't hijacked. Requires
 * YamapInstance.init() (done in app/_layout.tsx) and a development build —
 * MapKit is a native module, so in Expo Go this falls back to a static map
 * image (loaded via src/lib/yamap.ts to avoid the import-time crash).
 */
import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { yamap } from '../lib/yamap';

export interface PickupZoneMapProps {
  latitude: number;
  longitude: number;
  interactive?: boolean;
  /** Show the exact pin (post-confirmation) instead of the approximate 1km zone circle. */
  showExactLocation?: boolean;
  style?: ViewStyle;
  /** A <Marker> anchored to a real coordinate, e.g. the exact-location pin. */
  children?: React.ReactNode;
}

export function PickupZoneMap({
  latitude,
  longitude,
  interactive = false,
  showExactLocation = false,
  style,
  children,
}: PickupZoneMapProps) {
  if (!yamap) {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../assets/shared/map-image.png')}
          style={styles.map}
          resizeMode="cover"
        />
      </View>
    );
  }

  const { Yamap, Circle } = yamap;

  return (
    <View style={[styles.container, style]}>
      <Yamap
        style={styles.map}
        initialRegion={{ lat: latitude, lon: longitude, zoom: showExactLocation ? 16 : 13 }}
        interactiveDisabled={!interactive}
        showUserPosition={false}
      >
        {!showExactLocation && (
          <Circle
            center={{ lat: latitude, lon: longitude }}
            radius={1000}
            fillColor="rgba(147, 51, 234, 0.2)"
            strokeColor="rgba(147, 51, 234, 0.8)"
            strokeWidth={3}
          />
        )}
        {children}
      </Yamap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
