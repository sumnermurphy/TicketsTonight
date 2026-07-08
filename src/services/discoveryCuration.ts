import type { InventorySource, Show, ShowCategory, ShowSearchFilters } from "../types";
import { getBestOffer } from "./eventCatalog";
import { getSafeTicketUrl } from "./ticketLinks";

export type DiscoverySeries = {
  id: string;
  key: string;
  representative: Show;
  shows: Show[];
  performanceCount: number;
  upcomingDateCount: number;
  sourceCount: number;
  category: ShowCategory;
};

export type CuratedDiscoveryResult = {
  shows: Show[];
  series: DiscoverySeries[];
  seriesByShowId: Map<string, DiscoverySeries>;
  rawCount: number;
  curatedCount: number;
  repeatedRunCount: number;
  repeatedPerformanceCount: number;
  duplicateDensityPercent: number;
  defaultCurated: boolean;
};

const sourceDisplayPriority: Record<InventorySource, number> = {
  "venue-direct": 60,
  "calendar-feed": 55,
  "partner-feed": 50,
  promoter: 45,
  "primary-marketplace": 35,
  "verified-resale": 20
};

export function getCuratedDiscoveryResult(
  shows: Show[],
  options: {
    filters: ShowSearchFilters;
    visibleCount: number;
    referenceNow?: string;
  }
): CuratedDiscoveryResult {
  const series = createDiscoverySeries(shows, options.referenceNow);
  const seriesByShowId = createSeriesByShowId(series);
  const normalizedVisibleCount = normalizeVisibleCount(options.visibleCount);
  const defaultCurated = shouldCurateDefaultDiscovery(options.filters);
  const curatedShows = defaultCurated
    ? selectCuratedDefaultShows(shows, series, normalizedVisibleCount)
    : shows.slice(0, normalizedVisibleCount);

  return {
    shows: curatedShows,
    series,
    seriesByShowId,
    rawCount: shows.length,
    curatedCount: series.length,
    repeatedRunCount: series.filter((group) => group.performanceCount > 1).length,
    repeatedPerformanceCount: Math.max(0, shows.length - series.length),
    duplicateDensityPercent: getPercent(Math.max(0, shows.length - series.length), shows.length),
    defaultCurated
  };
}

export function createDiscoverySeries(
  shows: Show[],
  referenceNow = new Date().toISOString()
): DiscoverySeries[] {
  const groups = new Map<string, Show[]>();

  for (const show of shows) {
    const key = getDiscoverySeriesKey(show);
    groups.set(key, [...(groups.get(key) ?? []), show]);
  }

  return Array.from(groups.entries())
    .map(([key, groupShows]) => {
      const sortedShows = [...groupShows].sort((first, second) =>
        compareSeriesShows(first, second, referenceNow)
      );
      const representative = sortedShows[0]!;

      return {
        id: `series-${key}`,
        key,
        representative,
        shows: sortedShows,
        performanceCount: sortedShows.length,
        upcomingDateCount: new Set(sortedShows.map((show) => show.startsAt.slice(0, 10))).size,
        sourceCount: new Set(sortedShows.map((show) => show.source)).size,
        category: representative.category
      };
    })
    .sort((first, second) =>
      first.representative.startsAt.localeCompare(second.representative.startsAt)
    );
}

export function shouldCurateDefaultDiscovery(filters: ShowSearchFilters): boolean {
  return (
    (filters.sortMode ?? "soonest") === "soonest" &&
    filters.dateWindow === "all" &&
    filters.categories.length === 0 &&
    !filters.query.trim() &&
    !filters.onlyDeals &&
    filters.maxPriceCents === undefined &&
    (filters.neighborhoods?.length ?? 0) === 0
  );
}

export function getDiscoverySeriesSummaryCopy(series: DiscoverySeries | undefined): string | undefined {
  if (!series || series.performanceCount <= 1) {
    return undefined;
  }

  const dateNoun = series.upcomingDateCount === 1 ? "date" : "dates";

  return `${series.upcomingDateCount} upcoming ${dateNoun}`;
}

function selectCuratedDefaultShows(
  shows: Show[],
  series: DiscoverySeries[],
  visibleCount: number
): Show[] {
  if (visibleCount <= 0) {
    return [];
  }

  const selectedIds = new Set<string>();
  const selectedShows: Show[] = [];
  const selectedCountsByCategory = new Map<ShowCategory, number>();
  const maximumPerCategory = Math.max(2, Math.ceil(visibleCount * 0.34));
  const rankedSeries = [...series].sort(
    (first, second) =>
      first.representative.startsAt.localeCompare(second.representative.startsAt) ||
      getSeriesDisplayScore(second) - getSeriesDisplayScore(first)
  );

  const selectShow = (show: Show, enforceCategoryMaximum: boolean) => {
    if (selectedShows.length >= visibleCount || selectedIds.has(show.id)) {
      return false;
    }

    const selectedCategoryCount = selectedCountsByCategory.get(show.category) ?? 0;

    if (enforceCategoryMaximum && selectedCategoryCount >= maximumPerCategory) {
      return false;
    }

    selectedIds.add(show.id);
    selectedShows.push(show);
    selectedCountsByCategory.set(show.category, selectedCategoryCount + 1);

    return true;
  };

  for (const group of rankedSeries) {
    selectShow(group.representative, true);
  }

  if (selectedShows.length < visibleCount) {
    for (const group of rankedSeries) {
      if (selectedShows.length >= visibleCount) {
        break;
      }

      selectShow(group.representative, false);
    }
  }

  for (const show of shows) {
    if (selectedShows.length >= visibleCount) {
      break;
    }

    selectShow(show, true);
  }

  if (selectedShows.length < visibleCount) {
    for (const show of shows) {
      if (selectedShows.length >= visibleCount) {
        break;
      }

      selectShow(show, false);
    }
  }

  return selectedShows;
}

function getDiscoverySeriesKey(show: Show): string {
  return [
    show.areaId,
    normalizeForSeries(show.title),
    normalizeForSeries(show.venue),
    show.category
  ].join("|");
}

function createSeriesByShowId(series: DiscoverySeries[]): Map<string, DiscoverySeries> {
  const seriesByShowId = new Map<string, DiscoverySeries>();

  for (const group of series) {
    for (const show of group.shows) {
      seriesByShowId.set(show.id, group);
    }
  }

  return seriesByShowId;
}

function compareSeriesShows(first: Show, second: Show, referenceNow: string): number {
  const firstUpcoming = new Date(first.startsAt).getTime() >= new Date(referenceNow).getTime();
  const secondUpcoming = new Date(second.startsAt).getTime() >= new Date(referenceNow).getTime();

  if (firstUpcoming !== secondUpcoming) {
    return firstUpcoming ? -1 : 1;
  }

  return (
    first.startsAt.localeCompare(second.startsAt) ||
    getShowDisplayScore(second) - getShowDisplayScore(first)
  );
}

function getSeriesDisplayScore(series: DiscoverySeries): number {
  return (
    getShowDisplayScore(series.representative) +
    Math.min(16, series.performanceCount * 2) +
    Math.min(10, series.sourceCount * 3)
  );
}

function getShowDisplayScore(show: Show): number {
  const bestOffer = getBestOffer(show);
  const hasTicketLink = show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)));
  const hasKnownPrice = show.ticketOffers.some((offer) => offer.priceCents !== undefined);
  const hasSpotifySignal = (show.recommendationSignals ?? []).some((signal) => signal.startsWith("spotify:"));

  return (
    (sourceDisplayPriority[show.source] ?? 0) +
    (bestOffer?.deal ? 36 : 0) +
    (hasTicketLink ? 24 : 0) +
    (hasKnownPrice ? 8 : 0) +
    (hasSpotifySignal ? 6 : 0) +
    Math.max(0, 14 - Math.round(show.distanceMiles))
  );
}

function normalizeForSeries(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[-_:]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeVisibleCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function getPercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}
