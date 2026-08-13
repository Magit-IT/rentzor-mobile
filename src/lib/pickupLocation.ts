/**
 * Hand-off slot between the owner listing wizard and the pick-location map
 * screen. Expo Router params can't carry callbacks, so the map screen drops
 * its result here and the wizard consumes it on focus.
 */
import { GeocodedPlace } from './geocode';

let pending: GeocodedPlace | null = null;

export function setPickedPickupLocation(place: GeocodedPlace) {
  pending = place;
}

export function consumePickedPickupLocation(): GeocodedPlace | null {
  const place = pending;
  pending = null;
  return place;
}
