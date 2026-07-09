import type { GalleryWalkPlan } from "./galleryDiscovery";
import type { GalleryWalkSession, GalleryWalkStopProgress } from "./galleryWalkSession";
import { getActiveWalkProgress } from "./galleryWalkSession";

export type GalleryRouteMapPin = {
  id: string;
  stopNumber: number;
  galleryName: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  progress: GalleryWalkStopProgress;
  isCurrent: boolean;
  isNext: boolean;
};

export type GalleryRouteMapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
  centerLatitude: number;
  centerLongitude: number;
};

export type GalleryRouteMapPathPoint = {
  id: string;
  latitude: number;
  longitude: number;
  xPercent: number;
  yPercent: number;
};

export type GalleryRouteMapProjectedPin = GalleryRouteMapPin & GalleryRouteMapPathPoint;

export type GalleryRouteMapSegment = {
  id: string;
  fromStopId: string;
  toStopId: string;
  walkingMinutes: number;
  distanceMiles: number;
  mapUrl: string;
  label: string;
};

export type GalleryRouteMapModel = {
  title: string;
  summary: string;
  bounds: GalleryRouteMapBounds;
  pins: GalleryRouteMapProjectedPin[];
  pathPoints: GalleryRouteMapPathPoint[];
  segments: GalleryRouteMapSegment[];
  routeMapUrl?: string;
  currentPin?: GalleryRouteMapProjectedPin;
  nextPin?: GalleryRouteMapProjectedPin;
  totalWalkingMinutes: number;
  totalDistanceMiles: number;
  mapReadinessLabel: string;
};

function clampPercent(value: number): number {
  return Math.min(92, Math.max(8, Math.round(value * 10) / 10));
}

function getRouteMapBounds(pins: GalleryRouteMapPin[]): GalleryRouteMapBounds {
  const latitudes = pins.map((pin) => pin.latitude);
  const longitudes = pins.map((pin) => pin.longitude);
  const north = Math.max(...latitudes);
  const south = Math.min(...latitudes);
  const east = Math.max(...longitudes);
  const west = Math.min(...longitudes);
  const minimumSpan = 0.006;
  const latSpan = Math.max(north - south, minimumSpan);
  const longSpan = Math.max(east - west, minimumSpan);
  const centerLatitude = (north + south) / 2;
  const centerLongitude = (east + west) / 2;

  return {
    north: centerLatitude + latSpan / 2,
    south: centerLatitude - latSpan / 2,
    east: centerLongitude + longSpan / 2,
    west: centerLongitude - longSpan / 2,
    centerLatitude,
    centerLongitude
  };
}

function projectRoutePoint(pin: GalleryRouteMapPin, bounds: GalleryRouteMapBounds): GalleryRouteMapPathPoint {
  const longitudeSpan = Math.max(bounds.east - bounds.west, 0.0001);
  const latitudeSpan = Math.max(bounds.north - bounds.south, 0.0001);

  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    xPercent: clampPercent(((pin.longitude - bounds.west) / longitudeSpan) * 84 + 8),
    yPercent: clampPercent(((bounds.north - pin.latitude) / latitudeSpan) * 76 + 12)
  };
}

export function createGalleryRouteMapModel(
  walkPlan: GalleryWalkPlan,
  session?: GalleryWalkSession
): GalleryRouteMapModel {
  const progress = session ? getActiveWalkProgress(session, walkPlan) : undefined;
  const basePins = walkPlan.stops.map<GalleryRouteMapPin>((stop) => {
    const stopId = stop.exhibition.id;
    const pinProgress =
      progress?.stopProgressById[stopId] ??
      (walkPlan.startStopId === stopId
        ? "current"
        : walkPlan.nextStopId === stopId
          ? "next"
          : "planned");

    return {
      id: stopId,
      stopNumber: stop.stopNumber,
      galleryName: stop.exhibition.galleryName,
      address: stop.exhibition.address,
      neighborhood: stop.exhibition.neighborhood,
      latitude: stop.exhibition.coordinates.latitude,
      longitude: stop.exhibition.coordinates.longitude,
      mapUrl: stop.mapUrl,
      progress: pinProgress,
      isCurrent: pinProgress === "current",
      isNext: pinProgress === "next"
    };
  });
  const bounds =
    basePins.length > 0
      ? getRouteMapBounds(basePins)
      : {
          north: 0,
          south: 0,
          east: 0,
          west: 0,
          centerLatitude: 0,
          centerLongitude: 0
        };
  const pins = basePins.map<GalleryRouteMapProjectedPin>((pin) => ({
    ...pin,
    ...projectRoutePoint(pin, bounds)
  }));
  const pathPoints = pins.map<GalleryRouteMapPathPoint>(
    ({ id, latitude, longitude, xPercent, yPercent }) => ({
      id,
      latitude,
      longitude,
      xPercent,
      yPercent
    })
  );
  const segments = walkPlan.legs.map<GalleryRouteMapSegment>((leg) => ({
    id: `${leg.fromExhibitionId}-${leg.toExhibitionId}`,
    fromStopId: leg.fromExhibitionId,
    toStopId: leg.toExhibitionId,
    walkingMinutes: leg.walkingMinutes,
    distanceMiles: leg.distanceMiles,
    mapUrl: leg.mapUrl,
    label: `${leg.walkingMinutes} min walk - ${leg.distanceMiles.toFixed(1)} mi`
  }));
  const currentPin =
    pins.find((pin) => pin.id === progress?.currentStopId) ??
    pins.find((pin) => pin.isCurrent);
  const nextPin =
    pins.find((pin) => pin.id === progress?.nextStopId) ??
    pins.find((pin) => pin.isNext);
  const mapReadinessLabel =
    pins.length === 0
      ? "No mapped stops yet"
      : walkPlan.readinessLevel === "ready"
        ? "Walk map ready"
        : walkPlan.readinessLevel === "thin"
          ? "Thin mapped route"
          : "Map needs more verified stops";

  return {
    title: walkPlan.title,
    summary: walkPlan.summary,
    bounds,
    pins,
    pathPoints,
    segments,
    routeMapUrl: walkPlan.routeMapUrl,
    currentPin,
    nextPin,
    totalWalkingMinutes: segments.reduce((total, segment) => total + segment.walkingMinutes, 0),
    totalDistanceMiles: walkPlan.totalDistanceMiles,
    mapReadinessLabel
  };
}
