/**
 * A household's home location is personal data. It is recorded no finer than
 * a phone's GPS can tell (5 decimals, about 1 m; 6 claimed about 0.1 m), and
 * a link to an outside map shares it at about 11 m (4 decimals): enough to
 * find the area, not the exact door.
 */
export const GPS_DECIMALS = 5;
export const SHARED_GPS_DECIMALS = 4;

/** `value` rounded to `decimals` places; null stays null. */
export function roundCoordinate(value: number | null | undefined, decimals = GPS_DECIMALS): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** An openstreetmap.org link to the rounded location, or null without a full position. */
export function sharedMapLink(lat: number | null | undefined, lng: number | null | undefined): string | null {
  const roundedLat = roundCoordinate(lat, SHARED_GPS_DECIMALS);
  const roundedLng = roundCoordinate(lng, SHARED_GPS_DECIMALS);
  if (roundedLat === null || roundedLng === null) return null;
  return `https://www.openstreetmap.org/?mlat=${roundedLat}&mlon=${roundedLng}#map=16/${roundedLat}/${roundedLng}`;
}
