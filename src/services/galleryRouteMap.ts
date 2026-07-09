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
  pins: GalleryRouteMapPin[];
  segments: GalleryRouteMapSegment[];
  routeMapUrl?: string;
  currentPin?: GalleryRouteMapPin;
  nextPin?: GalleryRouteMapPin;
  totalWalkingMinutes: number;
  totalDistanceMiles: number;
  mapReadinessLabel: string;
};

export function createGalleryRouteMapModel(
  walkPlan: GalleryWalkPlan,
  session?: GalleryWalkSession
): GalleryRouteMapModel {
  const progress = session ? getActiveWalkProgress(session, walkPlan) : undefined;
  const pins = walkPlan.stops.map<GalleryRouteMapPin>((stop) => {
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
    pins,
    segments,
    routeMapUrl: walkPlan.routeMapUrl,
    currentPin,
    nextPin,
    totalWalkingMinutes: segments.reduce((total, segment) => total + segment.walkingMinutes, 0),
    totalDistanceMiles: walkPlan.totalDistanceMiles,
    mapReadinessLabel
  };
}
