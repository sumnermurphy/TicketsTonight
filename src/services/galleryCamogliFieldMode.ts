import type { GalleryAreaId, GalleryExhibition } from "../types";
import {
  getGalleryInventoryTrust,
  getGalleryVisitStatus,
  type GalleryWalkPlan
} from "./galleryDiscovery";

export type CamogliRouteMode = "best-easy-walk" | "centro" | "waterfront" | "hill-walk";

export type CamogliFieldStopLabel = {
  exhibitionId: string;
  primary: string;
  secondary: string;
  warning?: string;
};

export type CamogliFieldGuide = {
  enabled: boolean;
  badge: "Travel test";
  title: "Camogli cultural walk";
  localTimeLabel: string;
  routeMode: CamogliRouteMode;
  routeModeLabel: string;
  routeEffortLabel: string;
  routeEffortDetail: string;
  verifyBeforeYouGoCopy: string;
  inventoryCopy: string;
  officialLinkCopy: string;
  stopLabels: CamogliFieldStopLabel[];
};

export function getCamogliRouteMode(neighborhood?: string): CamogliRouteMode {
  if (neighborhood === "San Rocco / Ruta") return "hill-walk";
  if (neighborhood === "Porto / Waterfront") return "waterfront";
  if (neighborhood === "Camogli Centro") return "centro";

  return "best-easy-walk";
}

function getRouteModeLabel(mode: CamogliRouteMode): string {
  switch (mode) {
    case "centro":
      return "Centro loop";
    case "waterfront":
      return "Waterfront walk";
    case "hill-walk":
      return "Hill walk";
    case "best-easy-walk":
    default:
      return "Best easy walk";
  }
}

export function getCamogliRouteEffort(
  mode: CamogliRouteMode
): Pick<CamogliFieldGuide, "routeEffortLabel" | "routeEffortDetail"> {
  switch (mode) {
    case "hill-walk":
      return {
        routeEffortLabel: "Steeper route",
        routeEffortDetail: "San Rocco / Ruta works best as a scenic cultural walk with extra time and daylight."
      };
    case "waterfront":
      return {
        routeEffortLabel: "Easy waterfront",
        routeEffortDetail: "Shorter coastal hops with official links checked before you leave."
      };
    case "centro":
      return {
        routeEffortLabel: "Compact center",
        routeEffortDetail: "A small civic-and-maritime loop for testing Walker in town."
      };
    case "best-easy-walk":
    default:
      return {
        routeEffortLabel: "Light walk",
        routeEffortDetail: "Walker will prefer verified cultural anchors and short walking legs."
      };
  }
}

function getCamogliStopLabel(exhibition: GalleryExhibition, referenceNow: string): CamogliFieldStopLabel {
  const trust = getGalleryInventoryTrust(exhibition);
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const isOfficial = trust.hasOfficialLink;
  const statusCopy = status === "open-now" ? "Open now" : status === "opens-later" ? "Opens later" : "Check hours";
  const warning = isOfficial ? undefined : "Use an official link before you go.";

  if (exhibition.galleryKind === "heritage-site") {
    return {
      exhibitionId: exhibition.id,
      primary: "Heritage stop",
      secondary: `${statusCopy}. Route context, not a current exhibition.`,
      warning
    };
  }

  if (exhibition.galleryKind === "cultural-venue") {
    return {
      exhibitionId: exhibition.id,
      primary: "Cultural anchor",
      secondary: `${statusCopy}. Check the official programme before walking.`,
      warning
    };
  }

  if (exhibition.galleryKind === "museum") {
    return {
      exhibitionId: exhibition.id,
      primary: "Maritime/civic anchor",
      secondary: `${statusCopy}. Verified from a public source.`,
      warning
    };
  }

  return {
    exhibitionId: exhibition.id,
    primary: "Cultural stop",
    secondary: `${statusCopy}. Use official links before you go.`,
    warning
  };
}

export function createCamogliFieldGuide(input: {
  areaId: GalleryAreaId;
  walkPlan: GalleryWalkPlan;
  exhibitions: GalleryExhibition[];
  referenceNow: string;
}): CamogliFieldGuide | undefined {
  if (input.areaId !== "camogli") return undefined;

  const routeMode = getCamogliRouteMode(input.walkPlan.neighborhood);
  const effort = getCamogliRouteEffort(routeMode);
  const verifiedStops = input.walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  ).length;
  const officialStops = input.walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).hasOfficialLink
  ).length;
  const localTimeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(input.referenceNow));

  return {
    enabled: true,
    badge: "Travel test",
    title: "Camogli cultural walk",
    localTimeLabel,
    routeMode,
    routeModeLabel: getRouteModeLabel(routeMode),
    routeEffortLabel: effort.routeEffortLabel,
    routeEffortDetail: effort.routeEffortDetail,
    verifyBeforeYouGoCopy: "Camogli is a thin cultural-walk test market. Verify hours and programs before walking.",
    inventoryCopy: `${verifiedStops}/${input.walkPlan.stops.length} route stops are verified cultural anchors.`,
    officialLinkCopy: `${officialStops}/${input.walkPlan.stops.length} stops include official public links.`,
    stopLabels: input.walkPlan.stops.map((stop) => getCamogliStopLabel(stop.exhibition, input.referenceNow))
  };
}
