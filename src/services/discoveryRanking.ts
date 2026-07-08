import type { InventorySource, Show, TicketOffer } from "../types";
import { getOfferSavings, getSavingsPercent } from "./dealDiscovery";
import { getBestOffer } from "./eventCatalog";

export type DiscoveryPickSignal =
  | "calendar-deal"
  | "tonight-deal"
  | "deal"
  | "local-source"
  | "tonight"
  | "weekend"
  | "nearby";

export type DiscoveryPick = {
  show: Show;
  offer?: TicketOffer;
  score: number;
  signal: DiscoveryPickSignal;
  label: string;
  reason: string;
};

const localSources = new Set<InventorySource>([
  "calendar-feed",
  "venue-direct",
  "promoter",
  "partner-feed"
]);

export function getDiscoveryPicks(
  shows: Show[],
  referenceNow = new Date().toISOString(),
  limit = 5
): DiscoveryPick[] {
  return shows
    .map((show) => createDiscoveryPick(show, referenceNow))
    .sort(
      (first, second) =>
        second.score - first.score || first.show.startsAt.localeCompare(second.show.startsAt)
    )
    .slice(0, limit);
}

function createDiscoveryPick(show: Show, referenceNow: string): DiscoveryPick {
  const offer = getBestOffer(show);
  const startsWithinHours = getHoursUntil(show.startsAt, referenceNow);
  const savingsCents = getOfferSavings(offer);
  const savingsPercent = getSavingsPercent(offer);
  const hasDeal = Boolean(offer?.deal);
  const signal = getDiscoveryPickSignal(show, hasDeal, startsWithinHours);

  return {
    show,
    offer,
    score:
      getTimingScore(startsWithinHours) +
      getDealScore(hasDeal, savingsCents, savingsPercent) +
      getSourceScore(show.source) +
      getDistanceScore(show.distanceMiles),
    signal,
    label: getDiscoveryPickLabel(signal, savingsPercent),
    reason: getDiscoveryPickReason(signal, show, startsWithinHours)
  };
}

function getDiscoveryPickSignal(
  show: Show,
  hasDeal: boolean,
  startsWithinHours: number
): DiscoveryPickSignal {
  if (show.source === "calendar-feed" && hasDeal) {
    return "calendar-deal";
  }

  if (hasDeal && startsWithinHours <= 24) {
    return "tonight-deal";
  }

  if (hasDeal) {
    return "deal";
  }

  if (localSources.has(show.source)) {
    return "local-source";
  }

  if (startsWithinHours <= 24) {
    return "tonight";
  }

  if (isWeekendShow(show.startsAt) && startsWithinHours <= 7 * 24) {
    return "weekend";
  }

  return "nearby";
}

function getDiscoveryPickLabel(signal: DiscoveryPickSignal, savingsPercent: number): string {
  if (signal === "calendar-deal") {
    return "Calendar deal";
  }

  if (signal === "tonight-deal") {
    return "Tonight deal";
  }

  if (signal === "deal") {
    return savingsPercent >= 25 ? "Best deal" : "Strong deal";
  }

  if (signal === "local-source") {
    return "Local pick";
  }

  if (signal === "tonight") {
    return "Tonight";
  }

  if (signal === "weekend") {
    return "Weekend";
  }

  return "Nearby";
}

function getDiscoveryPickReason(
  signal: DiscoveryPickSignal,
  show: Show,
  startsWithinHours: number
): string {
  if (signal === "calendar-deal") {
    return "Local calendar listing with a deal attached";
  }

  if (signal === "tonight-deal") {
    return "Discounted and happening tonight";
  }

  if (signal === "deal") {
    return "Discounted inventory in the current mix";
  }

  if (signal === "local-source") {
    return `${show.venue} is coming from a local source`;
  }

  if (signal === "tonight") {
    return "Happening tonight";
  }

  if (signal === "weekend") {
    return "Good fit for the next weekend window";
  }

  return startsWithinHours <= 7 * 24 ? "Nearby this week" : "Nearby upcoming show";
}

function getTimingScore(startsWithinHours: number): number {
  if (startsWithinHours <= 24) {
    return 45;
  }

  if (startsWithinHours <= 72) {
    return 24;
  }

  if (startsWithinHours <= 7 * 24) {
    return 8;
  }

  return 0;
}

function getDealScore(hasDeal: boolean, savingsCents: number, savingsPercent: number): number {
  if (!hasDeal) {
    return 0;
  }

  return 30 + savingsPercent * 2 + Math.round(savingsCents / 100);
}

function getSourceScore(source: InventorySource): number {
  if (source === "primary-marketplace") {
    return 6;
  }

  if (source === "verified-resale") {
    return 3;
  }

  return localSources.has(source) ? 18 : 0;
}

function getDistanceScore(distanceMiles: number): number {
  return Math.max(0, 18 - Math.round(distanceMiles * 2));
}

function getHoursUntil(startsAt: string, referenceNow: string): number {
  return (new Date(startsAt).getTime() - new Date(referenceNow).getTime()) / (60 * 60 * 1000);
}

function isWeekendShow(startsAt: string): boolean {
  const day = new Date(`${startsAt.slice(0, 10)}T12:00:00Z`).getUTCDay();

  return day === 5 || day === 6 || day === 0;
}
