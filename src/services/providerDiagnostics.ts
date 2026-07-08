import { categoryLabels } from "../data/catalog";
import type { Show, ShowCategory, ShowSearchFilters } from "../types";
import { filterShows } from "./eventCatalog";
import { getSafeTicketUrl } from "./ticketLinks";
import {
  fetchTicketmasterDiscoveryEvents,
  normalizeTicketmasterEventWithDiagnostics,
  type TicketmasterDiscoveryProviderOptions,
  type TicketmasterDiscardReason
} from "./ticketmasterProvider";

export type TicketmasterProviderDiagnosticRequest = {
  laneId: string;
  laneLabel: string;
  page: number;
  url: string;
  rawEventCount: number;
  totalElements?: number;
};

export type TicketmasterProviderDiagnosticCount = {
  id: string;
  label: string;
  count: number;
};

export type TicketmasterProviderDiagnosticsSummary = {
  providerId: "ticketmaster-discovery";
  areaId: string;
  requestedAt: string;
  requestCount: number;
  rawEventCount: number;
  normalizedShowCount: number;
  uniqueShowCount: number;
  duplicateShowCount: number;
  duplicateRatePercent: number;
  discardedEventCount: number;
  filteredShowCount: number;
  ticketLinkCount: number;
  ticketLinkCoveragePercent: number;
  pricedOfferCount: number;
  linkOnlyOfferCount: number;
  requests: TicketmasterProviderDiagnosticRequest[];
  categoryCounts: TicketmasterProviderDiagnosticCount[];
  discardReasons: TicketmasterProviderDiagnosticCount[];
};

export async function createTicketmasterProviderDiagnostics(
  filters: ShowSearchFilters,
  options: TicketmasterDiscoveryProviderOptions
): Promise<TicketmasterProviderDiagnosticsSummary> {
  const requestedAt = new Date().toISOString();
  const fetchResult = await fetchTicketmasterDiscoveryEvents(filters, options);
  const normalizationResults = fetchResult.events.map((event) =>
    normalizeTicketmasterEventWithDiagnostics(event, filters.areaId)
  );
  const normalizedShows = normalizationResults
    .map((result) => result.show)
    .filter((show): show is Show => Boolean(show));
  const uniqueShows = dedupeShowsById(normalizedShows);
  const filteredShows = filterShows(uniqueShows, filters);
  const duplicateShowCount = normalizedShows.length - uniqueShows.length;
  const discardedEventCount = normalizationResults.length - normalizedShows.length;
  const ticketLinkCount = filteredShows.filter(hasTicketLink).length;

  return {
    providerId: "ticketmaster-discovery",
    areaId: filters.areaId,
    requestedAt,
    requestCount: fetchResult.requests.length,
    rawEventCount: fetchResult.events.length,
    normalizedShowCount: normalizedShows.length,
    uniqueShowCount: uniqueShows.length,
    duplicateShowCount,
    duplicateRatePercent: getPercent(duplicateShowCount, normalizedShows.length),
    discardedEventCount,
    filteredShowCount: filteredShows.length,
    ticketLinkCount,
    ticketLinkCoveragePercent: getPercent(ticketLinkCount, filteredShows.length),
    pricedOfferCount: countOffers(filteredShows, (offer) => offer.priceCents !== undefined),
    linkOnlyOfferCount: countOffers(
      filteredShows,
      (offer) => offer.priceCents === undefined && Boolean(getSafeTicketUrl(offer.externalUrl))
    ),
    requests: fetchResult.requests.map((request) => ({
      ...request,
      url: redactTicketmasterApiKey(request.url)
    })),
    categoryCounts: createCategoryCounts(filteredShows),
    discardReasons: createDiscardReasonCounts(
      normalizationResults
        .map((result) => result.discardReason)
        .filter((reason): reason is TicketmasterDiscardReason => Boolean(reason))
    )
  };
}

export function redactTicketmasterApiKey(url: string): string {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.searchParams.has("apikey")) {
      parsedUrl.searchParams.set("apikey", "REDACTED");
    }

    return parsedUrl.toString();
  } catch {
    return url.replace(/([?&]apikey=)[^&]+/i, "$1REDACTED");
  }
}

function dedupeShowsById(shows: Show[]): Show[] {
  return Array.from(new Map(shows.map((show) => [show.id, show])).values());
}

function hasTicketLink(show: Show): boolean {
  return show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)));
}

function countOffers(
  shows: Show[],
  predicate: (offer: Show["ticketOffers"][number]) => boolean
): number {
  return shows.reduce(
    (total, show) => total + show.ticketOffers.filter((offer) => predicate(offer)).length,
    0
  );
}

function createCategoryCounts(shows: Show[]): TicketmasterProviderDiagnosticCount[] {
  return (Object.keys(categoryLabels) as ShowCategory[])
    .map((category) => ({
      id: category,
      label: categoryLabels[category],
      count: shows.filter((show) => show.category === category).length
    }))
    .filter((count) => count.count > 0);
}

function createDiscardReasonCounts(
  reasons: TicketmasterDiscardReason[]
): TicketmasterProviderDiagnosticCount[] {
  const reasonLabels: Record<TicketmasterDiscardReason, string> = {
    "missing-area": "Missing area",
    "missing-start": "Missing start date"
  };

  return (Object.keys(reasonLabels) as TicketmasterDiscardReason[])
    .map((reason) => ({
      id: reason,
      label: reasonLabels[reason],
      count: reasons.filter((candidate) => candidate === reason).length
    }))
    .filter((count) => count.count > 0);
}

function getPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}
