import type { GalleryLogEntry } from "../types";
import type { GalleryWalkPlan } from "./galleryDiscovery";
import type { GalleryPassportBadge, GalleryPassportStamp, GalleryTastePassport } from "./galleryTastePassport";
import type { GalleryWalkRecap, GalleryWalkSession } from "./galleryWalkSession";

export type GalleryWalkShareCard = {
  title: string;
  subtitle: string;
  stats: string[];
  highlights: string[];
  shareText: string;
  routeMapUrl?: string;
};

export type GalleryPassportMemory = {
  completedWalkCount: number;
  visitedStopCount: number;
  skippedStopCount: number;
  notedStopCount: number;
  neighborhoods: string[];
  badges: string[];
  stamps: string[];
  learnedSignals: string[];
  summary: string;
};

export function createGalleryWalkShareCard(input: {
  walkPlan: GalleryWalkPlan;
  session?: GalleryWalkSession;
  recap?: GalleryWalkRecap;
  badges?: GalleryPassportBadge[];
  stamps?: GalleryPassportStamp[];
}): GalleryWalkShareCard {
  const recap = input.recap;
  const badgeLabels = (input.badges ?? [])
    .filter((badge) => badge.earnedFromSessionId === input.session?.id)
    .map((badge) => badge.label)
    .slice(0, 2);
  const stampLabels = (input.stamps ?? [])
    .filter((stamp) => stamp.earnedAt === input.session?.completedAt)
    .map((stamp) => stamp.label)
    .slice(0, 2);
  const stats = recap
    ? [
        `${recap.visitedStopCount} visited`,
        `${recap.skippedStopCount} skipped`,
        `${recap.notedStopCount} notes`
      ]
    : [
        `${input.walkPlan.stops.length} stops`,
        `${input.walkPlan.totalMinutes} min`,
        `${input.walkPlan.totalDistanceMiles.toFixed(1)} mi`
      ];
  const highlights = [...badgeLabels, ...stampLabels, input.walkPlan.readinessCopy]
    .filter(Boolean)
    .slice(0, 4);
  const subtitle = recap
    ? `${recap.neighborhoods.join(", ") || input.walkPlan.neighborhood || "Gallery walk"} recap`
    : input.walkPlan.guidance;

  return {
    title: input.walkPlan.title,
    subtitle,
    stats,
    highlights,
    shareText: [
      input.walkPlan.title,
      subtitle,
      stats.join(" - "),
      highlights.join(" - "),
      input.walkPlan.routeMapUrl
    ]
      .filter(Boolean)
      .join("\n"),
    routeMapUrl: input.walkPlan.routeMapUrl
  };
}

export function createGalleryPassportMemory(input: {
  completedWalks: GalleryWalkSession[];
  logEntries: GalleryLogEntry[];
  badges: GalleryPassportBadge[];
  stamps: GalleryPassportStamp[];
  passport?: GalleryTastePassport;
}): GalleryPassportMemory {
  const completedWalks = input.completedWalks.filter((walk) => walk.status === "completed");
  const neighborhoods = Array.from(
    new Set(completedWalks.map((walk) => walk.neighborhood).filter((value): value is string => Boolean(value)))
  );
  const visitedStopCount = completedWalks.reduce(
    (total, walk) => total + walk.visitedStopIds.length,
    0
  );
  const skippedStopCount = completedWalks.reduce(
    (total, walk) => total + walk.skippedStopIds.length,
    0
  );
  const completedStopIds = new Set(
    completedWalks.flatMap((walk) => [...walk.visitedStopIds, ...walk.skippedStopIds])
  );
  const notedStopCount = input.logEntries.filter(
    (entry) => completedStopIds.has(entry.exhibitionId) && Boolean(entry.note?.trim())
  ).length;
  const learnedSignals = (input.passport?.signals ?? [])
    .filter((signal) => signal.weight > 0)
    .map((signal) => signal.label)
    .slice(0, 4);

  return {
    completedWalkCount: completedWalks.length,
    visitedStopCount,
    skippedStopCount,
    notedStopCount,
    neighborhoods,
    badges: input.badges.map((badge) => badge.label),
    stamps: input.stamps.map((stamp) => stamp.label),
    learnedSignals,
    summary:
      completedWalks.length > 0
        ? `${completedWalks.length} completed walks across ${neighborhoods.length || 1} neighborhood${neighborhoods.length === 1 ? "" : "s"}.`
        : "Complete a walk to build your passport memory."
  };
}
