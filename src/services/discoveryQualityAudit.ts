import { categoryLabels } from "../data/catalog";
import type { InventorySource, Show, ShowCategory, ShowSearchFilters } from "../types";
import { createCoverageAudit, type CoverageAuditCategoryGroupCount } from "./coverageAudit";
import { getCuratedDiscoveryResult } from "./discoveryCuration";
import { getSpotifyMatchableShows } from "./eventCatalog";
import {
  getResidentAdvisorReadiness,
  type ResidentAdvisorMarketReadiness
} from "./residentAdvisorReadiness";
import { getSafeTicketUrl } from "./ticketLinks";

export type DiscoveryQualityCount<T extends string> = {
  id: T;
  label: string;
  count: number;
};

export type DiscoveryQualityAuditSummary = {
  areaId: string;
  rawEventCount: number;
  curatedUniqueRunCount: number;
  visibleEventCount: number;
  repeatedRunCount: number;
  repeatedPerformanceCount: number;
  duplicateDensityPercent: number;
  ticketLinkCount: number;
  ticketLinkCoveragePercent: number;
  activeCategoryCount: number;
  spotifyMatchableCount: number;
  weakCategoryGroups: CoverageAuditCategoryGroupCount[];
  firstPageCategoryCounts: Array<DiscoveryQualityCount<ShowCategory>>;
  firstPageSourceCounts: Array<DiscoveryQualityCount<InventorySource>>;
  firstPageShows: Show[];
  residentAdvisorReadiness: ResidentAdvisorMarketReadiness;
  marketExpectationCopy: string;
};

export function createDiscoveryQualityAudit(
  shows: Show[],
  options: {
    areaId: string;
    referenceNow?: string;
    visibleCount?: number;
  }
): DiscoveryQualityAuditSummary {
  const referenceNow = options.referenceNow ?? new Date().toISOString();
  const visibleCount = options.visibleCount ?? 60;
  const marketShows = shows.filter((show) => show.areaId === options.areaId);
  const filters: ShowSearchFilters = {
    areaId: options.areaId,
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest",
    referenceNow
  };
  const curated = getCuratedDiscoveryResult(marketShows, {
    filters,
    visibleCount,
    referenceNow
  });
  const coverage = createCoverageAudit(marketShows, {
    areaId: options.areaId,
    referenceNow,
    windowDays: 30
  });
  const ticketLinkCount = marketShows.filter(hasTicketLink).length;

  return {
    areaId: options.areaId,
    rawEventCount: marketShows.length,
    curatedUniqueRunCount: curated.curatedCount,
    visibleEventCount: curated.shows.length,
    repeatedRunCount: curated.repeatedRunCount,
    repeatedPerformanceCount: curated.repeatedPerformanceCount,
    duplicateDensityPercent: curated.duplicateDensityPercent,
    ticketLinkCount,
    ticketLinkCoveragePercent: getPercent(ticketLinkCount, marketShows.length),
    activeCategoryCount: coverage.activeCategoryCount,
    spotifyMatchableCount: getSpotifyMatchableShows(marketShows).length,
    weakCategoryGroups: coverage.weakCategoryGroups,
    firstPageCategoryCounts: createFirstPageCategoryCounts(curated.shows),
    firstPageSourceCounts: createFirstPageSourceCounts(curated.shows),
    firstPageShows: curated.shows,
    residentAdvisorReadiness: getResidentAdvisorReadiness(options.areaId),
    marketExpectationCopy: getMarketExpectationCopy(options.areaId)
  };
}

export function getDiscoveryQualityAuditStatusCopy(summary: DiscoveryQualityAuditSummary): string {
  if (summary.areaId === "hudson" && summary.rawEventCount > 0) {
    return "Local-calendar quality check";
  }

  if (summary.rawEventCount >= 100 && summary.ticketLinkCoveragePercent >= 70) {
    return "Discovery quality ready";
  }

  if (summary.rawEventCount >= 30) {
    return "Watch discovery mix";
  }

  return "Needs more supply";
}

function createFirstPageCategoryCounts(shows: Show[]): Array<DiscoveryQualityCount<ShowCategory>> {
  const counts = new Map<ShowCategory, number>();

  for (const show of shows) {
    counts.set(show.category, (counts.get(show.category) ?? 0) + 1);
  }

  return (Object.keys(categoryLabels) as ShowCategory[])
    .map((category) => ({
      id: category,
      label: categoryLabels[category],
      count: counts.get(category) ?? 0
    }))
    .filter((count) => count.count > 0);
}

function createFirstPageSourceCounts(shows: Show[]): Array<DiscoveryQualityCount<InventorySource>> {
  const labels: Record<InventorySource, string> = {
    "calendar-feed": "Calendar",
    "venue-direct": "Venue direct",
    promoter: "Promoter",
    "partner-feed": "Partner feed",
    "primary-marketplace": "Primary",
    "verified-resale": "Verified resale"
  };
  const counts = new Map<InventorySource, number>();

  for (const show of shows) {
    counts.set(show.source, (counts.get(show.source) ?? 0) + 1);
  }

  return (Object.keys(labels) as InventorySource[])
    .map((source) => ({
      id: source,
      label: labels[source],
      count: counts.get(source) ?? 0
    }))
    .filter((count) => count.count > 0);
}

function getMarketExpectationCopy(areaId: string): string {
  if (areaId === "hudson") {
    return "Hudson is expected to be local-calendar-led; low broad-provider volume is acceptable.";
  }

  if (areaId === "la") {
    return "Los Angeles should prove secondary-market breadth and nightlife density.";
  }

  return "NYC should prove primary-market depth, ticket links, and balanced category discovery.";
}

function hasTicketLink(show: Show): boolean {
  return show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)));
}

function getPercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}
