import type { GalleryWalkPlan } from "./galleryDiscovery";
import {
  getDaysUntilGalleryCloses,
  getGalleryInventoryTrust,
  isGalleryOpeningTonight
} from "./galleryDiscovery";
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
  detail: string;
};

export type GalleryRouteStopAdvisorySeverity = "start" | "go" | "watch" | "avoid";

export type GalleryRouteStopAdvisory = {
  stopId: string;
  stopNumber: number;
  label: string;
  detail: string;
  severity: GalleryRouteStopAdvisorySeverity;
  reasons: string[];
};

export type GalleryRouteConfidence = {
  score: number;
  label: string;
  tone: "strong" | "good" | "caution" | "thin";
  bestStartLabel: string;
  routeAdvice: string[];
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
  confidence: GalleryRouteConfidence;
  stopAdvisories: GalleryRouteStopAdvisory[];
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

function getClockLabel(time: string): string {
  const [hourText = "0", minuteText = "00"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour >= 12 ? "PM" : "AM";

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getEventTimeLabel(iso?: string): string | undefined {
  if (!iso) {
    return undefined;
  }

  const match = iso.match(/T(\d{2}):(\d{2})/);

  return match ? getClockLabel(`${match[1]}:${match[2]}`) : undefined;
}

function getTodayOpeningLabel(walkPlan: GalleryWalkPlan): string | undefined {
  const startStop = walkPlan.stops[0];

  if (!startStop) {
    return undefined;
  }

  const day = new Date(walkPlan.startsAt).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const todayHours = startStop.exhibition.hours.find((hours) => hours.day === day);

  return todayHours ? getClockLabel(todayHours.opens) : undefined;
}

function getSegmentDetail(walkingMinutes: number, distanceMiles: number): string {
  if (walkingMinutes <= 6) {
    return "Very close hop";
  }

  if (walkingMinutes <= 12) {
    return "Easy gallery-to-gallery walk";
  }

  if (distanceMiles >= 0.8) {
    return "Longer transfer; check timing";
  }

  return "Moderate walk";
}

function getStopAdvisory(input: {
  walkPlan: GalleryWalkPlan;
  stopIndex: number;
  previousSegment?: GalleryRouteMapSegment;
}): GalleryRouteStopAdvisory {
  const stop = input.walkPlan.stops[input.stopIndex];

  if (!stop) {
    return {
      stopId: `missing-stop-${input.stopIndex}`,
      stopNumber: input.stopIndex + 1,
      label: "Route gap",
      detail: "This route position needs a stop before it can be used.",
      severity: "avoid",
      reasons: ["Needs route stop"]
    };
  }

  const trust = getGalleryInventoryTrust(stop.exhibition);
  const daysUntilClose = getDaysUntilGalleryCloses(stop.exhibition, input.walkPlan.startsAt);
  const reasons = [
    input.stopIndex === 0 ? "Start here" : undefined,
    stop.status === "open-now" ? "Open now" : undefined,
    stop.status === "opens-later" ? "Opens later" : undefined,
    stop.status !== "open-now" && stop.status !== "opens-later" ? "Closed now" : undefined,
    trust.isVerified ? "Verified source" : undefined,
    trust.isFixture ? "Fixture/demo" : undefined,
    !trust.isFixture && !trust.isVerified ? "Needs source review" : undefined,
    daysUntilClose <= 7 ? "Closing soon" : undefined,
    isGalleryOpeningTonight(stop.exhibition, input.walkPlan.startsAt) ? "Opening tonight" : undefined,
    stop.groupedExhibitionCount > 1 ? `${stop.groupedExhibitionCount} shows here` : undefined,
    input.previousSegment && input.previousSegment.walkingMinutes <= 8 ? "Nearby hop" : undefined
  ].filter((reason): reason is string => Boolean(reason));
  const hasTimingRisk = stop.status !== "open-now" && stop.status !== "opens-later";
  const hasTrustRisk = trust.isFixture || (!trust.isVerified && trust.kind !== "partner-submitted");
  const severity: GalleryRouteStopAdvisorySeverity =
    input.stopIndex === 0 && !hasTimingRisk && !hasTrustRisk
      ? "start"
      : hasTimingRisk
        ? "avoid"
        : hasTrustRisk || daysUntilClose <= 3
          ? "watch"
          : "go";
  const label =
    severity === "start"
      ? "Best start"
      : severity === "avoid"
        ? "Avoid if possible"
        : severity === "watch"
          ? "Watch timing/trust"
          : "Good stop";
  const detail =
    severity === "avoid"
      ? `${stop.exhibition.galleryName} is not open in the current route window; swap it if alternatives exist.`
      : severity === "watch"
        ? `${stop.exhibition.galleryName} is useful, but check ${trust.isVerified ? "closing timing" : "source trust"} before relying on it.`
        : input.stopIndex === 0
          ? `Start at ${stop.exhibition.galleryName} because it is open, close to the route, and source-labeled.`
          : `${stop.exhibition.galleryName} keeps the route nearby and practical.`;

  return {
    stopId: stop.exhibition.id,
    stopNumber: stop.stopNumber,
    label,
    detail,
    severity,
    reasons: reasons.slice(0, 4)
  };
}

function createRouteConfidence(
  walkPlan: GalleryWalkPlan,
  segments: GalleryRouteMapSegment[]
): GalleryRouteConfidence {
  const stopCount = walkPlan.stops.length;

  if (stopCount === 0) {
    return {
      score: 0,
      label: "Not walk-ready",
      tone: "thin",
      bestStartLabel: "No strong start yet",
      routeAdvice: ["Try another route mode or neighborhood with verified open stops."]
    };
  }

  const trustStates = walkPlan.stops.map((stop) => getGalleryInventoryTrust(stop.exhibition));
  const verifiedCount = trustStates.filter((trust) => trust.isVerified).length;
  const fixtureCount = trustStates.filter((trust) => trust.isFixture).length;
  const reviewCount = trustStates.filter(
    (trust) => !trust.isVerified && !trust.isFixture
  ).length;
  const openUsableCount = walkPlan.stops.filter(
    (stop) => stop.status === "open-now" || stop.status === "opens-later"
  ).length;
  const uniqueGalleryCount = new Set(
    walkPlan.stops.map((stop) => `${stop.exhibition.galleryName}-${stop.exhibition.address}`)
  ).size;
  const baseScore =
    (walkPlan.readinessLevel === "ready" ? 22 : walkPlan.readinessLevel === "thin" ? 10 : 2) +
    (verifiedCount / stopCount) * 34 +
    (openUsableCount / stopCount) * 20 +
    (uniqueGalleryCount / stopCount) * 10 +
    (walkPlan.totalDistanceMiles <= 1.5 ? 10 : walkPlan.totalDistanceMiles <= 2.2 ? 6 : 2) +
    (walkPlan.canStartNow ? 4 : 0);
  const penalty = fixtureCount * 7 + reviewCount * 4;
  const score = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));
  const tone: GalleryRouteConfidence["tone"] =
    score >= 82 ? "strong" : score >= 68 ? "good" : score >= 48 ? "caution" : "thin";
  const label =
    tone === "strong"
      ? "Strong tonight route"
      : tone === "good"
        ? "Good walk"
        : tone === "caution"
          ? "Usable with caveats"
          : "Thin route";
  const startStop = walkPlan.stops[0];
  const receptionTime = getEventTimeLabel(startStop?.exhibition.receptionAt);
  const openingTime = getTodayOpeningLabel(walkPlan);
  const bestStartLabel =
    walkPlan.mode === "opening-night" && receptionTime
      ? `Best start: ${receptionTime} at ${startStop?.exhibition.galleryName}`
      : walkPlan.canStartNow
        ? `Best start: now at ${startStop?.exhibition.galleryName}`
        : openingTime
          ? `Best start: ${openingTime} at ${startStop?.exhibition.galleryName}`
          : `Best start: timing needs review`;
  const routeAdvice = [
    `${verifiedCount}/${stopCount} stops are verified official-page records.`,
    fixtureCount > 0
      ? `${fixtureCount} demo stop${fixtureCount === 1 ? "" : "s"} should be replaced when verified alternatives exist.`
      : undefined,
    reviewCount > 0
      ? `${reviewCount} stop${reviewCount === 1 ? "" : "s"} need source review before heavy promotion.`
      : undefined,
    segments.some((segment) => segment.walkingMinutes >= 18)
      ? "One leg is long; check timing before starting."
      : "Walking legs stay practical for an on-foot gallery loop."
  ].filter((item): item is string => Boolean(item));

  return {
    score,
    label,
    tone,
    bestStartLabel,
    routeAdvice
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
    label: `${leg.walkingMinutes} min walk - ${leg.distanceMiles.toFixed(1)} mi`,
    detail: getSegmentDetail(leg.walkingMinutes, leg.distanceMiles)
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
  const confidence = createRouteConfidence(walkPlan, segments);
  const stopAdvisories = walkPlan.stops.map((_, stopIndex) =>
    getStopAdvisory({
      walkPlan,
      stopIndex,
      previousSegment: stopIndex > 0 ? segments[stopIndex - 1] : undefined
    })
  );

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
    mapReadinessLabel,
    confidence,
    stopAdvisories
  };
}
