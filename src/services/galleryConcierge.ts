import type { GalleryAreaId, GalleryExhibition, GalleryLogEntry } from "../types";
import {
  getDaysUntilGalleryCloses,
  getGalleryInventoryTrust,
  getGalleryVisitStatus,
  type GalleryWalkMode,
  type GalleryWalkPlan
} from "./galleryDiscovery";
import type { GalleryEventSignal } from "./galleryEventIntelligence";
import type { GalleryPersonalizedPick } from "./galleryTastePassport";
import type { GalleryWalkProgress, GalleryWalkSession } from "./galleryWalkSession";

export type GalleryConciergeSuggestionKind =
  | "active-current"
  | "active-skip"
  | "opening-soon"
  | "last-look"
  | "taste-match"
  | "route-start"
  | "thin-supply"
  | "share-save";

export type GalleryConciergeSuggestionAction =
  | {
      type: "mark-current-visited";
      stopId: string;
      exhibitionId: string;
    }
  | {
      type: "skip-current";
      stopId: string;
      exhibitionId: string;
    }
  | {
      type: "open-exhibition";
      exhibitionId: string;
    }
  | {
      type: "switch-route-mode";
      mode: GalleryWalkMode;
      neighborhood?: string;
    }
  | {
      type: "start-walk";
    }
  | {
      type: "save-walk";
    }
  | {
      type: "copy-itinerary";
    };

export type GalleryConciergeSuggestion = {
  id: string;
  kind: GalleryConciergeSuggestionKind;
  title: string;
  body: string;
  ctaLabel: string;
  score: number;
  action: GalleryConciergeSuggestionAction;
  exhibitionId?: string;
  galleryName?: string;
  neighborhood?: string;
  trustLabel?: string;
  reasons: string[];
};

export type GalleryConciergeStateIntent = GalleryConciergeSuggestionAction & {
  sourceSuggestionId: string;
};

export type GalleryConciergeSuggestionInput = {
  areaId: GalleryAreaId;
  selectedNeighborhood?: string;
  walkPlan: GalleryWalkPlan;
  activeWalkSession?: GalleryWalkSession;
  activeWalkProgress?: GalleryWalkProgress;
  activeWalkPlan?: GalleryWalkPlan;
  eventSignals?: GalleryEventSignal[];
  personalizedPicks?: GalleryPersonalizedPick[];
  logEntries?: GalleryLogEntry[];
  referenceNow?: string;
};

const defaultNow = "2026-07-09T15:30:00-04:00";

function getLogStatusById(logEntries: GalleryLogEntry[] = []): Map<string, GalleryLogEntry["status"]> {
  return new Map(logEntries.map((entry) => [entry.exhibitionId, entry.status]));
}

function getSuggestionTrustScore(exhibition: GalleryExhibition): number {
  const trust = getGalleryInventoryTrust(exhibition);

  if (trust.isVerified) {
    return 28;
  }

  if (trust.kind === "partner-submitted") {
    return 12;
  }

  if (trust.isFixture) {
    return -18;
  }

  return -8;
}

function getSuggestionStatusScore(exhibition: GalleryExhibition, referenceNow: string): number {
  const status = getGalleryVisitStatus(exhibition, referenceNow);

  if (status === "open-now") {
    return 24;
  }

  if (status === "opens-later") {
    return 14;
  }

  return -36;
}

function uniqueSuggestions(suggestions: GalleryConciergeSuggestion[]): GalleryConciergeSuggestion[] {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = `${suggestion.kind}:${suggestion.exhibitionId ?? suggestion.action.type}:${suggestion.action.type}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function activeWalkSuggestions(input: GalleryConciergeSuggestionInput): GalleryConciergeSuggestion[] {
  const activePlan = input.activeWalkPlan;
  const progress = input.activeWalkProgress;
  const session = input.activeWalkSession;

  if (!activePlan || !progress || session?.status !== "active" || !progress.currentStopId) {
    return [];
  }

  const currentStop = activePlan.stops.find((stop) => stop.exhibition.id === progress.currentStopId);

  if (!currentStop) {
    return [];
  }

  const trust = getGalleryInventoryTrust(currentStop.exhibition);
  const status = getGalleryVisitStatus(currentStop.exhibition, input.referenceNow ?? defaultNow);

  if (status === "closed-for-day" || status === "closed-today" || status === "closed") {
    return [{
      id: `skip-closed-${currentStop.exhibition.id}`,
      kind: "active-skip",
      title: `Skip ${currentStop.exhibition.galleryName}`,
      body: "This active-walk stop is closed now, so the cleaner move is to advance to the next open option.",
      ctaLabel: "Skip stop",
      score: 1002,
      action: {
        type: "skip-current",
        stopId: currentStop.exhibition.id,
        exhibitionId: currentStop.exhibition.id
      },
      exhibitionId: currentStop.exhibition.id,
      galleryName: currentStop.exhibition.galleryName,
      neighborhood: currentStop.exhibition.neighborhood,
      trustLabel: trust.label,
      reasons: ["Closed now", "Active walk", trust.label]
    }];
  }

  return [{
    id: `visit-current-${currentStop.exhibition.id}`,
    kind: "active-current",
    title: `Make ${currentStop.exhibition.galleryName} your next move`,
    body: `${currentStop.exhibition.title} is your current stop. Mark it visited when you are done so the route can advance.`,
    ctaLabel: "Mark visited",
    score: 1004 + getSuggestionTrustScore(currentStop.exhibition),
    action: {
      type: "mark-current-visited",
      stopId: currentStop.exhibition.id,
      exhibitionId: currentStop.exhibition.id
    },
    exhibitionId: currentStop.exhibition.id,
    galleryName: currentStop.exhibition.galleryName,
    neighborhood: currentStop.exhibition.neighborhood,
    trustLabel: trust.label,
    reasons: ["Active walk", status === "open-now" ? "Open now" : "Opens later", trust.label]
  }];
}

function eventSuggestions(input: GalleryConciergeSuggestionInput): GalleryConciergeSuggestion[] {
  const referenceNow = input.referenceNow ?? defaultNow;

  return (input.eventSignals ?? [])
    .filter((signal) => signal.routeFit !== "thin")
    .slice(0, 6)
    .map((signal): GalleryConciergeSuggestion => {
      const trust = getGalleryInventoryTrust(signal.exhibition);
      const isLastLook = signal.kind === "last-look" || signal.kind === "closing";
      const mode: GalleryWalkMode = isLastLook ? "last-chance" : "opening-night";
      const timingScore = signal.startsAt
        ? Math.max(0, 20 - Math.abs(new Date(signal.startsAt).getTime() - new Date(referenceNow).getTime()) / 3600000)
        : 4;

      return {
        id: `${signal.kind}-${signal.exhibition.id}`,
        kind: isLastLook ? "last-look" : "opening-soon",
        title: isLastLook
          ? `Catch ${signal.exhibition.galleryName} before it closes`
          : `${signal.exhibition.galleryName} has a timed event`,
        body: `${signal.label} - ${signal.timingLabel}. Build the route around this if the timing works.`,
        ctaLabel: isLastLook ? "Use last-look route" : "Use opening route",
        score:
          (isLastLook ? 74 : 78) +
          timingScore +
          getSuggestionTrustScore(signal.exhibition) +
          getSuggestionStatusScore(signal.exhibition, referenceNow),
        action: {
          type: "switch-route-mode",
          mode,
          neighborhood: signal.exhibition.neighborhood
        },
        exhibitionId: signal.exhibition.id,
        galleryName: signal.exhibition.galleryName,
        neighborhood: signal.exhibition.neighborhood,
        trustLabel: trust.label,
        reasons: [
          isLastLook ? "Last look" : "Opening signal",
          signal.timingLabel,
          signal.requiresRsvp ? "RSVP/link available" : "No RSVP needed",
          trust.label
        ]
      };
    });
}

function personalizedSuggestions(input: GalleryConciergeSuggestionInput): GalleryConciergeSuggestion[] {
  const referenceNow = input.referenceNow ?? defaultNow;
  const logStatusById = getLogStatusById(input.logEntries);

  return (input.personalizedPicks ?? [])
    .filter((pick) => logStatusById.get(pick.exhibition.id) !== "skipped")
    .slice(0, 5)
    .map((pick): GalleryConciergeSuggestion => {
      const trust = getGalleryInventoryTrust(pick.exhibition);
      const status = getGalleryVisitStatus(pick.exhibition, referenceNow);
      const outsideUsualTaste = pick.reasons.some((reason) =>
        reason.toLowerCase().includes("outside")
      );

      return {
        id: `taste-${pick.exhibition.id}`,
        kind: "taste-match",
        title: outsideUsualTaste
          ? `Try ${pick.exhibition.galleryName} as a stretch pick`
          : `Start with ${pick.exhibition.galleryName}`,
        body: `${pick.exhibition.title} is a strong For You pick in ${pick.exhibition.neighborhood}.`,
        ctaLabel: "Open details",
        score:
          pick.score +
          getSuggestionTrustScore(pick.exhibition) +
          getSuggestionStatusScore(pick.exhibition, referenceNow) -
          pick.exhibition.distanceMiles,
        action: {
          type: "open-exhibition",
          exhibitionId: pick.exhibition.id
        },
        exhibitionId: pick.exhibition.id,
        galleryName: pick.exhibition.galleryName,
        neighborhood: pick.exhibition.neighborhood,
        trustLabel: trust.label,
        reasons: [
          pick.reasons[0] ?? "Taste match",
          status === "open-now" ? "Open now" : "Timing check",
          trust.label
        ]
      };
    });
}

function routeSuggestions(input: GalleryConciergeSuggestionInput): GalleryConciergeSuggestion[] {
  const suggestions: GalleryConciergeSuggestion[] = [];
  const routeTrustCount = input.walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  ).length;

  if (input.walkPlan.stops.length > 0 && input.walkPlan.readinessLevel !== "not-ready") {
    suggestions.push({
      id: `start-route-${input.walkPlan.areaId}-${input.walkPlan.mode}-${input.walkPlan.neighborhood ?? "market"}`,
      kind: "route-start",
      title: `Start the ${input.walkPlan.neighborhood ?? "market"} route`,
      body: `${input.walkPlan.summary}. ${input.walkPlan.readinessCopy}`,
      ctaLabel: "Start walk",
      score: input.walkPlan.readinessLevel === "ready" ? 82 : 54,
      action: { type: "start-walk" },
      neighborhood: input.walkPlan.neighborhood,
      reasons: [
        `${input.walkPlan.stops.length} stops`,
        `${routeTrustCount} verified`,
        input.walkPlan.canStartNow ? "Can start now" : "Timing check"
      ]
    });

    suggestions.push({
      id: `save-route-${input.walkPlan.areaId}-${input.walkPlan.mode}-${input.walkPlan.neighborhood ?? "market"}`,
      kind: "share-save",
      title: "Save this as tonight's backup plan",
      body: "Keep the route locally so you can copy or reuse it after you tune the walk.",
      ctaLabel: "Save walk",
      score: 44 + routeTrustCount,
      action: { type: "save-walk" },
      neighborhood: input.walkPlan.neighborhood,
      reasons: ["Local save", "Copy later", `${routeTrustCount} verified`]
    });
  }

  if (input.walkPlan.readinessLevel === "not-ready" || routeTrustCount === 0) {
    suggestions.push({
      id: `thin-${input.areaId}-${input.selectedNeighborhood ?? input.walkPlan.neighborhood ?? "market"}`,
      kind: "thin-supply",
      title: "Treat this route as thin supply",
      body: input.walkPlan.readinessCopy,
      ctaLabel: "Use quick loop",
      score: 76,
      action: {
        type: "switch-route-mode",
        mode: "quick-loop",
        neighborhood: input.selectedNeighborhood ?? input.walkPlan.neighborhood
      },
      neighborhood: input.selectedNeighborhood ?? input.walkPlan.neighborhood,
      reasons: ["Honest fallback", "Thin verified supply", "Avoid overclaiming"]
    });
  }

  return suggestions;
}

export function createGalleryConciergeSuggestions(
  input: GalleryConciergeSuggestionInput
): GalleryConciergeSuggestion[] {
  return uniqueSuggestions([
    ...activeWalkSuggestions(input),
    ...eventSuggestions(input),
    ...personalizedSuggestions(input),
    ...routeSuggestions(input)
  ])
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, 5);
}

export function applyGalleryConciergeSuggestion(
  suggestion: GalleryConciergeSuggestion
): GalleryConciergeStateIntent {
  return {
    ...suggestion.action,
    sourceSuggestionId: suggestion.id
  };
}
