import type { GalleryArea, GalleryAreaId, GalleryNeighborhood } from "../types";
import {
  getGalleryInventoryTrust,
  getGalleryVisitStatus,
  type GalleryWalkPlan
} from "./galleryDiscovery";
import type { GalleryRouteUsabilityReport } from "./galleryBetaReadiness";
import type { WalkerImageReadinessReport } from "./galleryVisuals";

export type WalkerStartPointMode =
  | "route-first-stop"
  | "market-center"
  | "neighborhood-anchor"
  | "custom-address"
  | "browser-location";

export type WalkerStartPointPreference = {
  mode: WalkerStartPointMode;
  label?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type WalkerStartPointOption = {
  mode: WalkerStartPointMode;
  label: string;
  detail: string;
  recommended: boolean;
  available: boolean;
};

export type WalkerWalkReadinessItem = {
  id: string;
  label: string;
  detail: string;
  status: "ready" | "watch" | "blocked";
};

export type WalkerWalkReadinessReport = {
  label: string;
  tone: "ready" | "watch" | "thin";
  localTimeLabel: string;
  startPointLabel: string;
  startPointDetail: string;
  summary: string;
  checklist: WalkerWalkReadinessItem[];
  warnings: string[];
  primaryActionCopy: string;
};

export type WalkerRouteMapHandoff = {
  routeMapUrl?: string;
  startPointLabel: string;
  startPointDetail: string;
  usedCustomStart: boolean;
};

export type WalkerFieldTestGuide = {
  title: string;
  subtitle: string;
  shortcuts: Array<{
    id: "camogli-centro" | "camogli-waterfront" | "camogli-hill";
    label: string;
    neighborhood: string;
    detail: string;
    warning?: string;
  }>;
};

export type WalkerOfflineReadinessSummary = {
  label: string;
  detail: string;
  cachedAssumptions: string[];
  needsNetwork: string[];
  serviceWorkerRecommended: boolean;
};

function getMarketTime(area?: GalleryArea, referenceNow = new Date().toISOString()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: area?.timezone ?? "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(referenceNow));
}

function getStatus(tone: boolean, watch = false): WalkerWalkReadinessItem["status"] {
  if (tone) return "ready";

  return watch ? "watch" : "blocked";
}

function canUseBrowserLocation(): boolean {
  const maybeNavigator = globalThis as unknown as {
    navigator?: { geolocation?: unknown };
  };

  return Boolean(maybeNavigator.navigator?.geolocation);
}

function getMapQuery(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function getCoordinateQuery(latitude?: number, longitude?: number): string | undefined {
  return typeof latitude === "number" && typeof longitude === "number"
    ? `${latitude},${longitude}`
    : undefined;
}

function getStopQuery(stop: GalleryWalkPlan["stops"][number]): string {
  return `${stop.exhibition.galleryName}, ${stop.exhibition.address}`;
}

function getStartPointQuery(input: {
  area?: GalleryArea;
  neighborhoods: GalleryNeighborhood[];
  walkPlan: GalleryWalkPlan;
  preference?: WalkerStartPointPreference;
}): { query?: string; label: string; detail: string; usedCustomStart: boolean } {
  const mode = input.preference?.mode ?? "route-first-stop";
  const firstStop = input.walkPlan.stops[0];
  const neighborhoodAnchor = input.neighborhoods.find(
    (neighborhood) =>
      neighborhood.areaId === input.walkPlan.areaId &&
      neighborhood.name === input.walkPlan.neighborhood
  );

  if (mode === "custom-address" && input.preference?.address) {
    return {
      query: input.preference.address,
      label: input.preference.address,
      detail: "Custom start included in the full-route map handoff.",
      usedCustomStart: true
    };
  }

  if (mode === "browser-location") {
    const coordinateQuery = getCoordinateQuery(input.preference?.latitude, input.preference?.longitude);

    return {
      query: coordinateQuery,
      label: coordinateQuery ? "Your browser location" : "Browser location pending",
      detail: coordinateQuery
        ? "Browser coordinates are included in the full-route map handoff."
        : "Location permission or coordinates are unavailable; Walker falls back to the first route stop.",
      usedCustomStart: Boolean(coordinateQuery)
    };
  }

  if (mode === "neighborhood-anchor" && neighborhoodAnchor) {
    return {
      query: getCoordinateQuery(neighborhoodAnchor.anchor.latitude, neighborhoodAnchor.anchor.longitude),
      label: `${neighborhoodAnchor.name} anchor`,
      detail: `${neighborhoodAnchor.walkLabel} is included as the route origin.`,
      usedCustomStart: true
    };
  }

  if (mode === "market-center") {
    return {
      query: `${input.area?.name ?? input.walkPlan.areaId.toUpperCase()}, ${input.area?.region ?? ""}`.trim(),
      label: `${input.area?.name ?? input.walkPlan.areaId.toUpperCase()} center`,
      detail: "The market center is included as the route origin.",
      usedCustomStart: true
    };
  }

  return {
    query: firstStop ? getStopQuery(firstStop) : undefined,
    label: firstStop?.exhibition.galleryName ?? "First route stop",
    detail: "The route starts at the first planned stop.",
    usedCustomStart: false
  };
}

export function createWalkerRouteMapHandoff(input: {
  area?: GalleryArea;
  neighborhoods: GalleryNeighborhood[];
  walkPlan: GalleryWalkPlan;
  preference?: WalkerStartPointPreference;
}): WalkerRouteMapHandoff {
  if (input.walkPlan.stops.length === 0) {
    return {
      startPointLabel: "No route start",
      startPointDetail: "No route stops are ready for a map handoff yet.",
      usedCustomStart: false
    };
  }

  const start = getStartPointQuery(input);
  const routeStops = input.walkPlan.stops.map(getStopQuery);
  const origin = start.query ?? routeStops[0];
  const destination = routeStops[routeStops.length - 1] ?? origin;
  const waypointStops = start.usedCustomStart ? routeStops.slice(0, -1) : routeStops.slice(1, -1);
  const waypointQuery =
    waypointStops.length > 0 ? `&waypoints=${getMapQuery(waypointStops.join("|"))}` : "";

  return {
    routeMapUrl: `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${getMapQuery(
      origin ?? ""
    )}&destination=${getMapQuery(destination ?? origin ?? "")}${waypointQuery}`,
    startPointLabel: start.label,
    startPointDetail: start.detail,
    usedCustomStart: start.usedCustomStart
  };
}

export function getWalkerStartPointOptions(input: {
  area?: GalleryArea;
  neighborhoods: GalleryNeighborhood[];
  walkPlan: GalleryWalkPlan;
  preference?: WalkerStartPointPreference;
}): WalkerStartPointOption[] {
  const neighborhoodAnchor = input.neighborhoods.find(
    (neighborhood) =>
      neighborhood.areaId === input.walkPlan.areaId &&
      neighborhood.name === input.walkPlan.neighborhood
  );
  const activeMode = input.preference?.mode ?? "route-first-stop";

  return [
    {
      mode: "route-first-stop",
      label: "Route first stop",
      detail: `Start at ${input.walkPlan.stops[0]?.exhibition.galleryName ?? "the first verified stop"}.`,
      recommended: activeMode === "route-first-stop",
      available: input.walkPlan.stops.length > 0
    },
    {
      mode: "market-center",
      label: "Area center",
      detail: `Use ${input.area?.name ?? input.walkPlan.areaId.toUpperCase()} as the planning origin.`,
      recommended: activeMode === "market-center",
      available: true
    },
    {
      mode: "neighborhood-anchor",
      label: "Neighborhood anchor",
      detail: neighborhoodAnchor
        ? `${neighborhoodAnchor.walkLabel} in ${neighborhoodAnchor.name}.`
        : `Use the ${input.walkPlan.neighborhood} walk anchor.`,
      recommended: activeMode === "neighborhood-anchor",
      available: Boolean(neighborhoodAnchor)
    },
    {
      mode: "custom-address",
      label: "Custom address",
      detail: input.preference?.address
        ? `Manual start: ${input.preference.address}.`
        : "Manual start point; distances remain route-estimated until coordinates are added.",
      recommended: activeMode === "custom-address",
      available: true
    },
    {
      mode: "browser-location",
      label: "Use my location",
      detail: "Optional browser permission; Walker still works with manual starts.",
      recommended: activeMode === "browser-location",
      available: canUseBrowserLocation()
    }
  ];
}

export function createWalkerWalkReadinessReport(input: {
  area?: GalleryArea;
  walkPlan: GalleryWalkPlan;
  routeUsabilityReport: GalleryRouteUsabilityReport;
  startPointPreference?: WalkerStartPointPreference;
  referenceNow: string;
}): WalkerWalkReadinessReport {
  const verifiedCount = input.walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  ).length;
  const officialLinkCount = input.walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).hasOfficialLink
  ).length;
  const openUsableCount = input.walkPlan.stops.filter(
    (stop) => stop.status === "open-now" || stop.status === "opens-later"
  ).length;
  const closedStopCount = input.walkPlan.stops.length - openUsableCount;
  const opensLaterCount = input.walkPlan.stops.filter((stop) => stop.status === "opens-later").length;
  const longLegCount = input.walkPlan.legs.filter((leg) => leg.walkingMinutes >= 18).length;
  const officialCheckMissingCount = input.walkPlan.stops.filter(
    (stop) => !stop.exhibition.sourceCheckedAt && !stop.exhibition.verifiedAsOf
  ).length;
  const needsNetwork = input.walkPlan.stops.some(
    (stop) => getGalleryVisitStatus(stop.exhibition, input.referenceNow) !== "open-now"
  );
  const startPointMode = input.startPointPreference?.mode ?? "route-first-stop";
  const startPointLabel =
    startPointMode === "custom-address" && input.startPointPreference?.address
      ? input.startPointPreference.address
      : startPointMode === "market-center"
        ? `${input.area?.name ?? input.walkPlan.areaId.toUpperCase()} center`
        : startPointMode === "neighborhood-anchor"
          ? `${input.walkPlan.neighborhood} anchor`
          : startPointMode === "browser-location"
            ? "Your browser location"
            : input.walkPlan.stops[0]?.exhibition.galleryName ?? "First route stop";
  const checklist: WalkerWalkReadinessItem[] = [
    {
      id: "official-links",
      label: "Official links",
      detail: `${officialLinkCount}/${input.walkPlan.stops.length} stops include official public links.`,
      status: getStatus(officialLinkCount === input.walkPlan.stops.length, officialLinkCount > 0)
    },
    {
      id: "verified-supply",
      label: "Verified supply",
      detail: `${verifiedCount}/${input.walkPlan.stops.length} route stops are verified/source-backed.`,
      status: getStatus(verifiedCount >= Math.min(3, input.walkPlan.stops.length), verifiedCount > 0)
    },
    {
      id: "open-status",
      label: "Open-status confidence",
      detail:
        closedStopCount === 0
          ? "No closed stops in this route window."
          : `${closedStopCount} stop${closedStopCount === 1 ? "" : "s"} may need a swap or time check.`,
      status: getStatus(closedStopCount === 0, closedStopCount <= 1)
    },
    {
      id: "walking-load",
      label: "Walking load",
      detail:
        longLegCount === 0
          ? `${input.walkPlan.totalDistanceMiles.toFixed(1)} mi with practical legs.`
          : `${longLegCount} longer transfer${longLegCount === 1 ? "" : "s"}; check timing.`,
      status: getStatus(longLegCount === 0, longLegCount <= 1)
    }
  ];
  const blockedCount = checklist.filter((item) => item.status === "blocked").length;
  const watchCount = checklist.filter((item) => item.status === "watch").length;
  const tone: WalkerWalkReadinessReport["tone"] =
    input.walkPlan.readinessLevel !== "ready" || blockedCount > 1
      ? "thin"
      : watchCount > 0 || input.routeUsabilityReport.warnings.length > 0
        ? "watch"
        : "ready";
  const label =
    tone === "ready" ? "Ready to start" : tone === "watch" ? "Ready with checks" : "Thin field route";
  const warnings = [
    ...input.routeUsabilityReport.warnings.slice(0, 2).map((warning) => warning.label),
    closedStopCount > 0 ? "Swap closed stops before walking" : undefined,
    opensLaterCount > 0 ? "Some stops open later" : undefined,
    longLegCount > 0 ? "Long walking leg; check effort" : undefined,
    officialCheckMissingCount > 0 ? "Some stops need official re-check" : undefined,
    needsNetwork ? "Verify live hours before walking" : undefined,
    input.walkPlan.areaId === "camogli" ? "Camogli is a cultural-walk test, not a dense gallery market" : undefined,
    input.walkPlan.areaId === "camogli" && input.walkPlan.neighborhood === "San Rocco / Ruta"
      ? "Hill-view route: use daylight and check effort"
      : undefined
  ].filter((item): item is string => Boolean(item));

  return {
    label,
    tone,
    localTimeLabel: getMarketTime(input.area, input.referenceNow),
    startPointLabel,
    startPointDetail:
      startPointMode === "browser-location"
        ? "Browser location is optional and permission-based; external maps handle live navigation."
        : "Walker uses a manual/demo start point and hands off live navigation to external maps.",
    summary: `${input.walkPlan.stops.length} stops, ${input.walkPlan.totalMinutes} min, ${input.walkPlan.totalDistanceMiles.toFixed(1)} mi.`,
    checklist,
    warnings,
    primaryActionCopy: tone === "thin" ? "Review before start" : "Start walk"
  };
}

export function createWalkerFieldTestGuide(input: {
  areaId: GalleryAreaId;
}): WalkerFieldTestGuide | undefined {
  if (input.areaId !== "camogli") return undefined;

  return {
    title: "Tonight in Camogli",
    subtitle: "Pick the field-test route that matches daylight, hills, and official-link confidence.",
    shortcuts: [
      {
        id: "camogli-centro",
        label: "Compact center",
        neighborhood: "Camogli Centro",
        detail: "Shortest civic-and-maritime walk for testing Walker around town."
      },
      {
        id: "camogli-waterfront",
        label: "Waterfront heritage",
        neighborhood: "Porto / Waterfront",
        detail: "Coastal heritage anchors with low walking friction."
      },
      {
        id: "camogli-hill",
        label: "Hill-view walk",
        neighborhood: "San Rocco / Ruta",
        detail: "Scenic but steeper; best with daylight and extra time.",
        warning: "Check route effort before starting."
      }
    ]
  };
}

export function createWalkerOfflineReadinessSummary(input: {
  imageReadiness?: WalkerImageReadinessReport;
  hasServiceWorker: boolean;
}): WalkerOfflineReadinessSummary {
  return {
    label: input.hasServiceWorker ? "Offline shell ready" : "Offline-friendly preview",
    detail: input.hasServiceWorker
      ? "Walker caches the app shell, local data, icons, fonts, and checked-in gallery imagery after export."
      : "Walker uses checked-in data and images, but no service worker is registered yet.",
    cachedAssumptions: [
      "Checked-in gallery inventory and taste quiz data are available without runtime scraping.",
      `${input.imageReadiness?.totalAssets ?? 0} visual asset records describe image provenance.`,
      "LocalStorage keeps saved routes, active walks, notes, taste, and beta feedback on this device."
    ],
    needsNetwork: [
      "Official gallery links and live hours should be verified before walking.",
      "External map links need network connectivity for turn-by-turn navigation.",
      "Future real photo ingestion still requires rights review."
    ],
    serviceWorkerRecommended: !input.hasServiceWorker
  };
}
