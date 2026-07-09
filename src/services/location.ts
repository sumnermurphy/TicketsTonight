import { areas } from "../data/catalog";
import type { Area, Coordinates, LocationFix, LocationProvider } from "../types";

const EARTH_RADIUS_MILES = 3958.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function getDistanceBetweenCoordinates(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(haversine));
}

export function findNearestArea(
  coordinates: Coordinates,
  candidates: Area[] = areas
): { area: Area; distanceMiles: number } | undefined {
  return candidates
    .map((area) => ({
      area,
      distanceMiles: getDistanceBetweenCoordinates(coordinates, area.coordinates)
    }))
    .sort((first, second) => first.distanceMiles - second.distanceMiles)[0];
}

export class DemoLocationProvider implements LocationProvider {
  id = "demo-location";
  label = "Approximate location";

  async getCurrentLocation(): Promise<LocationFix> {
    return {
      coordinates: {
        latitude: 40.6782,
        longitude: -73.9442
      },
      source: "demo",
      accuracyMeters: 1800,
      resolvedAt: new Date().toISOString()
    };
  }
}

export const locationProvider = new DemoLocationProvider();
