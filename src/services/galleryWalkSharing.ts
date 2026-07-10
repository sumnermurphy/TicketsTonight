import type { GalleryExhibition } from "../types";
import { getGalleryInventoryTrust, type GalleryWalkPlan } from "./galleryDiscovery";
import type { GalleryWalkRecap, GalleryWalkSession } from "./galleryWalkSession";

export type GallerySavedWalk = {
  id: string;
  title: string;
  areaId: GalleryExhibition["areaId"];
  mode: GalleryWalkPlan["mode"];
  neighborhood?: string;
  stopIds: string[];
  summary: string;
  routeMapUrl?: string;
  itineraryText: string;
  savedAt: string;
  completedAt?: string;
};

export type GalleryWalkSharePayload = {
  title: string;
  text: string;
  url?: string;
};

export function createGalleryWalkItineraryText(
  walkPlan: GalleryWalkPlan,
  session?: GalleryWalkSession
): string {
  const lines = [
    walkPlan.title,
    walkPlan.summary,
    walkPlan.guidance,
    "",
    ...walkPlan.stops.map((stop) => {
      const trust = getGalleryInventoryTrust(stop.exhibition);

      return [
        `${stop.stopNumber}. ${stop.exhibition.galleryName}`,
        `   ${stop.exhibition.title}`,
        `   ${stop.exhibition.address}`,
        `   ${trust.checkedLabel} | ${trust.sourceLabel}`,
        `   Map: ${stop.mapUrl}`,
        `   Source: ${stop.exhibition.externalUrl}`
      ].join("\n");
    })
  ];

  if (walkPlan.routeMapUrl) {
    lines.push("", `Full route: ${walkPlan.routeMapUrl}`);
  }

  if (session?.status === "completed") {
    lines.push("", `Completed: ${session.completedAt ?? session.updatedAt}`);
  }

  return lines.join("\n");
}

export function createGalleryWalkShareSummary(
  walkPlan: GalleryWalkPlan,
  recap?: GalleryWalkRecap
): GalleryWalkSharePayload {
  const recapCopy = recap
    ? `${recap.visitedStopCount} visited, ${recap.skippedStopCount} skipped.`
    : walkPlan.summary;

  return {
    title: walkPlan.title,
    text: `${walkPlan.title}\n${recapCopy}\n${walkPlan.guidance}${
      walkPlan.routeMapUrl ? `\n${walkPlan.routeMapUrl}` : ""
    }`,
    url: walkPlan.routeMapUrl
  };
}

export function createSavedGalleryWalk(
  walkPlan: GalleryWalkPlan,
  session: GalleryWalkSession | undefined,
  now: string
): GallerySavedWalk {
  return {
    id: `${walkPlan.areaId}-${walkPlan.mode}-${walkPlan.neighborhood ?? "market"}-${now}`,
    title: walkPlan.title,
    areaId: walkPlan.areaId,
    mode: walkPlan.mode,
    neighborhood: walkPlan.neighborhood,
    stopIds: walkPlan.stops.map((stop) => stop.exhibition.id),
    summary: walkPlan.summary,
    routeMapUrl: walkPlan.routeMapUrl,
    itineraryText: createGalleryWalkItineraryText(walkPlan, session),
    savedAt: now,
    completedAt: session?.status === "completed" ? session.completedAt : undefined
  };
}
