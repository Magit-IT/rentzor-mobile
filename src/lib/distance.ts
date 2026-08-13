/**
 * Distance formatting for item cards. Mirrors rentzor-marketplace's
 * getDistanceBadge (ItemCard.tsx) so mobile and web read identically:
 * metres below 1km, one decimal below 10km, whole km above.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${(distanceKm * 1000).toFixed(0)}m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${distanceKm.toFixed(0)} km`;
}

/** Card subtitle: "250m • Olmazor" — distance only when it is known. */
export function formatCardLocation(
  distanceKm: number | null | undefined,
  location: string | null | undefined,
): string {
  const place = location?.trim() || '';
  if (distanceKm === null || distanceKm === undefined) return place;
  const distance = formatDistance(distanceKm);
  return place ? `${distance} • ${place}` : distance;
}
