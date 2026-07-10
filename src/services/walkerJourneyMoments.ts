import type { GalleryExhibition, GalleryLogEntry } from "../types";
import { upsertGalleryLogEntry, type GalleryWalkPlan } from "./galleryDiscovery";
import type { GalleryWalkRecap, GalleryWalkSession } from "./galleryWalkSession";

export type WalkerReactionKind =
  | "inspired"
  | "calm"
  | "intrigued"
  | "moved"
  | "thoughtful"
  | "surprised";

export type WalkerStopReaction = {
  id: string;
  exhibitionId: string;
  sessionId?: string;
  reaction: WalkerReactionKind;
  saved: boolean;
  note?: string;
  createdAt: string;
};

export type WalkerStopArrivalPrompt = {
  title: string;
  body: string;
  signal: string;
};

export type WalkerCompletedWalkShareCard = {
  title: "Walker";
  heading: string;
  subtitle: string;
  stats: string[];
  highlights: string[];
  shareText: string;
};

export const walkerReactionLabels: Record<WalkerReactionKind, string> = {
  inspired: "Inspired",
  calm: "Calm",
  intrigued: "Intrigued",
  moved: "Moved",
  thoughtful: "Thoughtful",
  surprised: "Surprised"
};

export const walkerReactionOptions: WalkerReactionKind[] = [
  "inspired",
  "calm",
  "intrigued",
  "moved",
  "thoughtful",
  "surprised"
];

export function getWalkerStopArrivalPrompt(exhibition: GalleryExhibition): WalkerStopArrivalPrompt {
  const signal = exhibition.whyGoSignals.find((value) => !["verified", "official"].includes(value)) ??
    exhibition.mediums[0] ??
    "slow-looking";
  const firstSentence = exhibition.description.split(".")[0]?.trim();
  const body = firstSentence
    ? `${firstSentence}.`
    : `Spend one quiet minute with ${exhibition.title} before moving on.`;

  return {
    title: "One thing to notice",
    body,
    signal
  };
}

export function createWalkerReactionLogEntry(input: {
  entries: GalleryLogEntry[];
  exhibitionId: string;
  reaction: WalkerReactionKind;
  note?: string;
  saved: boolean;
  now: string;
}): GalleryLogEntry[] {
  const reactionNote = [
    walkerReactionLabels[input.reaction],
    input.note?.trim()
  ].filter(Boolean).join(" - ");

  return upsertGalleryLogEntry(
    input.entries,
    input.exhibitionId,
    input.saved ? "saved" : "visited",
    reactionNote,
    input.now
  );
}

export function createWalkerStopReaction(input: {
  exhibitionId: string;
  sessionId?: string;
  reaction: WalkerReactionKind;
  saved: boolean;
  note?: string;
  now: string;
}): WalkerStopReaction {
  return {
    id: `${input.exhibitionId}:${input.sessionId ?? "walk"}:${input.now}`,
    exhibitionId: input.exhibitionId,
    sessionId: input.sessionId,
    reaction: input.reaction,
    saved: input.saved,
    note: input.note?.trim() || undefined,
    createdAt: input.now
  };
}

export function createWalkerCompletedWalkShareCard(input: {
  walkPlan: GalleryWalkPlan;
  session?: GalleryWalkSession;
  recap?: GalleryWalkRecap;
  reactions?: WalkerStopReaction[];
}): WalkerCompletedWalkShareCard {
  const completedStops = input.recap?.visitedStopCount ?? input.session?.visitedStopIds.length ?? 0;
  const skippedStops = input.recap?.skippedStopCount ?? input.session?.skippedStopIds.length ?? 0;
  const savedCount = input.reactions?.filter((reaction) => reaction.saved).length ?? 0;
  const neighborhoods = input.recap?.neighborhoods.join(", ") || input.walkPlan.neighborhood || "cultural walk";
  const stats = [
    `${input.walkPlan.totalMinutes} min`,
    `${input.walkPlan.totalDistanceMiles.toFixed(1)} mi`,
    `${completedStops}/${input.walkPlan.stops.length} stops`
  ];
  const highlights = [
    `${savedCount} saved`,
    `${skippedStops} skipped`,
    neighborhoods
  ];

  return {
    title: "Walker",
    heading: "Walk Complete",
    subtitle: neighborhoods,
    stats,
    highlights,
    shareText: `Walker recap: ${input.walkPlan.title}\n${stats.join(" - ")}\n${highlights.join(" - ")}`
  };
}
