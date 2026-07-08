import { shows } from "../data/catalog";
import { localCalendarEvents } from "../data/localCalendarFeeds";
import { partnerFeedEvents } from "../data/partnerFeeds";
import type { LocalCalendarEvent } from "../data/localCalendarFeeds";
import type { InventorySource, Show, ShowCategory } from "../types";
import { normalizeCalendarEvent } from "./calendarFeedProvider";
import { normalizeFeedEvent } from "./feedProvider";
import { getSafeTicketUrl } from "./ticketLinks";
import type { TicketmasterProviderDiagnosticsSummary } from "./providerDiagnostics";

export type SourceInventoryImportMode =
  | "seed-fixture"
  | "feed-fixture"
  | "calendar-fixture"
  | "calendar-html-import"
  | "live-api";

export type SourceInventoryStatus =
  | "checked-in"
  | "parsed"
  | "live"
  | "failed"
  | "not-configured";

export type SourceInventorySummary = {
  id: string;
  label: string;
  areaId: string;
  importMode: SourceInventoryImportMode;
  status: SourceInventoryStatus;
  freshnessLabel: string;
  eventCount: number;
  ticketLinkCount: number;
  activeCategories: ShowCategory[];
  activeCategoryCount: number;
  lastImportedAt?: string;
  inventorySource?: InventorySource;
  duplicateCount?: number;
  duplicateRatePercent?: number;
  discardedEventCount?: number;
  notes: string;
};

export type SourceInventorySummaryOptions = {
  areaId: string;
  referenceNow: string;
  parsedCalendarEvents?: LocalCalendarEvent[];
  parsedCalendarImportedAt?: string;
  ticketmasterConfigured: boolean;
  ticketmasterDiagnostics?: TicketmasterProviderDiagnosticsSummary;
  ticketmasterError?: string;
};

export function createSourceInventorySummaries({
  areaId,
  referenceNow,
  parsedCalendarEvents = [],
  parsedCalendarImportedAt,
  ticketmasterConfigured,
  ticketmasterDiagnostics,
  ticketmasterError
}: SourceInventorySummaryOptions): SourceInventorySummary[] {
  const seedShows = shows.filter((show) => show.areaId === areaId);
  const partnerShows = partnerFeedEvents.map(normalizeFeedEvent).filter((show) => show.areaId === areaId);
  const calendarFixtureShows = localCalendarEvents
    .map(normalizeCalendarEvent)
    .filter((show) => show.areaId === areaId);
  const parsedCalendarShows = parsedCalendarEvents
    .map(normalizeCalendarEvent)
    .filter((show) => show.areaId === areaId);

  return [
    createShowSourceSummary({
      id: `${areaId}-seed-catalog`,
      label: "Seed catalog",
      areaId,
      importMode: "seed-fixture",
      status: "checked-in",
      freshnessLabel: "checked-in fixture",
      shows: seedShows,
      notes: "Fallback inventory bundled with the app for no-key/no-network use."
    }),
    createShowSourceSummary({
      id: `${areaId}-partner-feed-fixtures`,
      label: "Partner feed fixtures",
      areaId,
      importMode: "feed-fixture",
      status: "checked-in",
      freshnessLabel: "checked-in fixture",
      shows: partnerShows,
      notes: "Normalized partner-feed examples for deal and link handling."
    }),
    createShowSourceSummary({
      id: `${areaId}-calendar-fixtures`,
      label: "Calendar feed fixtures",
      areaId,
      importMode: "calendar-fixture",
      status: "checked-in",
      freshnessLabel: "checked-in fixture",
      shows: calendarFixtureShows,
      notes: "Fixture-backed local calendar events used as importer targets."
    }),
    createShowSourceSummary({
      id: `${areaId}-html-calendar-import`,
      label: "HTML calendar import pilot",
      areaId,
      importMode: "calendar-html-import",
      status: "parsed",
      freshnessLabel: "parser sample import",
      shows: parsedCalendarShows,
      lastImportedAt: parsedCalendarImportedAt ?? referenceNow,
      notes: "Structured-data HTML calendar import output before scheduled crawling."
    }),
    createTicketmasterSourceSummary({
      areaId,
      configured: ticketmasterConfigured,
      diagnostics: ticketmasterDiagnostics,
      error: ticketmasterError,
      referenceNow
    })
  ];
}

function createShowSourceSummary({
  id,
  label,
  areaId,
  importMode,
  status,
  freshnessLabel,
  shows,
  notes,
  lastImportedAt
}: {
  id: string;
  label: string;
  areaId: string;
  importMode: SourceInventoryImportMode;
  status: SourceInventoryStatus;
  freshnessLabel: string;
  shows: Show[];
  notes: string;
  lastImportedAt?: string;
}): SourceInventorySummary {
  const activeCategories = getActiveCategories(shows);

  return {
    id,
    label,
    areaId,
    importMode,
    status,
    freshnessLabel,
    eventCount: shows.length,
    ticketLinkCount: shows.filter(hasTicketLink).length,
    activeCategories,
    activeCategoryCount: activeCategories.length,
    lastImportedAt,
    notes
  };
}

function createTicketmasterSourceSummary({
  areaId,
  configured,
  diagnostics,
  error,
  referenceNow
}: {
  areaId: string;
  configured: boolean;
  diagnostics?: TicketmasterProviderDiagnosticsSummary;
  error?: string;
  referenceNow: string;
}): SourceInventorySummary {
  if (configured && !diagnostics && error) {
    return {
      id: `${areaId}-ticketmaster-discovery`,
      label: "Ticketmaster Discovery",
      areaId,
      importMode: "live-api",
      status: "failed",
      freshnessLabel: "provider error",
      eventCount: 0,
      ticketLinkCount: 0,
      activeCategories: [],
      activeCategoryCount: 0,
      lastImportedAt: referenceNow,
      inventorySource: "primary-marketplace",
      notes: `Ticketmaster request failed; local fallback inventory remains available. ${error}`
    };
  }

  if (!configured || !diagnostics) {
    return {
      id: `${areaId}-ticketmaster-discovery`,
      label: "Ticketmaster Discovery",
      areaId,
      importMode: "live-api",
      status: "not-configured",
      freshnessLabel: "not configured",
      eventCount: 0,
      ticketLinkCount: 0,
      activeCategories: [],
      activeCategoryCount: 0,
      lastImportedAt: referenceNow,
      inventorySource: "primary-marketplace",
      notes: "Set EXPO_PUBLIC_TICKETMASTER_API_KEY in .env.local to fetch live inventory."
    };
  }

  return {
    id: `${areaId}-ticketmaster-discovery`,
    label: "Ticketmaster Discovery",
    areaId,
    importMode: "live-api",
    status: "live",
    freshnessLabel: "runtime live fetch",
    eventCount: diagnostics.filteredShowCount,
    ticketLinkCount: diagnostics.ticketLinkCount,
    activeCategories: diagnostics.categoryCounts.map((count) => count.id as ShowCategory),
    activeCategoryCount: diagnostics.categoryCounts.length,
    lastImportedAt: diagnostics.requestedAt,
    inventorySource: "primary-marketplace",
    duplicateCount: diagnostics.duplicateShowCount,
    duplicateRatePercent: diagnostics.duplicateRatePercent,
    discardedEventCount: diagnostics.discardedEventCount,
    notes: `${diagnostics.requestCount} requests, ${diagnostics.rawEventCount} raw provider events.`
  };
}

function hasTicketLink(show: Show): boolean {
  return show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)));
}

function getActiveCategories(shows: Show[]): ShowCategory[] {
  return Array.from(new Set(shows.map((show) => show.category)));
}
