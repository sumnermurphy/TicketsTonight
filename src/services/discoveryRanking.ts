import type { InventorySource, Show, TicketOffer } from "../types";
import { getOfferSavings, getSavingsPercent } from "./dealDiscovery";
import { getBestOffer } from "./eventCatalog";
import { getSafeTicketUrl } from "./ticketLinks";

export type DiscoveryPickSignal =
  | "calendar-deal"
  | "tonight-deal"
  | "deal"
  | "local-source"
  | "tonight"
  | "weekend"
  | "spotify-match"
  | "ticket-link"
  | "nearby";

export type DiscoveryPick = {
  show: Show;
  offer?: TicketOffer;
  score: number;
  signal: DiscoveryPickSignal;
  label: string;
  reason: string;
};

export type DiscoveryPickOptions = {
  areaId?: string;
  preferCategoryVariety?: boolean;
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
  limit = 5,
  options: DiscoveryPickOptions = {}
): DiscoveryPick[] {
  const picks = shows
    .map((show) => createDiscoveryPick(show, referenceNow, options))
    .sort(
      (first, second) =>
        second.score - first.score || first.show.startsAt.localeCompare(second.show.startsAt)
    );

  return options.preferCategoryVariety === false ? picks.slice(0, limit) : selectDiversePicks(picks, limit);
}

function createDiscoveryPick(
  show: Show,
  referenceNow: string,
  options: DiscoveryPickOptions
): DiscoveryPick {
  const offer = getBestOffer(show);
  const startsWithinHours = getHoursUntil(show.startsAt, referenceNow);
  const savingsCents = getOfferSavings(offer);
  const savingsPercent = getSavingsPercent(offer);
  const hasDeal = Boolean(offer?.deal);
  const hasTicketLink = show.ticketOffers.some((candidate) =>
    Boolean(getSafeTicketUrl(candidate.externalUrl))
  );
  const hasSpotifySignal = (show.recommendationSignals ?? []).some((signal) =>
    signal.startsWith("spotify:")
  );
  const signal = getDiscoveryPickSignal(show, hasDeal, startsWithinHours);

  return {
    show,
    offer,
    score:
      getTimingScore(startsWithinHours) +
      getDealScore(hasDeal, savingsCents, savingsPercent) +
      getSourceScore(show.source) +
      getTicketLinkScore(hasTicketLink) +
      getSpotifyScore(hasSpotifySignal) +
      getMarketFitScore(show, options.areaId) +
      getDistanceScore(show.distanceMiles),
    signal,
    label: getDiscoveryPickLabel(signal, savingsPercent),
    reason: getDiscoveryPickReason(signal, show, startsWithinHours, hasTicketLink, hasSpotifySignal)
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

  if ((show.recommendationSignals ?? []).some((signal) => signal.startsWith("spotify:"))) {
    return "spotify-match";
  }

  if (show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)))) {
    return "ticket-link";
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

  if (signal === "spotify-match") {
    return "Taste match";
  }

  if (signal === "ticket-link") {
    return "Ticket-ready";
  }

  return "Nearby";
}

function getDiscoveryPickReason(
  signal: DiscoveryPickSignal,
  show: Show,
  startsWithinHours: number,
  hasTicketLink: boolean,
  hasSpotifySignal: boolean
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

  if (signal === "spotify-match") {
    return hasTicketLink ? "Matches music taste and has a ticket link" : "Matches music taste signals";
  }

  if (signal === "ticket-link") {
    return "Primary ticket link is ready";
  }

  if (hasSpotifySignal && hasTicketLink) {
    return "Taste signal with ticket link ready";
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
    return 14;
  }

  if (source === "verified-resale") {
    return 3;
  }

  return localSources.has(source) ? 18 : 0;
}

function getTicketLinkScore(hasTicketLink: boolean): number {
  return hasTicketLink ? 20 : 0;
}

function getSpotifyScore(hasSpotifySignal: boolean): number {
  return hasSpotifySignal ? 7 : 0;
}

function getMarketFitScore(show: Show, areaId: string | undefined): number {
  if (areaId === "hudson" && localSources.has(show.source)) {
    return 14;
  }

  return 0;
}

function getDistanceScore(distanceMiles: number): number {
  return Math.max(0, 18 - Math.round(distanceMiles * 2));
}

function selectDiversePicks(picks: DiscoveryPick[], limit: number): DiscoveryPick[] {
  const selected: DiscoveryPick[] = [];
  const selectedIds = new Set<string>();
  const selectedCategoryCounts = new Map<Show["category"], number>();
  const maximumPerCategory = Math.max(1, Math.ceil(limit / 2));
  const selectPick = (pick: DiscoveryPick, enforceCategoryMaximum: boolean) => {
    if (selected.length >= limit || selectedIds.has(pick.show.id)) {
      return false;
    }

    const selectedCategoryCount = selectedCategoryCounts.get(pick.show.category) ?? 0;

    if (enforceCategoryMaximum && selectedCategoryCount >= maximumPerCategory) {
      return false;
    }

    selected.push(pick);
    selectedIds.add(pick.show.id);
    selectedCategoryCounts.set(pick.show.category, selectedCategoryCount + 1);

    return true;
  };

  for (const pick of picks) {
    selectPick(pick, true);
  }

  for (const pick of picks) {
    selectPick(pick, false);
  }

  return selected;
}

function getHoursUntil(startsAt: string, referenceNow: string): number {
  return (new Date(startsAt).getTime() - new Date(referenceNow).getTime()) / (60 * 60 * 1000);
}

function isWeekendShow(startsAt: string): boolean {
  const day = new Date(`${startsAt.slice(0, 10)}T12:00:00Z`).getUTCDay();

  return day === 5 || day === 6 || day === 0;
}
