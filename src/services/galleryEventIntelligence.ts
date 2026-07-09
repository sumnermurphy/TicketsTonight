import type { GalleryAreaId, GalleryExhibition, GallerySpecialEvent } from "../types";
import {
  createGalleryWalkPlan,
  getDaysUntilGalleryCloses,
  getGalleryInventoryTrust,
  getGalleryVisitStatus,
  isGalleryOpeningTonight,
  type GalleryWalkPlan
} from "./galleryDiscovery";

export type GalleryEventSignalKind =
  | "opening"
  | "artist-talk"
  | "rsvp-preview"
  | "closing"
  | "last-look";

export type GalleryEventRouteIntent = "social-opening" | "quiet-verified" | "last-look";

export type GalleryEventSignal = {
  id: string;
  kind: GalleryEventSignalKind;
  exhibition: GalleryExhibition;
  event?: GallerySpecialEvent;
  startsAt?: string;
  label: string;
  timingLabel: string;
  routeFit: "strong" | "usable" | "thin";
  requiresRsvp: boolean;
  sourceLabel: string;
};

const defaultNow = "2026-07-09T15:30:00-04:00";

function getMinutesUntil(iso: string, referenceNow: string): number {
  return Math.round((new Date(iso).getTime() - new Date(referenceNow).getTime()) / 60000);
}

function getTimingLabel(startsAt: string | undefined, referenceNow: string): string {
  if (!startsAt) {
    return "On view now";
  }

  const minutes = getMinutesUntil(startsAt, referenceNow);

  if (minutes < -120) {
    return "Earlier today";
  }

  if (minutes < 0) {
    return "Happening now";
  }

  if (minutes < 60) {
    return `Starts in ${minutes} min`;
  }

  return `Starts in ${Math.round(minutes / 60)} hr`;
}

function getEventKind(event: GallerySpecialEvent): GalleryEventSignalKind | undefined {
  if (event.kind === "opening-reception") {
    return "opening";
  }

  if (event.kind === "artist-talk") {
    return "artist-talk";
  }

  if (event.kind === "rsvp-preview") {
    return "rsvp-preview";
  }

  if (event.kind === "closing-party") {
    return "closing";
  }

  return undefined;
}

export function createGalleryEventSignals(
  exhibitions: GalleryExhibition[],
  referenceNow: string = defaultNow
): GalleryEventSignal[] {
  const today = referenceNow.slice(0, 10);
  const eventSignals = exhibitions.flatMap((exhibition) =>
    exhibition.specialEvents
      .filter((event) => event.startsAt.slice(0, 10) === today)
      .flatMap((event) => {
        const kind = getEventKind(event);

        if (!kind) {
          return [];
        }

        const trust = getGalleryInventoryTrust(exhibition);
        const status = getGalleryVisitStatus(exhibition, referenceNow);

        const routeFit: GalleryEventSignal["routeFit"] =
          trust.isVerified && status !== "closed" ? "strong" : trust.isFixture ? "thin" : "usable";

        return [{
          id: `${exhibition.id}:${event.id}`,
          kind,
          exhibition,
          event,
          startsAt: event.startsAt,
          label: event.title,
          timingLabel: getTimingLabel(event.startsAt, referenceNow),
          routeFit,
          requiresRsvp: Boolean(event.rsvpUrl ?? exhibition.rsvpUrl),
          sourceLabel: trust.sourceLabel
        }];
      })
  );
  const lastLookSignals = exhibitions
    .filter((exhibition) => getDaysUntilGalleryCloses(exhibition, referenceNow) <= 3)
    .map((exhibition) => {
      const trust = getGalleryInventoryTrust(exhibition);

      return {
        id: `${exhibition.id}:last-look`,
        kind: "last-look" as const,
        exhibition,
        startsAt: exhibition.closesAt,
        label: "Last-look window",
        timingLabel: getTimingLabel(exhibition.closesAt, referenceNow),
        routeFit: trust.isVerified ? "strong" as const : "thin" as const,
        requiresRsvp: false,
        sourceLabel: trust.sourceLabel
      };
    });

  return [...eventSignals, ...lastLookSignals].sort((left, right) => {
    const leftTime = left.startsAt ? new Date(left.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.startsAt ? new Date(right.startsAt).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.exhibition.distanceMiles - right.exhibition.distanceMiles;
  });
}

export function createOpeningNightConciergePlan(input: {
  areaId: GalleryAreaId;
  intent: GalleryEventRouteIntent;
  neighborhood?: string;
  savedIds?: string[];
  referenceNow?: string;
  exhibitions?: GalleryExhibition[];
}): GalleryWalkPlan {
  const referenceNow = input.referenceNow ?? defaultNow;
  const exhibitions = input.exhibitions ?? [];
  const marketExhibitions = exhibitions.filter((exhibition) => exhibition.areaId === input.areaId);
  const signalExhibitionIds = new Set(
    createGalleryEventSignals(marketExhibitions, referenceNow)
      .filter((signal) => {
        if (input.intent === "social-opening") {
          return signal.kind === "opening" || signal.kind === "artist-talk" || signal.kind === "rsvp-preview";
        }

        if (input.intent === "last-look") {
          return signal.kind === "closing" || signal.kind === "last-look";
        }

        return getGalleryInventoryTrust(signal.exhibition).isVerified;
      })
      .map((signal) => signal.exhibition.id)
  );
  const mode =
    input.intent === "last-look"
      ? "last-chance"
      : input.intent === "social-opening"
        ? "opening-night"
        : "two-hour";
  const routeExhibitions =
    signalExhibitionIds.size > 0
      ? marketExhibitions.filter((exhibition) => signalExhibitionIds.has(exhibition.id))
      : marketExhibitions;

  return createGalleryWalkPlan({
    areaId: input.areaId,
    mode,
    neighborhood: input.neighborhood,
    savedIds: input.savedIds,
    referenceNow,
    exhibitions: routeExhibitions
  });
}
